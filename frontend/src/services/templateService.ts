import { api } from '../utils/api';

export interface TemplateParam {
  name: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiselect';
  description: string;
  default_value: any;
  required: boolean;
  options?: ParamOption[];
  validation?: ParamValidation;
}

export interface ParamOption {
  label: string;
  value: any;
}

export interface ParamValidation {
  min?: number;
  max?: number;
  pattern?: string;
}

export interface AgentTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  tags: string[];
  default_system_prompt: string;
  default_model_name: string;
  default_model_params: {
    temperature: number;
    max_tokens: number;
  };
  required_tools?: string[];
  configurable_params: TemplateParam[];
  workflow_definition: any;
  author: string;
  version: string;
  is_built_in: boolean;
  usage_count: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  count: number;
}

export interface CreateFromTemplateRequest {
  template_id: string;
  name: string;
  description?: string;
  api_config_id?: number;
  is_public: boolean;
  params: Record<string, any>;
}

export const templateService = {
  // 获取所有模板
  getTemplates: (category?: string) => {
    const params = category ? { category } : {};
    return api.get('/agent-templates', { params });
  },

  // 获取模板详情
  getTemplate: (id: string) => {
    return api.get(`/agent-templates/${id}`);
  },

  // 获取模板分类
  getCategories: () => {
    return api.get('/agent-templates/categories');
  },

  // 从模板创建 Agent
  createFromTemplate: (data: CreateFromTemplateRequest) => {
    return api.post('/agents/from-template', data);
  },
};

