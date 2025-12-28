import { api } from '../utils/api';
import { Agent } from '../types';

export const agentService = {
  // 获取智能体列表
  async getAgents(isPublic?: boolean): Promise<{ data: Agent[] }> {
    const params = isPublic ? { public: 'true' } : {};
    return api.get('/agents', { params });
  },

  // 创建智能体
  async createAgent(data: Partial<Agent>): Promise<{ data: Agent }> {
    return api.post('/agents', data);
  },

  // 获取智能体详情
  async getAgent(id: number): Promise<{ data: Agent }> {
    return api.get(`/agents/${id}`);
  },

  // 更新智能体
  async updateAgent(id: number, data: Partial<Agent>): Promise<{ data: Agent }> {
    return api.put(`/agents/${id}`, data);
  },

  // 删除智能体
  async deleteAgent(id: number): Promise<void> {
    return api.delete(`/agents/${id}`);
  },
};

