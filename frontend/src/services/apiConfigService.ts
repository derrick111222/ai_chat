import { api } from '../utils/api';
import { APIConfig } from '../types';

export const apiConfigService = {
  // 获取API配置列表
  async getConfigs(): Promise<{ data: APIConfig[] }> {
    return api.get('/configs');
  },

  // 创建API配置
  async createConfig(data: Partial<APIConfig> & { credentials: string }): Promise<{ data: APIConfig }> {
    return api.post('/configs', data);
  },

  // 获取API配置详情
  async getConfig(id: number): Promise<{ data: APIConfig }> {
    return api.get(`/configs/${id}`);
  },

  // 更新API配置
  async updateConfig(id: number, data: Partial<APIConfig> & { credentials?: string }): Promise<{ data: APIConfig }> {
    return api.put(`/configs/${id}`, data);
  },

  // 删除API配置
  async deleteConfig(id: number): Promise<void> {
    return api.delete(`/configs/${id}`);
  },
};

