import React, { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Tag, User, Check } from 'lucide-react';
import { templateService, AgentTemplate, TemplateCategory } from '../services/templateService';
import { apiConfigService } from '../services/apiConfigService';
import { APIConfig } from '../types';
import { useNavigate } from 'react-router-dom';

const Templates: React.FC = () => {
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<AgentTemplate[]>([]);
  const [categories, setCategories] = useState<TemplateCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedTemplate, setSelectedTemplate] = useState<AgentTemplate | null>(null);
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([]);
  const [showConfigModal, setShowConfigModal] = useState(false);
  
  // 表单数据
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    api_config_id: '',
    is_public: false,
    params: {} as Record<string, any>,
  });

  useEffect(() => {
    loadTemplates();
    loadCategories();
    loadApiConfigs();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadTemplates(selectedCategory);
    } else {
      loadTemplates();
    }
  }, [selectedCategory]);

  const loadTemplates = async (category?: string) => {
    try {
      const response = await templateService.getTemplates(category);
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('加载模板失败:', error);
    }
  };

  const loadCategories = async () => {
    try {
      const response = await templateService.getCategories();
      setCategories(response.data || []);
    } catch (error) {
      console.error('加载分类失败:', error);
    }
  };

  const loadApiConfigs = async () => {
    try {
      const response = await apiConfigService.getConfigs();
      setApiConfigs(response.data || []);
    } catch (error) {
      console.error('加载API配置失败:', error);
    }
  };

  const handleSelectTemplate = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    
    // 初始化表单数据
    setFormData({
      name: `我的${template.name}`,
      description: template.description,
      api_config_id: apiConfigs.length > 0 ? apiConfigs[0].id.toString() : '',
      is_public: false,
      params: {},
    });
    
    // 初始化参数默认值
    const defaultParams: Record<string, any> = {};
    template.configurable_params.forEach(param => {
      defaultParams[param.name] = param.default_value;
    });
    setFormData(prev => ({ ...prev, params: defaultParams }));
    
    setShowConfigModal(true);
  };

  const handleParamChange = (paramName: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      params: {
        ...prev.params,
        [paramName]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTemplate) return;
    
    try {
      const response = await templateService.createFromTemplate({
        template_id: selectedTemplate.id,
        name: formData.name,
        description: formData.description,
        api_config_id: formData.api_config_id ? parseInt(formData.api_config_id) : undefined,
        is_public: formData.is_public,
        params: formData.params,
      });
      
      alert('创建成功！');
      setShowConfigModal(false);
      navigate('/agents');
    } catch (error: any) {
      alert('创建失败: ' + (error.message || '未知错误'));
    }
  };

  const renderParamInput = (param: any) => {
    const value = formData.params[param.name];
    
    switch (param.type) {
      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={param.required}
          >
            {param.options?.map((option: any) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'multiselect':
        return (
          <div className="space-y-2">
            {param.options?.map((option: any) => (
              <label key={option.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={Array.isArray(value) && value.includes(option.value)}
                  onChange={(e) => {
                    const currentValue = Array.isArray(value) ? value : [];
                    const newValue = e.target.checked
                      ? [...currentValue, option.value]
                      : currentValue.filter((v: any) => v !== option.value);
                    handleParamChange(param.name, newValue);
                  }}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
          </div>
        );
      
      case 'boolean':
        return (
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleParamChange(param.name, e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="ml-2 text-sm text-gray-700">启用</span>
          </label>
        );
      
      case 'number':
        return (
          <input
            type="number"
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, parseFloat(e.target.value))}
            min={param.validation?.min}
            max={param.validation?.max}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={param.required}
          />
        );
      
      default: // string
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleParamChange(param.name, e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required={param.required}
          />
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <div className="flex items-center mb-2">
            <Sparkles size={32} className="text-blue-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-900">Agent 模板市场</h1>
          </div>
          <p className="text-gray-600">选择一个模板，快速创建你的 AI 智能体</p>
        </div>

        {/* 分类筛选 */}
        <div className="mb-6 flex flex-wrap gap-3">
          <button
            onClick={() => setSelectedCategory('')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedCategory === ''
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            全部
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="mr-2">{category.icon}</span>
              {category.name}
              <span className="ml-2 text-xs opacity-75">({category.count})</span>
            </button>
          ))}
        </div>

        {/* 模板列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => handleSelectTemplate(template)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-2xl mr-3">
                    {template.icon}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
                    <p className="text-xs text-gray-500">v{template.version}</p>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                {template.description}
              </p>

              <div className="flex flex-wrap gap-2 mb-4">
                {template.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-700"
                  >
                    <Tag size={12} className="mr-1" />
                    {tag}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center text-xs text-gray-500">
                  <User size={14} className="mr-1" />
                  {template.author}
                </div>
                <button className="flex items-center text-blue-600 hover:text-blue-700 text-sm font-medium">
                  使用模板
                  <ArrowRight size={16} className="ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-12">
            <Sparkles size={64} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无模板</h3>
            <p className="text-gray-500">该分类下还没有可用的模板</p>
          </div>
        )}
      </div>

      {/* 配置模态框 */}
      {showConfigModal && selectedTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                配置 {selectedTemplate.name}
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
                  placeholder="给你的智能体起个名字"
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
                  placeholder="描述这个智能体的用途"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API配置 *
                </label>
                <select
                  value={formData.api_config_id}
                  onChange={(e) => setFormData({ ...formData, api_config_id: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">选择API配置</option>
                  {apiConfigs.map((config) => (
                    <option key={config.id} value={config.id}>
                      {config.name} ({config.api_type})
                    </option>
                  ))}
                </select>
              </div>

              {/* 模板参数 */}
              {selectedTemplate.configurable_params.length > 0 && (
                <div className="border-t pt-6">
                  <h4 className="text-md font-semibold text-gray-900 mb-4">模板参数</h4>
                  <div className="space-y-4">
                    {selectedTemplate.configurable_params.map((param) => (
                      <div key={param.name}>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {param.label} {param.required && '*'}
                        </label>
                        {param.description && (
                          <p className="text-xs text-gray-500 mb-2">{param.description}</p>
                        )}
                        {renderParamInput(param)}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
                  onClick={() => setShowConfigModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建智能体
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Templates;

