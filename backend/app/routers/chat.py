"""
Chat router: conversation management and message processing.
"""

import json
import logging
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

import httpx

from app.dependencies import get_db, get_httpx_client
from app.middleware.auth import get_current_user
from app.models.conversation import Conversation, ConversationStatus, Message
from app.models.user import User
from app.schemas.chat import (
    ChatRequest,
    ChatResponse,
    ConversationListItem,
    ConversationSchema,
    FeedbackRequest,
    MessageSchema,
)
from app.services.llm_service import process_chat, process_chat_stream

logger = logging.getLogger(__name__)

router = APIRouter()


# ── Chat Endpoint ────────────────────────────────────────────────

@router.post("", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    http_client: httpx.AsyncClient = Depends(get_httpx_client),
):
    """
    Process a chat message through the agentic LLM loop.
    Creates a new conversation if conversation_id is not provided.
    """
    try:
        response = await process_chat(
            user_message=request.message,
            conversation_id=request.conversation_id,
            user_id=user.id,
            db=db,
            http_client=http_client,
        )
        return response
    except Exception as e:
        logger.error("Chat processing failed: %s", str(e), exc_info=True)
        # Log error to database
        from app.models.error_log import ErrorLog, ErrorSeverity
        import traceback

        error_log = ErrorLog(
            error_type="ChatProcessingError",
            error_message=str(e),
            stack_trace=traceback.format_exc(),
            severity=ErrorSeverity.HIGH,
            conversation_id=request.conversation_id,
        )
        db.add(error_log)
        await db.flush()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your message. Please try again.",
        )


@router.post("/stream")
async def chat_stream(
    request: ChatRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    http_client: httpx.AsyncClient = Depends(get_httpx_client),
):
    """
    Stream chat response as Server-Sent Events (SSE).
    """

    async def event_generator():
        try:
            async for event in process_chat_stream(
                user_message=request.message,
                conversation_id=request.conversation_id,
                user_id=user.id,
                db=db,
                http_client=http_client,
            ):
                yield f"event: {event.event}\ndata: {json.dumps(event.data, default=str)}\n\n"
        except Exception as e:
            logger.error("Stream error: %s", str(e))
            error_payload = json.dumps({"message": str(e)})
            yield f"event: error\ndata: {error_payload}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


# ── Conversations ────────────────────────────────────────────────

@router.get("/conversations")
async def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status_filter: Optional[str] = Query(None, alias="status"),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List conversations for the current user."""
    stmt = (
        select(Conversation)
        .where(Conversation.user_id == user.id)
        .order_by(desc(Conversation.updated_at))
    )

    if status_filter:
        stmt = stmt.where(Conversation.status == status_filter)

    # Count total
    count_stmt = (
        select(func.count(Conversation.id))
        .where(Conversation.user_id == user.id)
    )
    if status_filter:
        count_stmt = count_stmt.where(Conversation.status == status_filter)

    total_result = await db.execute(count_stmt)
    total = total_result.scalar() or 0

    # Paginate
    stmt = stmt.offset((page - 1) * page_size).limit(page_size)
    result = await db.execute(stmt)
    conversations = result.scalars().all()

    # Build response with message counts
    items = []
    for conv in conversations:
        msg_count_stmt = select(func.count(Message.id)).where(
            Message.conversation_id == conv.id
        )
        msg_count_result = await db.execute(msg_count_stmt)
        msg_count = msg_count_result.scalar() or 0

        items.append(ConversationListItem(
            id=conv.id,
            title=conv.title,
            status=conv.status.value,
            created_at=conv.created_at,
            updated_at=conv.updated_at,
            message_count=msg_count,
        ))

    return {
        "items": items,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": (total + page_size - 1) // page_size,
    }


@router.get("/conversations/{conversation_id}", response_model=ConversationSchema)
async def get_conversation(
    conversation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get a conversation with all its messages."""
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user.id,
    )
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    # Load messages
    msg_stmt = (
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.created_at)
    )
    msg_result = await db.execute(msg_stmt)
    messages = msg_result.scalars().all()

    return ConversationSchema(
        id=conversation.id,
        user_id=conversation.user_id,
        title=conversation.title,
        status=conversation.status.value,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        messages=[
            MessageSchema(
                id=m.id,
                conversation_id=m.conversation_id,
                role=m.role.value,
                content=m.content,
                tool_calls=m.tool_calls,
                tool_results=m.tool_results,
                metadata=m.metadata_,
                accepted=m.accepted,
                created_at=m.created_at,
            )
            for m in messages
        ],
    )


@router.delete("/conversations/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: uuid.UUID,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Archive (soft-delete) a conversation."""
    stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user.id,
    )
    result = await db.execute(stmt)
    conversation = result.scalar_one_or_none()

    if not conversation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    conversation.status = ConversationStatus.ARCHIVED
    await db.flush()


# ── Feedback ─────────────────────────────────────────────────────

@router.post(
    "/conversations/{conversation_id}/messages/{message_id}/feedback",
    status_code=status.HTTP_200_OK,
)
async def submit_feedback(
    conversation_id: uuid.UUID,
    message_id: uuid.UUID,
    feedback: FeedbackRequest,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit feedback (accept/reject) for an assistant message."""
    # Verify the conversation belongs to the user
    conv_stmt = select(Conversation).where(
        Conversation.id == conversation_id,
        Conversation.user_id == user.id,
    )
    conv_result = await db.execute(conv_stmt)
    if not conv_result.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Conversation not found",
        )

    # Find the message
    msg_stmt = select(Message).where(
        Message.id == message_id,
        Message.conversation_id == conversation_id,
    )
    msg_result = await db.execute(msg_stmt)
    message = msg_result.scalar_one_or_none()

    if not message:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Message not found",
        )

    message.accepted = feedback.accepted
    if feedback.comment:
        meta = message.metadata_ or {}
        meta["feedback_comment"] = feedback.comment
        message.metadata_ = meta

    await db.flush()

    return {"status": "ok", "message_id": str(message.id), "accepted": feedback.accepted}
