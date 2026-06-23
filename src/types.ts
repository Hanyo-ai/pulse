export interface Session {
  id: string;
  title: string;
  provider: string;
  model: string;
  status: string;
  tokens: number;
  latency: string;
  cost: string;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Message {
  id: number;
  session_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  tokens: number;
  latency: string;
  created_at?: string;
}

export interface RequestLog {
  id: number;
  request_id: string;
  session_id: string;
  provider: string;
  model: string;
  status_code: number;
  latency_ms: number;
  tokens: number;
  cost: string;
  created_at: string;
}

export interface Endpoint {
  id: number;
  display_name: string;
  provider_name: string;
  provider_key: string;
  endpoint_url: string;
  model_name: string;
  api_key_masked: string;
  gateway_key: string;
  status: string;
  latency_ms: number;
  error_rate: number;
  enabled: number;
  price_input_per_m: number;
  price_output_per_m: number;
  price_cache_input_per_m: number;
  price_cache_output_per_m: number;
}

export interface EndpointCreateRequest {
  display_name: string;
  provider_name: string;
  provider_key: string;
  endpoint_url: string;
  model_name: string;
  api_key: string;
}

export interface UsageStats {
  totalTokens: string;
  totalRequests: string;
  avgLatency: string;
  estimatedCost: string;
}

export interface User {
  id: number;
  username: string;
  display_name: string;
  role: string;
}

export type Section = "session-monitor" | "logs" | "endpoints" | "usage" | "login";
