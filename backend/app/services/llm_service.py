"""
Core LLM service implementing the agentic tool-use loop.

The process_chat function:
  1. Builds the conversation messages
  2. Calls Claude with tools
  3. If Claude returns tool_use blocks, executes them and loops
  4. Returns the final assistant response with parsed visualizations
  5. Optionally streams SSE events
"""

import json
import logging
import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any, AsyncGenerator, Dict, List, Optional

import anthropic
import httpx
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.llm.prompts import FINANCIAL_ANALYST_SYSTEM_PROMPT
from app.llm.response_parser import parse_assistant_response
from app.llm.tool_executor import execute_tool
from app.llm.tools import TOOLS
from app.models.conversation import Conversation, ConversationStatus, Message, MessageRole
from app.models.analytics_log import AnalyticsLog
from app.models.usage_metric import UsageMetric
from app.schemas.chat import ChatResponse, ChartSpec, DataTable, StreamEvent

logger = logging.getLogger(__name__)

MAX_TOOL_ITERATIONS = 10  # guard against infinite tool loops


async def process_chat(
    user_message: str,
    conversation_id: Optional[uuid.UUID],
    user_id: uuid.UUID,
    db: AsyncSession,
    http_client: httpx.AsyncClient,
) -> ChatResponse:
    """
    Process a user chat message through the full agentic loop.

    Returns a ChatResponse with the final text, visualizations, and data tables.
    """
    start_time = time.time()

    # 1. Load or create conversation
    conversation = await _get_or_create_conversation(conversation_id, user_id, db)

    # 2. Persist the user message
    user_msg = Message(
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=user_message,
    )
    db.add(user_msg)
    await db.flush()

    # 3. Build messages array for Claude
    messages = _build_messages(conversation)

    # 4. Run the agentic loop
    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    tool_calls_made: List[Dict[str, Any]] = []
    tool_results_accumulated: List[Dict[str, Any]] = []
    total_input_tokens = 0
    total_output_tokens = 0

    for iteration in range(MAX_TOOL_ITERATIONS):
        logger.info("Claude API call, iteration %d", iteration + 1)

        response = await client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=settings.ANTHROPIC_MAX_TOKENS,
            temperature=settings.ANTHROPIC_TEMPERATURE,
            system=FINANCIAL_ANALYST_SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        total_input_tokens += response.usage.input_tokens
        total_output_tokens += response.usage.output_tokens

        # Check if we have tool_use blocks
        tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

        if response.stop_reason == "end_turn" or not tool_use_blocks:
            # Final response - parse and return
            content_dicts = [_block_to_dict(b) for b in response.content]
            combined_text, visualizations, data_tables = parse_assistant_response(
                content_dicts, tool_results_accumulated
            )

            # Persist the assistant message
            assistant_msg = Message(
                conversation_id=conversation.id,
                role=MessageRole.ASSISTANT,
                content=combined_text,
                tool_calls=[tc for tc in tool_calls_made] if tool_calls_made else None,
                tool_results=[tr for tr in tool_results_accumulated] if tool_results_accumulated else None,
                metadata_={
                    "model": settings.ANTHROPIC_MODEL,
                    "input_tokens": total_input_tokens,
                    "output_tokens": total_output_tokens,
                    "iterations": iteration + 1,
                    "visualizations_count": len(visualizations),
                },
            )
            db.add(assistant_msg)

            # Update conversation title if this is the first exchange
            if len(conversation.messages) <= 2:
                conversation.title = _generate_title(user_message)

            # Log usage metric
            elapsed_ms = int((time.time() - start_time) * 1000)
            usage = UsageMetric(
                user_id=user_id,
                metric_type="chat",
                metric_value={
                    "iterations": iteration + 1,
                    "tool_calls": len(tool_calls_made),
                },
                endpoint="/api/chat",
                tokens_used=total_input_tokens + total_output_tokens,
                cost_estimate=_estimate_cost(total_input_tokens, total_output_tokens),
            )
            db.add(usage)

            await db.flush()

            return ChatResponse(
                conversation_id=conversation.id,
                message_id=assistant_msg.id,
                content=combined_text,
                visualizations=visualizations,
                data_tables=data_tables,
                tool_calls_made=tool_calls_made,
            )

        # We have tool_use blocks - execute them and continue
        # Add the assistant's response (with tool_use) to messages
        messages.append({
            "role": "assistant",
            "content": [_block_to_dict(b) for b in response.content],
        })

        # Execute each tool and collect results
        tool_result_blocks: List[Dict[str, Any]] = []
        for tool_block in tool_use_blocks:
            tool_name = tool_block.name
            tool_input = tool_block.input
            tool_use_id = tool_block.id

            logger.info("Executing tool: %s (id: %s)", tool_name, tool_use_id)

            tool_calls_made.append({
                "tool_name": tool_name,
                "tool_input": tool_input,
                "tool_use_id": tool_use_id,
            })

            # Execute the tool
            result = await execute_tool(
                tool_name=tool_name,
                tool_input=tool_input,
                http_client=http_client,
                db=db,
            )
            tool_results_accumulated.append(result)

            # Log analytics
            latency_ms = result.pop("_latency_ms", 0)
            analytics_log = AnalyticsLog(
                conversation_id=conversation.id,
                message_id=user_msg.id,
                analysis_type=tool_name,
                data_source=_infer_data_source(tool_name),
                query_params=tool_input,
                result_summary=_summarize_result(result),
                latency_ms=latency_ms,
            )
            db.add(analytics_log)

            # Format result for Claude
            tool_result_blocks.append({
                "type": "tool_result",
                "tool_use_id": tool_use_id,
                "content": json.dumps(result, default=str),
            })

        # Add tool results to messages
        messages.append({
            "role": "user",
            "content": tool_result_blocks,
        })

    # If we exhausted iterations
    logger.warning("Max tool iterations (%d) reached", MAX_TOOL_ITERATIONS)
    return ChatResponse(
        conversation_id=conversation.id,
        message_id=uuid.uuid4(),
        content="I was unable to complete the analysis within the allowed number of steps. Please try a simpler query.",
        visualizations=[],
        data_tables=[],
        tool_calls_made=tool_calls_made,
    )


async def process_chat_stream(
    user_message: str,
    conversation_id: Optional[uuid.UUID],
    user_id: uuid.UUID,
    db: AsyncSession,
    http_client: httpx.AsyncClient,
) -> AsyncGenerator[StreamEvent, None]:
    """
    Streaming version of process_chat that yields SSE events.
    """
    start_time = time.time()
    conversation = await _get_or_create_conversation(conversation_id, user_id, db)

    user_msg = Message(
        conversation_id=conversation.id,
        role=MessageRole.USER,
        content=user_message,
    )
    db.add(user_msg)
    await db.flush()

    messages = _build_messages(conversation)
    client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)
    tool_calls_made: List[Dict[str, Any]] = []
    tool_results_accumulated: List[Dict[str, Any]] = []
    total_input_tokens = 0
    total_output_tokens = 0

    for iteration in range(MAX_TOOL_ITERATIONS):
        response = await client.messages.create(
            model=settings.ANTHROPIC_MODEL,
            max_tokens=settings.ANTHROPIC_MAX_TOKENS,
            temperature=settings.ANTHROPIC_TEMPERATURE,
            system=FINANCIAL_ANALYST_SYSTEM_PROMPT,
            tools=TOOLS,
            messages=messages,
        )

        total_input_tokens += response.usage.input_tokens
        total_output_tokens += response.usage.output_tokens

        tool_use_blocks = [b for b in response.content if b.type == "tool_use"]

        if response.stop_reason == "end_turn" or not tool_use_blocks:
            # Stream final text
            for block in response.content:
                if block.type == "text":
                    yield StreamEvent(
                        event="text_delta",
                        data={"text": block.text},
                    )

            # Stream visualizations and tables from tool results
            _, visualizations, data_tables = parse_assistant_response(
                [_block_to_dict(b) for b in response.content],
                tool_results_accumulated,
            )
            for viz in visualizations:
                yield StreamEvent(
                    event="visualization",
                    data=viz.dict(),
                )

            yield StreamEvent(
                event="done",
                data={
                    "conversation_id": str(conversation.id),
                    "message_id": str(user_msg.id),
                    "tool_calls_count": len(tool_calls_made),
                    "total_tokens": total_input_tokens + total_output_tokens,
                },
            )
            return

        # Handle tool calls
        messages.append({
            "role": "assistant",
            "content": [_block_to_dict(b) for b in response.content],
        })

        tool_result_blocks: List[Dict[str, Any]] = []
        for tool_block in tool_use_blocks:
            yield StreamEvent(
                event="tool_start",
                data={"tool_name": tool_block.name, "tool_input": tool_block.input},
            )

            result = await execute_tool(
                tool_name=tool_block.name,
                tool_input=tool_block.input,
                http_client=http_client,
                db=db,
            )
            tool_results_accumulated.append(result)
            tool_calls_made.append({
                "tool_name": tool_block.name,
                "tool_input": tool_block.input,
            })

            latency_ms = result.pop("_latency_ms", 0)

            yield StreamEvent(
                event="tool_result",
                data={
                    "tool_name": tool_block.name,
                    "success": "error" not in result,
                    "latency_ms": latency_ms,
                },
            )

            tool_result_blocks.append({
                "type": "tool_result",
                "tool_use_id": tool_block.id,
                "content": json.dumps(result, default=str),
            })

        messages.append({"role": "user", "content": tool_result_blocks})

    yield StreamEvent(
        event="error",
        data={"message": "Max tool iterations reached."},
    )


# ── Helper Functions ─────────────────────────────────────────────

async def _get_or_create_conversation(
    conversation_id: Optional[uuid.UUID],
    user_id: uuid.UUID,
    db: AsyncSession,
) -> Conversation:
    """Load existing conversation or create a new one."""
    if conversation_id:
        from sqlalchemy import select
        stmt = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.user_id == user_id,
        )
        result = await db.execute(stmt)
        conversation = result.scalar_one_or_none()
        if conversation:
            return conversation

    # Create new conversation
    conversation = Conversation(
        user_id=user_id,
        title="New Conversation",
        status=ConversationStatus.ACTIVE,
    )
    db.add(conversation)
    await db.flush()
    return conversation


def _build_messages(conversation: Conversation) -> List[Dict[str, Any]]:
    """Build the messages array for Claude from conversation history."""
    messages: List[Dict[str, Any]] = []
    for msg in conversation.messages:
        if msg.role == MessageRole.USER:
            messages.append({"role": "user", "content": msg.content})
        elif msg.role == MessageRole.ASSISTANT:
            messages.append({"role": "assistant", "content": msg.content})
    return messages


def _block_to_dict(block: Any) -> Dict[str, Any]:
    """Convert an Anthropic content block to a plain dict."""
    if block.type == "text":
        return {"type": "text", "text": block.text}
    elif block.type == "tool_use":
        return {
            "type": "tool_use",
            "id": block.id,
            "name": block.name,
            "input": block.input,
        }
    return {"type": block.type}


def _generate_title(user_message: str) -> str:
    """Generate a conversation title from the first user message."""
    title = user_message.strip()
    if len(title) > 80:
        title = title[:77] + "..."
    return title


def _infer_data_source(tool_name: str) -> str:
    """Infer the data source from the tool name."""
    if "anaplan" in tool_name:
        return "anaplan"
    elif "powerbi" in tool_name:
        return "powerbi"
    elif tool_name in ("calculate_variance", "calculate_trend", "calculate_ratios", "generate_forecast"):
        return "analytics"
    elif tool_name == "generate_visualization":
        return "visualization"
    return "system"


def _summarize_result(result: Dict[str, Any]) -> Dict[str, Any]:
    """Create a compact summary of a tool result for logging."""
    summary: Dict[str, Any] = {}
    if "error" in result:
        summary["error"] = str(result["error"])[:500]
    if "row_count" in result:
        summary["row_count"] = result["row_count"]
    if "success" in result:
        summary["success"] = result["success"]
    if "total_variance_pct" in result:
        summary["total_variance_pct"] = result["total_variance_pct"]
    if "trend_direction" in result:
        summary["trend_direction"] = result["trend_direction"]
    if "method_used" in result:
        summary["method_used"] = result["method_used"]
    return summary


def _estimate_cost(input_tokens: int, output_tokens: int) -> Decimal:
    """Estimate API cost based on Claude pricing (approximate)."""
    # Claude 3.5 Sonnet pricing: $3/M input, $15/M output
    input_cost = Decimal(str(input_tokens)) * Decimal("0.000003")
    output_cost = Decimal(str(output_tokens)) * Decimal("0.000015")
    return input_cost + output_cost
