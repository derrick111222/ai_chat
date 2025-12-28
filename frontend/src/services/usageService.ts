import { api } from '../utils/api';
import { UsageStats, DailyUsage } from '../types';

export const usageService = {
  // 获取总体统计
  async getStats(): Promise<{ data: UsageStats }> {
    return api.get('/usage/stats');
  },

  // 获取每日统计
  async getDailyUsage(days: number = 30): Promise<{ data: DailyUsage[] }> {
    return api.get('/usage/daily', { params: { days } });
  },

  // 按智能体统计
  async getByAgent(): Promise<{ data: any[] }> {
    return api.get('/usage/by-agent');
  },
};

