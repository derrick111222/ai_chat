import React from 'react';
import { 
  MessageSquare, 
  Wrench, 
  Code, 
  Database, 
  GitBranch, 
  Repeat, 
  Globe, 
  FileText,
  Filter,
  Merge,
  Clock,
  Zap,
  Variable,
  Eye
} from 'lucide-react';

export interface NodeType {
  type: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  color: string;
  category: 'core' | 'logic' | 'data' | 'integration';
}

const nodeTypes: NodeType[] = [
  // 核心节点
  {
    type: 'chatmodel',
    label: 'ChatModel',
    icon: <MessageSquare size={20} />,
    description: '大语言模型节点',
    color: 'bg-blue-500',
    category: 'core',
  },
  {
    type: 'tool',
    label: 'Tool',
    icon: <Wrench size={20} />,
    description: '工具调用节点',
    color: 'bg-green-500',
    category: 'core',
  },
  {
    type: 'lambda',
    label: 'Lambda',
    icon: <Code size={20} />,
    description: '自定义函数节点',
    color: 'bg-purple-500',
    category: 'core',
  },
  {
    type: 'retriever',
    label: 'Retriever',
    icon: <Database size={20} />,
    description: '检索器节点',
    color: 'bg-orange-500',
    category: 'core',
  },
  
  // 逻辑控制节点
  {
    type: 'condition',
    label: 'Condition',
    icon: <GitBranch size={20} />,
    description: '条件判断节点',
    color: 'bg-yellow-500',
    category: 'logic',
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: <Repeat size={20} />,
    description: '循环执行节点',
    color: 'bg-pink-500',
    category: 'logic',
  },
  {
    type: 'switch',
    label: 'Switch',
    icon: <Filter size={20} />,
    description: '多路分支节点',
    color: 'bg-indigo-500',
    category: 'logic',
  },
  
  // 数据处理节点
  {
    type: 'transform',
    label: 'Transform',
    icon: <Zap size={20} />,
    description: '数据转换节点',
    color: 'bg-cyan-500',
    category: 'data',
  },
  {
    type: 'merge',
    label: 'Merge',
    icon: <Merge size={20} />,
    description: '数据合并节点',
    color: 'bg-teal-500',
    category: 'data',
  },
  {
    type: 'filter',
    label: 'Filter',
    icon: <Filter size={20} />,
    description: '数据过滤节点',
    color: 'bg-lime-500',
    category: 'data',
  },
  
  // 集成节点
  {
    type: 'http',
    label: 'HTTP Request',
    icon: <Globe size={20} />,
    description: 'HTTP请求节点',
    color: 'bg-red-500',
    category: 'integration',
  },
  {
    type: 'webhook',
    label: 'Webhook',
    icon: <Zap size={20} />,
    description: 'Webhook触发器',
    color: 'bg-violet-500',
    category: 'integration',
  },
  {
    type: 'delay',
    label: 'Delay',
    icon: <Clock size={20} />,
    description: '延迟执行节点',
    color: 'bg-gray-500',
    category: 'integration',
  },
  {
    type: 'template',
    label: 'Template',
    icon: <FileText size={20} />,
    description: '模板渲染节点',
    color: 'bg-amber-500',
    category: 'data',
  },
  
  // 变量节点
  {
    type: 'set_variable',
    label: 'Set Variable',
    icon: <Variable size={20} />,
    description: '设置变量节点',
    color: 'bg-emerald-500',
    category: 'data',
  },
  {
    type: 'get_variable',
    label: 'Get Variable',
    icon: <Eye size={20} />,
    description: '获取变量节点',
    color: 'bg-sky-500',
    category: 'data',
  },
  {
    type: 'if_else',
    label: 'If-Else',
    icon: <GitBranch size={20} />,
    description: 'If-Else条件分支',
    color: 'bg-fuchsia-500',
    category: 'logic',
  },
];

interface NodePanelProps {
  onDragStart: (event: React.DragEvent, nodeType: string) => void;
}

export const NodePanel: React.FC<NodePanelProps> = ({ onDragStart }) => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  
  const categories = [
    { id: 'all', name: '全部' },
    { id: 'core', name: '核心' },
    { id: 'logic', name: '逻辑' },
    { id: 'data', name: '数据' },
    { id: 'integration', name: '集成' },
  ];
  
  const filteredNodes = selectedCategory === 'all' 
    ? nodeTypes 
    : nodeTypes.filter(node => node.category === selectedCategory);
  
  return (
    <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">节点库</h3>
      <p className="text-sm text-gray-600 mb-4">拖拽节点到画布</p>
      
      {/* 分类筛选 */}
      <div className="flex flex-wrap gap-2 mb-4">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 text-xs rounded-full transition-colors ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>
      
      <div className="space-y-3">
        {filteredNodes.map((node) => (
          <div
            key={node.type}
            draggable
            onDragStart={(e) => onDragStart(e, node.type)}
            className="p-3 border border-gray-200 rounded-lg cursor-move hover:border-blue-500 hover:shadow-md transition-all"
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 ${node.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                {node.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">{node.label}</div>
                <div className="text-xs text-gray-500 truncate">{node.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-3 bg-blue-50 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">使用提示</h4>
        <ul className="text-xs text-blue-700 space-y-1">
          <li>• 拖拽节点到画布</li>
          <li>• 连接节点创建流程</li>
          <li>• 点击节点配置参数</li>
          <li>• 保存工作流</li>
        </ul>
      </div>
    </div>
  );
};

