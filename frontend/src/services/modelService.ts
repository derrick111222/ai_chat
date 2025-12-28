import { api } from '../utils/api';

export interface Model {
  id: string;
  name: string;
  description: string;
  context_length?: number;
  pricing?: {
    prompt: string;
    completion: string;
  };
}

export const modelService = {
  // 获取模型列表
  getModels: (provider: string = 'openrouter'): Promise<{ data: Model[] }> => {
    return api.get(`/models?provider=${provider}`);
  },
};

