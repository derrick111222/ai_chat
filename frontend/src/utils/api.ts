import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { config } from '../config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (requestConfig) => {
        const token = localStorage.getItem(config.tokenKey);
        if (token) {
          requestConfig.headers.Authorization = `Bearer ${token}`;
        }
        return requestConfig;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        return response.data;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token过期，清除本地存储并跳转到登录页
          localStorage.removeItem(config.tokenKey);
          localStorage.removeItem(config.userKey);
          window.location.href = '/login';
        }
        return Promise.reject(error.response?.data || error.message);
      }
    );
  }

  get<T = any>(url: string, requestConfig?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, requestConfig);
  }

  post<T = any>(url: string, data?: any, requestConfig?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, requestConfig);
  }

  put<T = any>(url: string, data?: any, requestConfig?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, requestConfig);
  }

  delete<T = any>(url: string, requestConfig?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, requestConfig);
  }

  // 流式请求
  stream(url: string, data?: any): EventSource {
    const token = localStorage.getItem(config.tokenKey);
    const eventSource = new EventSource(
      `${config.apiBaseUrl}${url}?token=${token}`
    );
    return eventSource;
  }
}

export const api = new ApiClient();

