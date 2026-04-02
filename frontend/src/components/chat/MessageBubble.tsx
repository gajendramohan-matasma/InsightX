"use client";

import { ThumbsUp, ThumbsDown, User, Bot } from "lucide-react";
import type { Message, FeedbackRequest } from "@/lib/types/chat";
import { StreamingResponse } from "./StreamingResponse";
import { ToolCallIndicator } from "./ToolCallIndicator";
import { DynamicChart } from "@/components/charts/DynamicChart";
import { cn } from "@/lib/utils/formatters";
import { formatDate } from "@/lib/utils/formatters";

interface MessageBubbleProps {
  message: Message;
  isStreaming?: boolean;
  onFeedback?: (feedback: FeedbackRequest) => void;
}

export function MessageBubble({ message, isStreaming = false, onFeedback }: MessageBubbleProps) {
  const isUser = message.role === "user";
  const toolCalls = message.metadata?.tool_calls ?? [];
  const charts = message.metadata?.charts ?? [];
  const feedback = message.metadata?.feedback;

  return (
    <div
      className={cn(
        "flex gap-3 w-full animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-jd-green flex items-center justify-center">
          <Bot className="h-4.5 w-4.5 text-white" />
        </div>
      )}

      <div className={cn("flex flex-col max-w-[75%] gap-1.5", isUser ? "items-end" : "items-start")}>
        {/* Tool indicators */}
        {toolCalls.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-1">
            {toolCalls.map((tc) => (
              <ToolCallIndicator key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Message bubble */}
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm",
            isUser
              ? "bg-jd-green text-white rounded-br-md"
              : "bg-white border border-border text-foreground rounded-bl-md shadow-sm"
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <StreamingResponse content={message.content} isStreaming={isStreaming} />
          )}
        </div>

        {/* Inline charts */}
        {charts.length > 0 && (
          <div className="w-full space-y-3 mt-1">
            {charts.map((chart, i) => (
              <div key={i} className="bg-white rounded-xl border border-border shadow-sm p-4">
                <DynamicChart spec={chart} />
              </div>
            ))}
          </div>
        )}

        {/* Feedback + timestamp row */}
        <div className="flex items-center gap-2 px-1">
          <span className="text-[11px] text-muted-foreground">
            {formatDate(message.created_at, { format: "relative" })}
          </span>

          {!isUser && !isStreaming && message.id && !message.id.startsWith("temp-") && onFeedback && (
            <div className="flex items-center gap-1">
              <button
                onClick={() =>
                  onFeedback({ message_id: message.id, feedback: "accepted" })
                }
                className={cn(
                  "p-1 rounded transition-colors",
                  feedback === "accepted"
                    ? "text-jd-green bg-jd-green-50"
                    : "text-muted-foreground hover:text-jd-green hover:bg-jd-green-50"
                )}
                title="Accept response"
              >
                <ThumbsUp className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() =>
                  onFeedback({ message_id: message.id, feedback: "rejected" })
                }
                className={cn(
                  "p-1 rounded transition-colors",
                  feedback === "rejected"
                    ? "text-destructive bg-red-50"
                    : "text-muted-foreground hover:text-destructive hover:bg-red-50"
                )}
                title="Reject response"
              >
                <ThumbsDown className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* User avatar */}
      {isUser && (
        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-jd-green-100 flex items-center justify-center">
          <User className="h-4.5 w-4.5 text-jd-green-700" />
        </div>
      )}
    </div>
  );
}
