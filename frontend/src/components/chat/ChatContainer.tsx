"use client";

import { useEffect, useRef } from "react";
import { MessageBubble } from "./MessageBubble";
import { PromptInput } from "./PromptInput";
import { useChat } from "@/lib/hooks/useChat";
import { MessageSquare } from "lucide-react";

interface ChatContainerProps {
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
}

export function ChatContainer({ conversationId, onConversationCreated }: ChatContainerProps) {
  const {
    messages,
    isStreaming,
    error,
    sendMessage,
    submitFeedback,
    loadConversation,
  } = useChat({
    conversationId,
    onConversationCreated,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conversationId) {
      loadConversation(conversationId);
    }
  }, [conversationId, loadConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="h-16 w-16 rounded-2xl bg-jd-green-50 flex items-center justify-center mb-4">
              <MessageSquare className="h-8 w-8 text-jd-green" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              InsightX
            </h2>
            <p className="text-sm text-muted-foreground max-w-md">
              Ask questions about operational data, workforce planning, variance analysis,
              and more. I can query Anaplan, Power BI, and other connected data sources.
            </p>
          </div>
        ) : (
          <div className="p-6 space-y-6">
            {messages.map((msg, i) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant"}
                onFeedback={submitFeedback}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error banner */}
      {error && (
        <div className="mx-4 mb-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Prompt input */}
      <PromptInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  );
}
