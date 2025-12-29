import React, { useState, useEffect, useRef } from 'react';
import { X, Settings, Search, ChevronDown } from 'lucide-react';
import { Node } from 'reactflow';
import { CustomNodeData } from './CustomNode';
import { apiConfigService } from '../../services/apiConfigService';
import { modelService, Model } from '../../services/modelService';
import { APIConfig } from '../../types';

interface NodeConfigPanelProps {
  selectedNode: Node<CustomNodeData> | null;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<CustomNodeData>) => void;
}

// 内置工具列表
const BUILT_IN_TOOLS = [
  { id: 'web_search', name: '网页搜索', description: '搜索互联网获取实时信息' },
  { id: 'calculator', name: '计算器', description: '执行数学计算' },
  { id: 'code_interpreter', name: '代码解释器', description: '执行Python代码' },
  { id: 'file_reader', name: '文件读取', description: '读取文件内容' },
  { id: 'image_generator', name: '图片生成', description: '生成AI图片' },
  { id: 'web_scraper', name: '网页抓取', description: '抓取网页内容' },
  { id: 'database_query', name: '数据库查询', description: '查询数据库' },
  { id: 'api_caller', name: 'API调用', description: '调用外部API' },
];

// Lambda代码模板
const LAMBDA_TEMPLATES = {
  empty: {
    name: '空模板',
    code: `// 输入你的代码
function process(input) {
  // 处理逻辑
  return input;
}`,
  },
  text_processor: {
    name: '文本处理',
    code: `// 文本处理示例
function process(input) {
  const text = input.text || '';
  
  // 转换为大写
  const upperText = text.toUpperCase();
  
  // 统计字数
  const wordCount = text.split(/\\s+/).length;
  
  return {
    original: text,
    upper: upperText,
    wordCount: wordCount
  };
}`,
  },
  json_parser: {
    name: 'JSON解析',
    code: `// JSON数据解析
function process(input) {
  try {
    const data = JSON.parse(input.jsonString);
    
    // 提取需要的字段
    return {
      success: true,
      data: data,
      keys: Object.keys(data)
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}`,
  },
  data_filter: {
    name: '数据过滤',
    code: `// 数据过滤示例
function process(input) {
  const items = input.items || [];
  const threshold = input.threshold || 0;
  
  // 过滤数据
  const filtered = items.filter(item => item.value > threshold);
  
  // 排序
  const sorted = filtered.sort((a, b) => b.value - a.value);
  
  return {
    total: items.length,
    filtered: filtered.length,
    results: sorted
  };
}`,
  },
  api_formatter: {
    name: 'API响应格式化',
    code: `// API响应格式化
function process(input) {
  const response = input.response || {};
  
  return {
    status: response.status || 'unknown',
    data: response.data || null,
    timestamp: new Date().toISOString(),
    formatted: true
  };
}`,
  },
  conditional: {
    name: '条件判断',
    code: `// 条件判断逻辑
function process(input) {
  const value = input.value || 0;
  const condition = input.condition || 'greater';
  const threshold = input.threshold || 0;
  
  let result = false;
  
  switch(condition) {
    case 'greater':
      result = value > threshold;
      break;
    case 'less':
      result = value < threshold;
      break;
    case 'equal':
      result = value === threshold;
      break;
  }
  
  return {
    passed: result,
    value: value,
    threshold: threshold
  };
}`,
  },
};

export const NodeConfigPanel: React.FC<NodeConfigPanelProps> = ({
  selectedNode,
  onClose,
  onUpdate,
}) => {
  const [label, setLabel] = useState('');
  const [config, setConfig] = useState<Record<string, any>>({});
  
  // ChatModel 相关状态
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState('openrouter');
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [modelSearchQuery, setModelSearchQuery] = useState('');
  const modelDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedNode) {
      setLabel(selectedNode.data.label);
      setConfig(selectedNode.data.config || {});
      
      // 如果是 ChatModel 节点，加载 API 配置和模型
      if (selectedNode.data.type === 'chatmodel') {
        loadApiConfigs();
        loadModels(selectedProvider);
      }
    }
  }, [selectedNode]);
  
  // 加载模型列表
  useEffect(() => {
    if (selectedNode?.data.type === 'chatmodel') {
      loadModels(selectedProvider);
    }
  }, [selectedProvider]);
  
  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(event.target as HTMLElement)) {
        setShowModelDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const loadApiConfigs = async () => {
    try {
      const response = await apiConfigService.getConfigs();
      setApiConfigs(response.data || []);
    } catch (error) {
      console.error('加载API配置失败:', error);
    }
  };
  
  const loadModels = async (provider: string) => {
    setLoadingModels(true);
    try {
      const response = await modelService.getModels(provider);
      setModels(response.data || []);
    } catch (error) {
      console.error('加载模型列表失败:', error);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  };

  if (!selectedNode) {
    return null;
  }

  const handleSave = () => {
    onUpdate(selectedNode.id, {
      label,
      config,
    });
    onClose();
  };

  const handleConfigChange = (key: string, value: any) => {
    setConfig({
      ...config,
      [key]: value,
    });
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
  
  // 获取当前选中的模型
  const selectedModel = models.find(m => m.id === config.model_name);

  const renderConfigFields = () => {
    const { type } = selectedNode.data;

    switch (type) {
      case 'chatmodel':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API配置
              </label>
              <select
                value={config.api_config_id || ''}
                onChange={(e) => handleConfigChange('api_config_id', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">使用默认配置</option>
                {apiConfigs.map((apiConfig) => (
                  <option key={apiConfig.id} value={apiConfig.id}>
                    {apiConfig.name} ({apiConfig.api_type})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                AI 平台
              </label>
              <select
                value={selectedProvider}
                onChange={(e) => setSelectedProvider(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={loadingModels}
              >
                <option value="openrouter">OpenRouter (多模型聚合)</option>
                <option value="openai">OpenAI (GPT系列)</option>
                <option value="anthropic">Anthropic (Claude系列)</option>
                <option value="google">Google (Gemini系列)</option>
                <option value="meta">Meta (Llama系列)</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模型 {loadingModels && <span className="text-xs text-gray-500">(加载中...)</span>}
              </label>
              <div className="relative" ref={modelDropdownRef}>
                <div
                  onClick={() => !loadingModels && models.length > 0 && setShowModelDropdown(!showModelDropdown)}
                  className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer flex items-center justify-between ${
                    loadingModels || models.length === 0 ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'
                  }`}
                >
                  <span className={selectedModel ? 'text-gray-900 text-sm' : 'text-gray-500 text-sm'}>
                    {selectedModel ? `${selectedModel.name}` : '请选择模型'}
                  </span>
                  <ChevronDown size={16} className="text-gray-400" />
                </div>

                {showModelDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                    <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                      <div className="relative">
                        <Search size={16} className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                          placeholder="搜索模型..."
                          className="w-full pl-8 pr-2 py-1.5 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    </div>
                    <div className="overflow-y-auto max-h-64">
                      {filteredModels.length > 0 ? (
                        filteredModels.map((model) => (
                          <div
                            key={model.id}
                            onClick={() => {
                              handleConfigChange('model_name', model.id);
                              setShowModelDropdown(false);
                              setModelSearchQuery('');
                            }}
                            className={`px-3 py-2 cursor-pointer hover:bg-blue-50 border-b border-gray-100 ${
                              config.model_name === model.id ? 'bg-blue-50 text-blue-600' : 'text-gray-900'
                            }`}
                          >
                            <div className="font-medium text-xs">{model.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{model.id}</div>
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-4 text-center text-gray-500 text-xs">
                          未找到模型
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Temperature: {config.temperature || 0.7}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={config.temperature || 0.7}
                onChange={(e) => handleConfigChange('temperature', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>精确</span>
                <span>创造</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Max Tokens
              </label>
              <input
                type="number"
                min="100"
                max="8000"
                value={config.max_tokens || 2000}
                onChange={(e) => handleConfigChange('max_tokens', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        );

      case 'tool':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择工具
              </label>
              <select
                value={config.tool_name || ''}
                onChange={(e) => {
                  const selectedTool = BUILT_IN_TOOLS.find(t => t.id === e.target.value);
                  handleConfigChange('tool_name', e.target.value);
                  if (selectedTool) {
                    handleConfigChange('description', selectedTool.description);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">选择内置工具</option>
                {BUILT_IN_TOOLS.map((tool) => (
                  <option key={tool.id} value={tool.id}>
                    {tool.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">或者输入自定义工具名称</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工具名称
              </label>
              <input
                type="text"
                value={config.tool_name || ''}
                onChange={(e) => handleConfigChange('tool_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: web_search"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工具描述
              </label>
              <textarea
                value={config.description || ''}
                onChange={(e) => handleConfigChange('description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
                placeholder="描述工具的功能"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                工具参数 (JSON)
              </label>
              <textarea
                value={config.parameters || ''}
                onChange={(e) => handleConfigChange('parameters', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={4}
                placeholder='{"param1": "value1"}'
              />
            </div>
          </>
        );

      case 'lambda':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                代码模板
              </label>
              <select
                onChange={(e) => {
                  const template = LAMBDA_TEMPLATES[e.target.value as keyof typeof LAMBDA_TEMPLATES];
                  if (template) {
                    handleConfigChange('code', template.code);
                  }
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="">选择代码模板</option>
                {Object.entries(LAMBDA_TEMPLATES).map(([key, template]) => (
                  <option key={key} value={key}>
                    {template.name}
                  </option>
                ))}
              </select>
              <p className="mt-1 text-xs text-gray-500">选择模板快速开始</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                函数名称
              </label>
              <input
                type="text"
                value={config.function_name || ''}
                onChange={(e) => handleConfigChange('function_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: process_data"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                函数代码
              </label>
              <textarea
                value={config.code || ''}
                onChange={(e) => handleConfigChange('code', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-xs leading-relaxed"
                rows={16}
                placeholder="// 输入你的代码"
                style={{ minHeight: '400px' }}
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 提示: 使用 function process(input) 作为入口函数
              </p>
            </div>
          </>
        );

      case 'retriever':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                检索器类型
              </label>
              <select
                value={config.retriever_type || 'vector'}
                onChange={(e) => handleConfigChange('retriever_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="vector">向量检索</option>
                <option value="keyword">关键词检索</option>
                <option value="hybrid">混合检索</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Top K
              </label>
              <input
                type="number"
                value={config.top_k || 5}
                onChange={(e) => handleConfigChange('top_k', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                数据源
              </label>
              <input
                type="text"
                value={config.data_source || ''}
                onChange={(e) => handleConfigChange('data_source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: knowledge_base_id"
              />
            </div>
          </>
        );

      case 'condition':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                条件表达式
              </label>
              <textarea
                value={config.condition || ''}
                onChange={(e) => handleConfigChange('condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={3}
                placeholder="例如: input.score > 0.8"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                条件类型
              </label>
              <select
                value={config.condition_type || 'expression'}
                onChange={(e) => handleConfigChange('condition_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="expression">表达式</option>
                <option value="equals">等于</option>
                <option value="greater">大于</option>
                <option value="less">小于</option>
                <option value="contains">包含</option>
              </select>
            </div>
          </>
        );

      case 'loop':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                循环类型
              </label>
              <select
                value={config.loop_type || 'for'}
                onChange={(e) => handleConfigChange('loop_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="for">For循环</option>
                <option value="while">While循环</option>
                <option value="foreach">ForEach循环</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                最大迭代次数
              </label>
              <input
                type="number"
                value={config.max_iterations || 10}
                onChange={(e) => handleConfigChange('max_iterations', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                循环条件
              </label>
              <textarea
                value={config.loop_condition || ''}
                onChange={(e) => handleConfigChange('loop_condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={3}
                placeholder="例如: index < items.length"
              />
            </div>
          </>
        );

      case 'http':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请求方法
              </label>
              <select
                value={config.method || 'GET'}
                onChange={(e) => handleConfigChange('method', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="DELETE">DELETE</option>
                <option value="PATCH">PATCH</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL
              </label>
              <input
                type="text"
                value={config.url || ''}
                onChange={(e) => handleConfigChange('url', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://api.example.com/endpoint"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请求头 (JSON)
              </label>
              <textarea
                value={config.headers || ''}
                onChange={(e) => handleConfigChange('headers', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={3}
                placeholder='{"Content-Type": "application/json"}'
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                请求体 (JSON)
              </label>
              <textarea
                value={config.body || ''}
                onChange={(e) => handleConfigChange('body', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={4}
                placeholder='{"key": "value"}'
              />
            </div>
          </>
        );

      case 'transform':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                转换类型
              </label>
              <select
                value={config.transform_type || 'map'}
                onChange={(e) => handleConfigChange('transform_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="map">映射</option>
                <option value="reduce">归约</option>
                <option value="filter">过滤</option>
                <option value="sort">排序</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                转换函数
              </label>
              <textarea
                value={config.transform_function || ''}
                onChange={(e) => handleConfigChange('transform_function', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={6}
                placeholder="(item) => { return item; }"
              />
            </div>
          </>
        );

      case 'merge':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                合并策略
              </label>
              <select
                value={config.merge_strategy || 'concat'}
                onChange={(e) => handleConfigChange('merge_strategy', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="concat">连接</option>
                <option value="merge">合并</option>
                <option value="override">覆盖</option>
                <option value="deep_merge">深度合并</option>
              </select>
            </div>
          </>
        );

      case 'filter':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                过滤条件
              </label>
              <textarea
                value={config.filter_condition || ''}
                onChange={(e) => handleConfigChange('filter_condition', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={4}
                placeholder="(item) => item.value > 0"
              />
            </div>
          </>
        );

      case 'delay':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                延迟时间 (毫秒)
              </label>
              <input
                type="number"
                value={config.delay_ms || 1000}
                onChange={(e) => handleConfigChange('delay_ms', parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        );

      case 'template':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                模板内容
              </label>
              <textarea
                value={config.template || ''}
                onChange={(e) => handleConfigChange('template', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={8}
                placeholder="Hello {{name}}, your score is {{score}}"
              />
              <p className="mt-1 text-xs text-gray-500">
                使用 {`{{variable}}`} 语法插入变量
              </p>
            </div>
          </>
        );

      case 'webhook':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook路径
              </label>
              <input
                type="text"
                value={config.webhook_path || ''}
                onChange={(e) => handleConfigChange('webhook_path', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="/webhook/trigger"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                认证方式
              </label>
              <select
                value={config.auth_type || 'none'}
                onChange={(e) => handleConfigChange('auth_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="none">无</option>
                <option value="token">Token</option>
                <option value="basic">Basic Auth</option>
                <option value="api_key">API Key</option>
              </select>
            </div>
          </>
        );

      case 'switch':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                判断字段
              </label>
              <input
                type="text"
                value={config.switch_field || ''}
                onChange={(e) => handleConfigChange('switch_field', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: status"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                分支规则 (JSON)
              </label>
              <textarea
                value={config.cases || ''}
                onChange={(e) => handleConfigChange('cases', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                rows={6}
                placeholder='{"success": "path1", "error": "path2"}'
              />
            </div>
          </>
        );

      case 'set_variable':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                变量名称
              </label>
              <input
                type="text"
                value={config.variable_name || ''}
                onChange={(e) => handleConfigChange('variable_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: user_name"
              />
              <p className="mt-1 text-xs text-gray-500">
                变量名只能包含字母、数字和下划线
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                变量作用域
              </label>
              <select
                value={config.variable_scope || 'workflow'}
                onChange={(e) => handleConfigChange('variable_scope', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="workflow">工作流变量（全局）</option>
                <option value="local">局部变量（当前分支）</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                变量值来源
              </label>
              <select
                value={config.value_source || 'static'}
                onChange={(e) => handleConfigChange('value_source', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="static">静态值</option>
                <option value="input">输入数据</option>
                <option value="expression">表达式</option>
              </select>
            </div>
            {config.value_source === 'static' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  变量值
                </label>
                <textarea
                  value={config.variable_value || ''}
                  onChange={(e) => handleConfigChange('variable_value', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  rows={3}
                  placeholder='例如: "Hello World" 或 123 或 {"key": "value"}'
                />
              </div>
            )}
            {config.value_source === 'input' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  输入字段路径
                </label>
                <input
                  type="text"
                  value={config.input_path || ''}
                  onChange={(e) => handleConfigChange('input_path', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: data.user.name"
                />
              </div>
            )}
            {config.value_source === 'expression' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  表达式
                </label>
                <textarea
                  value={config.expression || ''}
                  onChange={(e) => handleConfigChange('expression', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  rows={4}
                  placeholder="例如: input.count * 2 + 10"
                />
              </div>
            )}
          </>
        );

      case 'get_variable':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                变量名称
              </label>
              <input
                type="text"
                value={config.variable_name || ''}
                onChange={(e) => handleConfigChange('variable_name', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: user_name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                默认值（可选）
              </label>
              <input
                type="text"
                value={config.default_value || ''}
                onChange={(e) => handleConfigChange('default_value', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="变量不存在时的默认值"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                输出字段名
              </label>
              <input
                type="text"
                value={config.output_field || 'value'}
                onChange={(e) => handleConfigChange('output_field', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="例如: value"
              />
            </div>
          </>
        );

      case 'if_else':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                条件类型
              </label>
              <select
                value={config.condition_type || 'expression'}
                onChange={(e) => handleConfigChange('condition_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="expression">表达式</option>
                <option value="compare">比较</option>
                <option value="exists">存在性检查</option>
                <option value="type">类型检查</option>
              </select>
            </div>

            {config.condition_type === 'expression' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  If 条件表达式
                </label>
                <textarea
                  value={config.if_condition || ''}
                  onChange={(e) => handleConfigChange('if_condition', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  rows={3}
                  placeholder="例如: input.score > 80"
                />
                <p className="mt-1 text-xs text-gray-500">
                  支持: &gt;, &lt;, ==, !=, &gt;=, &lt;=, &&, ||
                </p>
              </div>
            )}

            {config.condition_type === 'compare' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    左值
                  </label>
                  <input
                    type="text"
                    value={config.left_value || ''}
                    onChange={(e) => handleConfigChange('left_value', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如: input.score"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    比较运算符
                  </label>
                  <select
                    value={config.operator || 'equals'}
                    onChange={(e) => handleConfigChange('operator', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="equals">等于 (==)</option>
                    <option value="not_equals">不等于 (!=)</option>
                    <option value="greater">大于 (&gt;)</option>
                    <option value="greater_equals">大于等于 (&gt;=)</option>
                    <option value="less">小于 (&lt;)</option>
                    <option value="less_equals">小于等于 (&lt;=)</option>
                    <option value="contains">包含</option>
                    <option value="starts_with">开始于</option>
                    <option value="ends_with">结束于</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    右值
                  </label>
                  <input
                    type="text"
                    value={config.right_value || ''}
                    onChange={(e) => handleConfigChange('right_value', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如: 80"
                  />
                </div>
              </>
            )}

            {config.condition_type === 'exists' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  检查字段路径
                </label>
                <input
                  type="text"
                  value={config.check_path || ''}
                  onChange={(e) => handleConfigChange('check_path', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="例如: input.user.email"
                />
                <p className="mt-1 text-xs text-gray-500">
                  检查该字段是否存在且不为null/undefined
                </p>
              </div>
            )}

            {config.condition_type === 'type' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    检查字段
                  </label>
                  <input
                    type="text"
                    value={config.check_field || ''}
                    onChange={(e) => handleConfigChange('check_field', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="例如: input.value"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    期望类型
                  </label>
                  <select
                    value={config.expected_type || 'string'}
                    onChange={(e) => handleConfigChange('expected_type', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="string">字符串</option>
                    <option value="number">数字</option>
                    <option value="boolean">布尔值</option>
                    <option value="object">对象</option>
                    <option value="array">数组</option>
                  </select>
                </div>
              </>
            )}

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Else If 分支
                </label>
                <button
                  onClick={() => {
                    const elseIfs = config.else_if_conditions || [];
                    handleConfigChange('else_if_conditions', [
                      ...elseIfs,
                      { condition: '', description: '' }
                    ]);
                  }}
                  className="text-xs px-2 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  + 添加 Else If
                </button>
              </div>
              {(config.else_if_conditions || []).map((elseIf: any, index: number) => (
                <div key={index} className="mb-3 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">
                      Else If #{index + 1}
                    </span>
                    <button
                      onClick={() => {
                        const elseIfs = [...(config.else_if_conditions || [])];
                        elseIfs.splice(index, 1);
                        handleConfigChange('else_if_conditions', elseIfs);
                      }}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      删除
                    </button>
                  </div>
                  <textarea
                    value={elseIf.condition}
                    onChange={(e) => {
                      const elseIfs = [...(config.else_if_conditions || [])];
                      elseIfs[index].condition = e.target.value;
                      handleConfigChange('else_if_conditions', elseIfs);
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs font-mono"
                    rows={2}
                    placeholder="条件表达式"
                  />
                  <input
                    type="text"
                    value={elseIf.description || ''}
                    onChange={(e) => {
                      const elseIfs = [...(config.else_if_conditions || [])];
                      elseIfs[index].description = e.target.value;
                      handleConfigChange('else_if_conditions', elseIfs);
                    }}
                    className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs mt-2"
                    placeholder="描述（可选）"
                  />
                </div>
              ))}
            </div>

            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Else 分支说明
              </label>
              <input
                type="text"
                value={config.else_description || ''}
                onChange={(e) => handleConfigChange('else_description', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                placeholder="Else分支的描述"
              />
              <p className="mt-1 text-xs text-gray-500">
                💡 连接节点时：True分支连接到右侧，Else If和Else连接到左侧
              </p>
            </div>
          </>
        );

      default:
        return (
          <div className="text-sm text-gray-500 text-center py-4">
            此节点类型暂无配置项
          </div>
        );
    }
  };

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <Settings size={20} className="text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">节点配置</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X size={20} />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            节点名称
          </label>
          <input
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="节点名称"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            节点类型
          </label>
          <div className="px-3 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 capitalize">
            {selectedNode.data.type}
          </div>
        </div>

        {renderConfigFields()}

        <div className="pt-4 border-t border-gray-200">
          <button
            onClick={handleSave}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            保存配置
          </button>
        </div>
      </div>
    </div>
  );
};

