export interface ConnectorStatus {
  id: string;
  name: string;
  type: "anaplan" | "powerbi" | "sap" | "oracle" | "custom";
  status: "connected" | "disconnected" | "error" | "syncing";
  last_sync: string | null;
  next_sync: string | null;
  record_count: number;
  error_message?: string;
  config: ConnectorConfig;
}

export interface ConnectorConfig {
  base_url?: string;
  workspace_id?: string;
  model_id?: string;
  refresh_interval_minutes: number;
  auth_method: "oauth2" | "api_key" | "basic";
}

export interface AnaplanWorkspace {
  id: string;
  name: string;
  models: AnaplanModel[];
  active: boolean;
}

export interface AnaplanModel {
  id: string;
  name: string;
  modules: AnaplanModule[];
  last_modified: string;
  status: "active" | "archived";
}

export interface AnaplanModule {
  id: string;
  name: string;
  line_item_count: number;
  category: string;
}

export interface PowerBIReport {
  id: string;
  name: string;
  description?: string;
  workspace_id: string;
  workspace_name: string;
  embed_url: string;
  embed_token?: string;
  dataset_id: string;
  created_at: string;
  modified_at: string;
  report_type: "PowerBIReport" | "PaginatedReport";
}

export interface PowerBIEmbedConfig {
  report_id: string;
  embed_url: string;
  embed_token: string;
  token_expiry: string;
}
