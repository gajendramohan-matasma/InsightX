"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils/formatters";

interface StreamingResponseProps {
  content: string;
  isStreaming: boolean;
  className?: string;
}

export function StreamingResponse({ content, isStreaming, className }: StreamingResponseProps) {
  if (!content && isStreaming) {
    return (
      <div className={cn("flex items-center gap-1.5", className)}>
        <span className="h-2 w-2 rounded-full bg-jd-green animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="h-2 w-2 rounded-full bg-jd-green animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="h-2 w-2 rounded-full bg-jd-green animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    );
  }

  return (
    <div className={cn("prose prose-sm max-w-none", isStreaming && "streaming-cursor", className)}>
      <ReactMarkdown
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-semibold text-foreground">{children}</strong>
          ),
          ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          code: ({ children, className: codeClassName }) => {
            const isInline = !codeClassName;
            if (isInline) {
              return (
                <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono text-jd-green-700">
                  {children}
                </code>
              );
            }
            return (
              <code className={cn("block bg-gray-900 text-gray-100 p-3 rounded-lg text-xs font-mono overflow-x-auto", codeClassName)}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <pre className="mb-2">{children}</pre>,
          table: ({ children }) => (
            <div className="overflow-x-auto mb-2">
              <table className="w-full text-sm border-collapse border border-border">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="bg-jd-green-50 px-3 py-2 text-left font-medium border border-border">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 border border-border">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
