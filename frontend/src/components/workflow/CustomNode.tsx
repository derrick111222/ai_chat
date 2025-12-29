import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { 
  MessageSquare, 
  Wrench, 
  Code, 
  Database, 
  Zap,
  GitBranch,
  Repeat,
  Globe,
  FileText,
  Filter,
  Merge,
  Clock,
  Variable,
  Eye
} from 'lucide-react';

export interface CustomNodeData {
  label: string;
  type: 'chatmodel' | 'tool' | 'lambda' | 'retriever' | 'start' | 'end' | 
        'condition' | 'loop' | 'http' | 'transform' | 'merge' | 'filter' | 
        'delay' | 'template' | 'webhook' | 'switch' | 'set_variable' | 
        'get_variable' | 'if_else';
  config?: Record<string, any>;
}

const nodeIcons: Record<string, any> = {
  chatmodel: MessageSquare,
  tool: Wrench,
  lambda: Code,
  retriever: Database,
  start: Zap,
  end: Zap,
  condition: GitBranch,
  loop: Repeat,
  http: Globe,
  transform: Zap,
  merge: Merge,
  filter: Filter,
  delay: Clock,
  template: FileText,
  webhook: Zap,
  switch: Filter,
  set_variable: Variable,
  get_variable: Eye,
  if_else: GitBranch,
};

const nodeColors: Record<string, string> = {
  chatmodel: 'from-blue-500 to-blue-600',
  tool: 'from-green-500 to-green-600',
  lambda: 'from-purple-500 to-purple-600',
  retriever: 'from-orange-500 to-orange-600',
  start: 'from-gray-500 to-gray-600',
  end: 'from-red-500 to-red-600',
  condition: 'from-yellow-500 to-yellow-600',
  loop: 'from-pink-500 to-pink-600',
  http: 'from-red-500 to-red-600',
  transform: 'from-cyan-500 to-cyan-600',
  merge: 'from-teal-500 to-teal-600',
  filter: 'from-lime-500 to-lime-600',
  delay: 'from-gray-500 to-gray-600',
  template: 'from-amber-500 to-amber-600',
  webhook: 'from-violet-500 to-violet-600',
  switch: 'from-indigo-500 to-indigo-600',
  set_variable: 'from-emerald-500 to-emerald-600',
  get_variable: 'from-sky-500 to-sky-600',
  if_else: 'from-fuchsia-500 to-fuchsia-600',
};

export const CustomNode: React.FC<NodeProps<CustomNodeData>> = ({ data, selected }) => {
  const Icon = nodeIcons[data.type] || MessageSquare;
  const colorClass = nodeColors[data.type] || 'from-gray-500 to-gray-600';

  return (
    <div
      className={`px-4 py-3 rounded-lg shadow-lg border-2 transition-all ${
        selected ? 'border-blue-500 shadow-xl' : 'border-gray-300'
      } bg-white min-w-[180px]`}
    >
      {data.type !== 'start' && (
        <Handle
          type="target"
          position={Position.Top}
          className="w-3 h-3 !bg-gray-400"
        />
      )}
      
      <div className="flex items-center space-x-2">
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colorClass} flex items-center justify-center`}>
          <Icon size={18} className="text-white" />
        </div>
        <div>
          <div className="font-semibold text-gray-900 text-sm">{data.label}</div>
          <div className="text-xs text-gray-500 capitalize">{data.type}</div>
        </div>
      </div>

      {data.config && Object.keys(data.config).length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            {Object.keys(data.config).length} 个配置项
          </div>
        </div>
      )}

      {data.type !== 'end' && (
        <Handle
          type="source"
          position={Position.Bottom}
          className="w-3 h-3 !bg-gray-400"
        />
      )}
    </div>
  );
};

