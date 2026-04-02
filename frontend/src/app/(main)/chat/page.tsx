"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageSquare, Plus, Search } from "lucide-react";
import { ChatContainer } from "@/components/chat/ChatContainer";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils/formatters";
import { formatDate, truncate } from "@/lib/utils/formatters";
import type { Conversation } from "@/lib/types/chat";

export default function ChatPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | undefined>();
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const loadConversations = useCallback(async () => {
    try {
      const data = await apiClient.get<{ conversations: Conversation[] }>("conversations");
      setConversations(data.conversations);
    } catch {
      // silently fail - conversations may not be available yet
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  function handleNewChat() {
    setActiveConversationId(undefined);
  }

  function handleConversationCreated(id: string) {
    setActiveConversationId(id);
    loadConversations();
  }

  const filteredConversations = conversations.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-full">
      {/* Conversation sidebar */}
      {sidebarOpen && (
        <div className="w-72 border-r border-border bg-muted/30 flex flex-col shrink-0">
          <div className="p-4 border-b border-border">
            <Button
              variant="primary"
              size="sm"
              className="w-full"
              onClick={handleNewChat}
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>

          {/* Search */}
          <div className="p-4 pb-0">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full h-8 pl-8 pr-3 text-xs rounded-md border border-border bg-white focus:outline-none focus:ring-1 focus:ring-jd-green"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto scrollbar-thin p-2 space-y-0.5">
            {filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {conversations.length === 0
                    ? "Start a new conversation"
                    : "No matching conversations"}
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setActiveConversationId(conv.id)}
                  className={cn(
                    "w-full text-left px-3 py-2.5 rounded-lg transition-colors",
                    "hover:bg-jd-green-50",
                    activeConversationId === conv.id
                      ? "bg-jd-green-50 border border-jd-green-200"
                      : "border border-transparent"
                  )}
                >
                  <p className="text-sm font-medium text-foreground truncate">
                    {conv.title}
                  </p>
                  {conv.last_message_preview && (
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {truncate(conv.last_message_preview, 60)}
                    </p>
                  )}
                  <p className="text-[10px] text-muted-foreground/70 mt-1">
                    {formatDate(conv.updated_at, { format: "relative" })}
                    {" \u00B7 "}
                    {conv.message_count} messages
                  </p>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 min-w-0">
        <ChatContainer
          conversationId={activeConversationId}
          onConversationCreated={handleConversationCreated}
        />
      </div>
    </div>
  );
}
