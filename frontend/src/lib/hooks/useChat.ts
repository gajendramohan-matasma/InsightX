"use client";

import { useState, useCallback, useRef } from "react";
import type { Message, ChartSpec, ToolCall, FeedbackRequest } from "@/lib/types/chat";
import { apiClient } from "@/lib/api-client";

interface UseChatOptions {
  conversationId?: string;
  onConversationCreated?: (id: string) => void;
}

interface UseChatReturn {
  messages: Message[];
  isStreaming: boolean;
  activeToolCalls: ToolCall[];
  charts: ChartSpec[];
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  submitFeedback: (feedback: FeedbackRequest) => Promise<void>;
  loadConversation: (conversationId: string) => Promise<void>;
  clearMessages: () => void;
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCall[]>([]);
  const [charts, setCharts] = useState<ChartSpec[]>([]);
  const [error, setError] = useState<string | null>(null);
  const conversationIdRef = useRef(options.conversationId);
  const abortRef = useRef<(() => void) | null>(null);

  const loadConversation = useCallback(async (convId: string) => {
    try {
      const data = await apiClient.get<{ messages: Message[] }>(
        `conversations/${convId}/messages`
      );
      setMessages(data.messages);
      conversationIdRef.current = convId;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load conversation");
    }
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (isStreaming) return;

      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationIdRef.current ?? "",
        role: "user",
        content,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsStreaming(true);
      setError(null);
      setActiveToolCalls([]);
      setCharts([]);

      const assistantMessage: Message = {
        id: `temp-assistant-${Date.now()}`,
        conversation_id: conversationIdRef.current ?? "",
        role: "assistant",
        content: "",
        created_at: new Date().toISOString(),
        metadata: { tool_calls: [], charts: [] },
      };

      setMessages((prev) => [...prev, assistantMessage]);

      try {
        const stream = apiClient.stream("chat", {
          message: content,
          conversation_id: conversationIdRef.current,
        });

        abortRef.current = stream.abort;
        const reader = await stream.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const event = JSON.parse(jsonStr);

              switch (event.event) {
                case "text_delta": {
                  const delta = event.data?.delta ?? "";
                  setMessages((prev) => {
                    const updated = [...prev];
                    const last = updated[updated.length - 1];
                    if (last?.role === "assistant") {
                      updated[updated.length - 1] = {
                        ...last,
                        content: last.content + delta,
                      };
                    }
                    return updated;
                  });
                  break;
                }

                case "tool_start": {
                  const toolCall = event.data?.tool_call as ToolCall;
                  if (toolCall) {
                    setActiveToolCalls((prev) => [...prev, toolCall]);
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last?.role === "assistant" && last.metadata) {
                        const calls = last.metadata.tool_calls ?? [];
                        updated[updated.length - 1] = {
                          ...last,
                          metadata: {
                            ...last.metadata,
                            tool_calls: [...calls, toolCall],
                          },
                        };
                      }
                      return updated;
                    });
                  }
                  break;
                }

                case "tool_result": {
                  const toolCallId = event.data?.tool_call_id;
                  setActiveToolCalls((prev) =>
                    prev.map((tc) =>
                      tc.id === toolCallId
                        ? { ...tc, status: "completed" as const, result: event.data?.result }
                        : tc
                    )
                  );
                  break;
                }

                case "visualization": {
                  const chart = event.data?.chart as ChartSpec;
                  if (chart) {
                    setCharts((prev) => [...prev, chart]);
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last?.role === "assistant" && last.metadata) {
                        const existingCharts = last.metadata.charts ?? [];
                        updated[updated.length - 1] = {
                          ...last,
                          metadata: {
                            ...last.metadata,
                            charts: [...existingCharts, chart],
                          },
                        };
                      }
                      return updated;
                    });
                  }
                  break;
                }

                case "done": {
                  const messageId = event.data?.message_id;
                  const convId = event.data?.conversation_id;
                  if (convId && !conversationIdRef.current) {
                    conversationIdRef.current = convId;
                    options.onConversationCreated?.(convId);
                  }
                  if (messageId) {
                    setMessages((prev) => {
                      const updated = [...prev];
                      const last = updated[updated.length - 1];
                      if (last?.role === "assistant") {
                        updated[updated.length - 1] = {
                          ...last,
                          id: messageId,
                          conversation_id: convId ?? last.conversation_id,
                        };
                      }
                      return updated;
                    });
                  }
                  break;
                }

                case "error": {
                  setError(event.data?.error ?? "An error occurred");
                  break;
                }
              }
            } catch {
              // skip malformed JSON lines
            }
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setError(err instanceof Error ? err.message : "Failed to send message");
        }
      } finally {
        setIsStreaming(false);
        setActiveToolCalls([]);
        abortRef.current = null;
      }
    },
    [isStreaming, options]
  );

  const submitFeedback = useCallback(async (feedback: FeedbackRequest) => {
    try {
      await apiClient.post("feedback", feedback);
      setMessages((prev) =>
        prev.map((m) =>
          m.id === feedback.message_id
            ? { ...m, metadata: { ...m.metadata, feedback: feedback.feedback } }
            : m
        )
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit feedback");
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
    setCharts([]);
    setError(null);
    conversationIdRef.current = undefined;
  }, []);

  return {
    messages,
    isStreaming,
    activeToolCalls,
    charts,
    error,
    sendMessage,
    submitFeedback,
    loadConversation,
    clearMessages,
  };
}
