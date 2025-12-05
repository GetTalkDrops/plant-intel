// ============================================================================
// Plant Intel API Types
// TypeScript interfaces for all API request/response payloads
// ============================================================================

// ============================================================================
// Mapping Profiles
// ============================================================================

export interface MappingProfile {
  id: string;
  org_id: string;
  user_id: string;
  name: string;
  description?: string;
  erp_system?: string;
  mappings: Record<string, string>; // { target_variable: source_column }
  created_at: string;
  updated_at: string;
  last_used_at?: string;
}

export interface CreateMappingProfileRequest {
  name: string;
  description?: string;
  erp_system?: string;
  mappings: Record<string, string>;
}

export interface UpdateMappingProfileRequest {
  name?: string;
  description?: string;
  erp_system?: string;
  mappings?: Record<string, string>;
}

// ============================================================================
// Analyses
// ============================================================================

export interface Analysis {
  id: string;
  org_id: string;
  user_id: string;
  batch_id: string;
  data_tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  analyzers_run: string[];
  insights: AnalysisInsights;
  execution_time_ms?: number;
  created_at: string;
}

export interface AnalysisInsights {
  urgent: Insight[];
  notable: Insight[];
  summary: Record<string, any>;
}

export interface Insight {
  type: 'cost' | 'quality' | 'efficiency' | 'equipment';
  severity: 'urgent' | 'notable';
  title: string;
  description: string;
  impact_amount?: number;
  impact_unit?: string;
  related_entities?: string[];
  recommendation?: string;
  confidence?: number;
}

// ============================================================================
// Chat
// ============================================================================

export interface ChatMessage {
  id: string;
  org_id: string;
  user_id: string;
  analysis_id?: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface SendChatMessageRequest {
  message: string;
  analysis_id?: string;
}

export interface SendChatMessageResponse {
  id: string;
  message: string;
  response: string;
  created_at: string;
}

// ============================================================================
// CSV Upload
// ============================================================================

export interface UploadCSVResponse {
  batch_id: string;
  file_name: string;
  row_count: number;
  columns: string[];
  data_tier: 'Tier 1' | 'Tier 2' | 'Tier 3';
  suggested_mappings?: Record<string, string>;
  message: string;
}

// ============================================================================
// Work Orders (from uploaded CSV)
// ============================================================================

export interface WorkOrder {
  id: string;
  org_id: string;
  batch_id: string;
  work_order_number: string;
  product_name?: string;
  product_code?: string;
  quantity_planned?: number;
  quantity_produced?: number;
  quantity_scrapped?: number;
  start_date?: string;
  end_date?: string;
  status?: string;
  machine_id?: string;
  operator_id?: string;
  labor_hours?: number;
  material_cost?: number;
  labor_cost?: number;
  overhead_cost?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Analyzer Config
// ============================================================================

export interface AnalyzerConfig {
  id: string;
  org_id: string;
  preset?: 'conservative' | 'balanced' | 'aggressive';
  config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// Error Response
// ============================================================================

export interface APIError {
  error: string;
  message: string;
  status_code: number;
  details?: Record<string, any>;
}

// ============================================================================
// Health Check
// ============================================================================

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  checks: {
    database?: string;
    redis?: string;
  };
}
