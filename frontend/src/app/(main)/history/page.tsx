"use client";

import { useState, useEffect, useCallback } from "react";
import { History, Search, MessageSquare, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiClient } from "@/lib/api-client";
import { formatDate, truncate } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/formatters";
import type { Conversation } from "@/lib/types/chat";
import Link from "next/link";

export default function HistoryPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiClient.get<{ conversations: Conversation[] }>("conversations", {
        params: { search: searchQuery || undefined },
      });
      setConversations(data.conversations);
    } catch {
      setConversations([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    const debounce = setTimeout(loadConversations, 300);
    return () => clearTimeout(debounce);
  }, [loadConversations]);

  return (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-green-50 flex items-center justify-center">
              <History className="h-5 w-5 text-green-700" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Conversation History</h1>
              <p className="text-sm text-gray-500">Browse and resume past conversations</p>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search conversations..."
              className="w-full h-10 pl-10 pr-4 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-jd-green focus:border-jd-green"
            />
          </div>
        </div>

        {/* Conversation list */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-full max-w-md" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <MessageSquare className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h2 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? "No Results Found" : "No Conversations Yet"}
              </h2>
              <p className="text-sm text-muted-foreground text-center max-w-sm">
                {searchQuery
                  ? "Try a different search term."
                  : "Start a new chat to see your conversation history here."}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {conversations.map((conv) => (
              <Link key={conv.id} href={`/chat?conversation=${conv.id}`}>
                <Card className="hover:border-jd-green-200 hover:shadow-md transition-all cursor-pointer group">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="h-10 w-10 rounded-lg bg-jd-green-50 flex items-center justify-center shrink-0">
                        <MessageSquare className="h-5 w-5 text-jd-green" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-sm font-semibold text-foreground truncate">
                            {conv.title}
                          </h3>
                          <Badge variant="default">{conv.message_count} msgs</Badge>
                        </div>
                        {conv.last_message_preview && (
                          <p className="text-xs text-muted-foreground truncate">
                            {truncate(conv.last_message_preview, 100)}
                          </p>
                        )}
                        <p className="text-[11px] text-muted-foreground/70 mt-1">
                          {formatDate(conv.updated_at, { format: "long" })}
                        </p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-jd-green transition-colors shrink-0 mt-1" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
