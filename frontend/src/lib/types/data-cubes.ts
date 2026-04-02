export interface DataCubeColumn {
  name: string;
  type: "string" | "number" | "date" | "currency" | "percentage";
  description?: string;
}

export interface DataCubeConfig {
  source_type: string;
  connection_id?: string;
  query?: string;
  export_name?: string;
}

export interface DataCube {
  id: string;
  name: string;
  description: string | null;
  source: "anaplan" | "powerbi" | "manual";
  status: "active" | "inactive" | "error";
  config: DataCubeConfig;
  schema_definition: DataCubeColumn[];
  refresh_schedule: "manual" | "hourly" | "daily";
  last_refreshed_at: string | null;
  row_count: number;
  created_at: string;
  updated_at: string;
}

export interface DataCubeData {
  columns: string[];
  rows: Record<string, unknown>[];
  total: number;
  limit: number;
  offset: number;
}
