import { config } from '../config';
import { User } from '../types';

export const authUtils = {
  // 保存Token
  setToken(token: string) {
    localStorage.setItem(config.tokenKey, token);
  },

  // 获取Token
  getToken(): string | null {
    return localStorage.getItem(config.tokenKey);
  },

  // 删除Token
  removeToken() {
    localStorage.removeItem(config.tokenKey);
  },

  // 保存用户信息
  setUser(user: User) {
    localStorage.setItem(config.userKey, JSON.stringify(user));
  },

  // 获取用户信息
  getUser(): User | null {
    const userStr = localStorage.getItem(config.userKey);
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
    return null;
  },

  // 删除用户信息
  removeUser() {
    localStorage.removeItem(config.userKey);
  },

  // 检查是否已登录
  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  // 登出
  logout() {
    this.removeToken();
    this.removeUser();
    window.location.href = '/login';
  },
};

