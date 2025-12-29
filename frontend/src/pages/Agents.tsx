import React, { useState, useEffect, useRef } from 'react';
import { Plus, Edit, Trash2, Bot, Globe, Lock, Search, ChevronDown, X, Workflow } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { agentService } from '../services/agentService';
import { apiConfigService } from '../services/apiConfigService';
import { modelService, Model } from '../services/modelService';
import { Agent, APIConfig } from '../types';

const Agents: React.FC = () => {
  const navigate = useNavigate();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [showModal, setShowModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    system_prompt: '',
    api_config_id: '',
    model_name: 'anthropic/claude-3.5-sonnet',
    temperature: 0.7,
    max_tokens: 2000,
    is_public: false,
  });

  useEffect(() => {
    loadAgents();
    loadApiConfigs();
    loadModels(selectedProvider);
  }, []);

  // 当平台切换时重新加载模型
  useEffect(() => {
    if (showModal) {
      loadModels(selectedProvider);
    }
  }, [selectedProvider, showModal]);

  // 点击外部关闭模型下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as Node)) {
        setShowModelDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const loadAgents = async () => {
    try {
      const response = await agentService.getAgents();
      setAgents(response.data || []);
    } catch (error) {
      console.error('加载智能体列表失败:', error);
      setAgents([]);
    }
  };

  const loadApiConfigs = async () => {
    try {
      const response = await apiConfigService.getConfigs();
      setApiConfigs(response.data || []);
    } catch (error) {
      console.error('加载API配置失败:', error);
      setApiConfigs([]);
    }
  };

  const loadModels = async (provider: string = 'openrouter') => {
    setLoadingModels(true);
    try {
      const response = await modelService.getModels(provider);
      const modelList = response.data || [];
      setModels(modelList);
      
      // 如果成功加载了模型且当前 model_name 为空或为默认值，设置第一个模型为默认值
      if (modelList.length > 0 && (!formData.model_name || formData.model_name === 'anthropic/claude-3.5-sonnet')) {
        setFormData(prev => ({ ...prev, model_name: modelList[0].id }));
      }
    } catch (error) {
      console.error('加载模型列表失败:', error);
      // 加载失败时设置为空数组，显示错误提示
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = {
      name: formData.name,
      description: formData.description,
      system_prompt: formData.system_prompt,
      api_config_id: formData.api_config_id ? parseInt(formData.api_config_id) : undefined,
      model_name: formData.model_name,
      model_params: {
        temperature: formData.temperature,
        max_tokens: formData.max_tokens,
      },
      is_public: formData.is_public,
    };

    try {
      if (editingAgent) {
        await agentService.updateAgent(editingAgent.id, data);
      } else {
        await agentService.createAgent(data);
      }
      setShowModal(false);
      resetForm();
      loadAgents();
    } catch (error: any) {
      alert('操作失败: ' + (error.message || '未知错误'));
    }
  };

  const handleEdit = (agent: Agent) => {
    setEditingAgent(agent);
    setFormData({
      name: agent.name,
      description: agent.description || '',
      system_prompt: agent.system_prompt || '',
      api_config_id: agent.api_config_id?.toString() || '',
      model_name: agent.model_name,
      temperature: agent.model_params?.temperature || 0.7,
      max_tokens: agent.model_params?.max_tokens || 2000,
      is_public: agent.is_public,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('确定要删除这个智能体吗？')) {
      return;
    }

    try {
      await agentService.deleteAgent(id);
      loadAgents();
    } catch (error: any) {
      alert('删除失败: ' + (error.message || '未知错误'));
    }
  };

  const resetForm = () => {
    setEditingAgent(null);
    setFormData({
      name: '',
      description: '',
      system_prompt: '',
      api_config_id: '',
      model_name: models.length > 0 ? models[0].id : '',
      temperature: 0.7,
      max_tokens: 2000,
      is_public: false,
    });
    setModelSearchQuery('');
  };

  // 过滤模型列表
  const filteredModels = models.filter((model) => {
    const query = modelSearchQuery.toLowerCase();
    return (
      model.name.toLowerCase().includes(query) ||
      model.id.toLowerCase().includes(query) ||
      (model.description && model.description.toLowerCase().includes(query))
    );
  });

  // 选择模型
  const handleSelectModel = (modelId: string) => {
    setFormData({ ...formData, model_name: modelId });
    setShowModelDropdown(false);
    setModelSearchQuery('');
  };

  // 获取当前选中的模型
  const selectedModel = models.find(m => m.id === formData.model_name);

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">智能体管理</h1>
            <p className="mt-2 text-gray-600">创建和管理您的AI智能体</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={() => navigate('/workflow-editor')}
              className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <Workflow size={20} className="mr-2" />
              工作流编辑器
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus size={20} className="mr-2" />
              创建智能体
            </button>
          </div>
        </div>

        {/* 智能体列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {agents.map((agent) => (
            <div key={agent.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                    <Bot size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{agent.name}</h3>
                    <div className="flex items-center mt-1">
                      {agent.is_public ? (
                        <Globe size={14} className="text-green-600 mr-1" />
                      ) : (
                        <Lock size={14} className="text-gray-400 mr-1" />
                      )}
                      <span className="text-xs text-gray-500">
                        {agent.is_public ? '公开' : '私有'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(agent)}
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    className="text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {agent.description || '暂无描述'}
              </p>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">模型:</span>
                  <span className="text-gray-900 font-medium">{agent.model_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">使用次数:</span>
                  <span className="text-gray-900 font-medium">{agent.usage_count}</span>
                </div>
                {agent.api_config && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">API配置:</span>
                    <span className="text-gray-900 font-medium">{agent.api_config.name}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {agents.length === 0 && (
          <div className="text-center py-12">
            <Bot size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">还没有智能体</h3>
            <p className="text-gray-500 mb-6">创建您的第一个AI智能体</p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建智能体
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
                {editingAgent ? '编辑智能体' : '创建智能体'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  名称 *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如：编程助手"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="描述这个智能体的功能和特点"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  系统提示词
                </label>
                <textarea
                  value={formData.system_prompt}
                  onChange={(e) => setFormData({ ...formData, system_prompt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={5}
                  placeholder="定义智能体的角色和行为..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API配置
                </label>
                <select
                  value={formData.api_config_id}
                  onChange={(e) => setFormData({ ...formData, api_config_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">使用默认配置</option>
                  {apiConfigs.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.name} ({config.api_type})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  AI 平台 *
                </label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingModels}
                >
                  <option value="openrouter">OpenRouter (多模型聚合)</option>
                  <option value="openai">OpenAI (GPT系列)</option>
                  <option value="anthropic">Anthropic (Claude系列)</option>
                  <option value="google">Google (Gemini系列)</option>
                  <option value="meta">Meta (Llama系列)</option>
                </select>
                <p className="mt-1 text-xs text-gray-500">
                  选择不同的平台将显示该平台支持的模型
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  模型 * {loadingModels && <span className="text-xs text-gray-500">(加载中...)</span>}
                </label>
                
                {/* 自定义搜索下拉框 */}
                <div className="relative" ref={modelDropdownRef}>
                  <div
                    onClick={() => !loadingModels && models.length > 0 && setShowModelDropdown(!showModelDropdown)}
                    className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between ${
                      loadingModels || models.length === 0 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
                    }`}
                  >
                    <span className={selectedModel ? 'text-gray-900' : 'text-gray-500'}>
                      {selectedModel ? `${selectedModel.name} (${selectedModel.id})` : '请选择模型'}
                    </span>
                    <ChevronDown size={18} className="text-gray-400" />
                  </div>

                  {/* 下拉菜单 */}
                  {showModelDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-96 overflow-hidden">
                      {/* 搜索框 */}
                      <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                        <div className="relative">
                          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            value={modelSearchQuery}
                            onChange={(e) => setModelSearchQuery(e.target.value)}
                            placeholder="搜索模型名称或ID..."
                            className="w-full pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                            onClick={(e) => e.stopPropagation()}
                          />
                          {modelSearchQuery && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setModelSearchQuery('');
                              }}
                              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                              <X size={16} />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 模型列表 */}
                      <div className="overflow-y-auto max-h-80">
                        {filteredModels.length > 0 ? (
                          filteredModels.map((model) => (
                            <div
                              key={model.id}
                              onClick={() => handleSelectModel(model.id)}
                              className={`px-4 py-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 ${
                                formData.model_name === model.id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                              }`}
                            >
                              <div className="font-medium text-sm">{model.name}</div>
                              <div className="text-xs text-gray-500 mt-0.5">{model.id}</div>
                              {model.description && (
                                <div className="text-xs text-gray-400 mt-1 line-clamp-2">{model.description}</div>
                              )}
                              {model.context_length && (
                                <div className="text-xs text-gray-400 mt-1">
                                  上下文: {model.context_length.toLocaleString()} tokens
                                </div>
                              )}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-8 text-center text-gray-500 text-sm">
                            {modelSearchQuery ? '未找到匹配的模型' : '暂无可用模型'}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => loadModels(selectedProvider)}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700"
                  disabled={loadingModels}
                >
                  🔄 刷新模型列表
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Temperature: {formData.temperature}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={formData.temperature}
                    onChange={(e) => setFormData({ ...formData, temperature: parseFloat(e.target.value) })}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>精确</span>
                    <span>创造</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    最大Token数
                  </label>
                  <input
                    type="number"
                    min="100"
                    max="8000"
                    value={formData.max_tokens}
                    onChange={(e) => setFormData({ ...formData, max_tokens: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={formData.is_public}
                  onChange={(e) => setFormData({ ...formData, is_public: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_public" className="ml-2 text-sm text-gray-700">
                  公开此智能体（其他用户可以查看和使用）
                </label>
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
                  {editingAgent ? '保存' : '创建'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agents;

