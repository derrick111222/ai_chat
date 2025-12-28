export interface User {
  id: number;
  username: string;
  email: string;
  avatar_url?: string;
  role: 'free' | 'premium' | 'enterprise' | 'admin';
  created_at: string;
  last_login_at?: string;
}

export interface APIConfig {
  id: number;
  name: string;
  api_type: string;
  endpoint_url: string;
  auth_type: 'bearer' | 'api_key' | 'custom';
  field_mapping?: {
    request_mapping?: Record<string, any>;
    response_mapping?: Record<string, any>;
  };
  is_active: boolean;
  created_at: string;
}

export interface ModelParams {
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  frequency_penalty?: number;
  presence_penalty?: number;
}

export interface Agent {
  id: number;
  name: string;
  description?: string;
  avatar_url?: string;
  system_prompt?: string;
  api_config_id?: number;
  model_name: string;
  model_params?: ModelParams;
  tools?: string[];
  is_public: boolean;
  usage_count: number;
  created_at: string;
  api_config?: APIConfig;
}

export interface Conversation {
  id: number;
  agent_id: number;
  title: string;
  status: 'active' | 'archived' | 'deleted';
  total_tokens: number;
  total_cost: number;
  created_at: string;
  updated_at: string;
  agent?: Agent;
  message_count?: number;
}

export interface Message {
  id: number;
  conversation_id: number;
  role: 'user' | 'assistant' | 'system';
  content: string;
  attachments?: any[];
  input_tokens: number;
  output_tokens: number;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface UsageStats {
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  total_cost: number;
  conversation_count: number;
  message_count: number;
}

export interface DailyUsage {
  date: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cost: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

