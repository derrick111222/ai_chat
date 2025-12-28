import { api } from '../utils/api';
import { LoginRequest, RegisterRequest, LoginResponse, User } from '../types';

export const authService = {
  // 注册
  async register(data: RegisterRequest): Promise<{ data: User }> {
    return api.post('/auth/register', data);
  },

  // 登录
  async login(data: LoginRequest): Promise<{ data: LoginResponse }> {
    return api.post('/auth/login', data);
  },

  // 获取用户信息
  async getProfile(): Promise<{ data: User }> {
    return api.get('/auth/profile');
  },

  // 更新用户信息
  async updateProfile(data: Partial<User>): Promise<{ data: User }> {
    return api.put('/auth/profile', data);
  },
};

