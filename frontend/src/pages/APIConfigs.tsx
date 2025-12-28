import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Key, Check, X } from 'lucide-react';
import { apiConfigService } from '../services/apiConfigService';
import { APIConfig } from '../types';

const APIConfigs: React.FC = () => {
  const [configs, setConfigs] = useState<APIConfig[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<APIConfig | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    api_type: 'openrouter',
    endpoint_url: 'https://openrouter.ai/api/v1/chat/completions',
    auth_type: 'bearer' as 'bearer' | 'api_key' | 'custom',
    credentials: '',
    is_active: true,
  });

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const response = await apiConfigService.getConfigs();
      setConfigs(response.data || []);
    } catch (error) {
      console.error('加载API配置失败:', error);
      setConfigs([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingConfig) {
        await apiConfigService.updateConfig(editingConfig.id, formData);
      } else {
        await apiConfigService.createConfig(formData);
      }
      setShowModal(false);
      resetForm();
      loadConfigs();
    } catch (error: any) {
      alert('操作失败: ' + (error.message || '未知错误'));
    }
  };

  const handleEdit = (config: APIConfig) => {
    setEditingConfig(config);
    setFormData({
      name: config.name,
      api_type: config.api_type,
      endpoint_url: config.endpoint_url,
      auth_type: config.auth_type,
      credentials: '', // 不显示已保存的密钥
      is_active: config.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个API配置吗？')) {
      return;
    }

    try {
      await apiConfigService.deleteConfig(id);
      loadConfigs();
    } catch (error: any) {
      alert('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const resetForm = () => {
    setEditingConfig(null);
    setFormData({
      name: '',
      api_type: 'openrouter',
      endpoint_url: 'https://openrouter.ai/api/v1/chat/completions',
      auth_type: 'bearer',
      credentials: '',
      is_active: true,
    });
  };

  const apiTypeOptions = [
    { value: 'openrouter', label: 'OpenRouter', url: 'https://openrouter.ai/api/v1/chat/completions' },
    { value: 'openai', label: 'OpenAI', url: 'https://api.openai.com/v1/chat/completions' },
    { value: 'anthropic', label: 'Anthropic Claude', url: 'https://api.anthropic.com/v1/messages' },
    { value: 'google', label: 'Google Gemini', url: 'https://generativelanguage.googleapis.com/v1/models' },
    { value: 'custom', label: '自定义', url: '' },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">API配置管理</h1>
            <p className="mt-2 text-gray-600">管理您的AI服务API配置</p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            添加配置
          </button>
        </div>

        {/* 配置列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {configs.map((config) => (
            <div key={config.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    <Key size={24} className="text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{config.name}</h3>
                    <div className="flex items-center mt-1">
                      {config.is_active ? (
                        <>
                          <Check size={14} className="text-green-600 mr-1" />
                          <span className="text-xs text-green-600">已启用</span>
                        </>
                      ) : (
                        <>
                          <X size={14} className="text-gray-400 mr-1" />
                          <span className="text-xs text-gray-400">已禁用</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(config)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(config.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">类型:</span>
                  <span className="ml-2 text-gray-900 font-medium">{config.api_type}</span>
                </div>
                <div>
                  <span className="text-gray-500">认证方式:</span>
                  <span className="ml-2 text-gray-900 font-medium">{config.auth_type}</span>
                </div>
                <div>
                  <span className="text-gray-500">端点:</span>
                  <p className="text-gray-900 font-mono text-xs mt-1 break-all">
                    {config.endpoint_url}
                  </p>
                </div>
                <div className="text-xs text-gray-400 pt-2 border-t">
                  创建于 {new Date(config.created_at).toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {configs.length === 0 && (
          <div className="text-center py-12">
            <Key size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有API配置</h3>
            <p className="text-gray-500 mb-6">添加您的第一个API配置</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              添加配置
            </button>
          </div>
        )}
      </div>

      {/* 创建/编辑模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingConfig ? '编辑API配置' : '添加API配置'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  配置名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：我的OpenRouter配置"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API类型 *
                </label>
                <select
                  required
                  value={formData.api_type}
                  onChange={(e) => {
                    const selected = apiTypeOptions.find(opt => opt.value === e.target.value);
                    setFormData({
                      ...formData,
                      api_type: e.target.value,
                      endpoint_url: selected?.url || '',
                    });
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {apiTypeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API端点URL *
                </label>
                <input
                  type="url"
                  required
                  value={formData.endpoint_url}
                  onChange={(e) => setFormData({ ...formData, endpoint_url: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://api.example.com/v1/chat/completions"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  认证方式 *
                </label>
                <select
                  required
                  value={formData.auth_type}
                  onChange={(e) => setFormData({ ...formData, auth_type: e.target.value as any })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="bearer">Bearer Token</option>
                  <option value="api_key">API Key</option>
                  <option value="custom">自定义</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API密钥 {editingConfig ? '(留空则不修改)' : '*'}
                </label>
                <input
                  type="password"
                  required={!editingConfig}
                  value={formData.credentials}
                  onChange={(e) => setFormData({ ...formData, credentials: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="sk-..."
                />
                <p className="mt-1 text-xs text-gray-500">
                  您的API密钥将被加密存储
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  启用此配置
                </label>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">提示</h4>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>OpenRouter支持300+模型，推荐使用</li>
                  <li>确保您的API密钥有足够的权限</li>
                  <li>不同的API提供商可能有不同的请求格式</li>
                </ul>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingConfig ? '保存' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default APIConfigs;

