import { api } from '../utils/api';
import { Conversation, Message } from '../types';

export const conversationService = {
  // 获取对话列表
  async getConversations(status?: string): Promise<{ data: Conversation[] }> {
    const params = status ? { status } : {};
    return api.get('/conversations', { params });
  },

  // 创建对话
  async createConversation(data: { agent_id: number; title?: string }): Promise<{ data: Conversation }> {
    return api.post('/conversations', data);
  },

  // 获取对话详情
  async getConversation(id: number): Promise<{ data: Conversation }> {
    return api.get(`/conversations/${id}`);
  },

  // 更新对话
  async updateConversation(id: number, data: Partial<Conversation>): Promise<{ data: Conversation }> {
    return api.put(`/conversations/${id}`, data);
  },

  // 删除对话
  async deleteConversation(id: number): Promise<void> {
    return api.delete(`/conversations/${id}`);
  },

  // 获取对话消息
  async getMessages(conversationId: number): Promise<{ data: Message[] }> {
    return api.get(`/conversations/${conversationId}/messages`);
  },

  // 发送消息
  async sendMessage(conversationId: number, content: string): Promise<{ data: any }> {
    return api.post(`/conversations/${conversationId}/messages`, { content });
  },

  // 删除消息
  async deleteMessage(messageId: number): Promise<void> {
    return api.delete(`/messages/${messageId}`);
  },
};

