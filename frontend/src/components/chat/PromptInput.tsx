"use client";

import { useState, useRef, useCallback, type KeyboardEvent } from "react";
import { Send, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils/formatters";

interface PromptInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

const suggestedPrompts = [
  "Show TWP plan vs actual by location",
  "What is the current FTE distribution?",
  "Compare CPH trends across departments",
  "Show AI tools utilization by role",
];

export function PromptInput({
  onSend,
  disabled = false,
  placeholder = "Ask about operational data...",
}: PromptInputProps) {
  const [value, setValue] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = useCallback(() => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  }, [value, disabled, onSend]);

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }

  return (
    <div className="border-t border-border bg-white p-4">
      {/* Suggested prompts */}
      {value.length === 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {suggestedPrompts.map((prompt) => (
            <button
              key={prompt}
              onClick={() => onSend(prompt)}
              disabled={disabled}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-jd-green-200",
                "text-xs font-medium text-jd-green-700 bg-jd-green-50",
                "hover:bg-jd-green-100 hover:border-jd-green-300 transition-colors",
                "disabled:opacity-50 disabled:pointer-events-none"
              )}
            >
              <Sparkles className="h-3 w-3" />
              {prompt}
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-end gap-2">
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder={placeholder}
            disabled={disabled}
            rows={1}
            className={cn(
              "w-full resize-none rounded-xl border border-border bg-muted px-4 py-3 pr-12 text-sm",
              "placeholder:text-muted-foreground",
              "focus:outline-none focus:ring-2 focus:ring-jd-green focus:border-jd-green focus:bg-white",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all"
            )}
          />
        </div>
        <button
          onClick={handleSubmit}
          disabled={!value.trim() || disabled}
          className={cn(
            "flex-shrink-0 h-11 w-11 rounded-xl flex items-center justify-center transition-colors",
            "bg-jd-green text-white hover:bg-jd-green-dark",
            "disabled:opacity-40 disabled:pointer-events-none"
          )}
          title="Send message"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
