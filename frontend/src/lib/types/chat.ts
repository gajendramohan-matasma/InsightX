export interface Message {
  id: string;
  conversation_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
  metadata?: MessageMetadata;
}

export interface MessageMetadata {
  tool_calls?: ToolCall[];
  charts?: ChartSpec[];
  feedback?: "accepted" | "rejected" | null;
  latency_ms?: number;
  model?: string;
  tokens_used?: number;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
  result?: unknown;
  status: "pending" | "running" | "completed" | "error";
  duration_ms?: number;
}

export interface ChartSpec {
  chart_type: "bar" | "line" | "pie" | "area" | "scatter" | "kpi" | "table";
  title: string;
  data: Record<string, unknown>[];
  x_key?: string;
  y_keys?: string[];
  colors?: string[];
  x_label?: string;
  y_label?: string;
  value?: number;
  label?: string;
  trend?: number;
  columns?: TableColumn[];
}

export interface TableColumn {
  key: string;
  header: string;
  format?: "currency" | "percentage" | "number" | "date" | "text";
  align?: "left" | "center" | "right";
}

export interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  message_count: number;
  last_message_preview?: string;
}

export interface StreamEvent {
  event: "text_delta" | "tool_start" | "tool_result" | "visualization" | "done" | "error";
  data: StreamEventData;
}

export type StreamEventData =
  | { delta: string }
  | { tool_call: ToolCall }
  | { tool_call_id: string; result: unknown }
  | { chart: ChartSpec }
  | { message_id: string; conversation_id: string }
  | { error: string; code?: string };

export interface SendMessageRequest {
  message: string;
  conversation_id?: string;
}

export interface FeedbackRequest {
  message_id: string;
  feedback: "accepted" | "rejected";
  comment?: string;
}
