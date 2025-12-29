import { api } from '../utils/api';

export interface WorkflowNode {
  id: string;
  type: string;
  label: string;
  config: Record<string, any>;
  position: { x: number; y: number };
}

export interface WorkflowEdge {
  source: string;
  target: string;
  field_mapping?: Record<string, string>;
}

export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface SavedWorkflow {
  id?: string;
  name: string;
  description?: string;
  workflow_definition: WorkflowDefinition;
  created_at?: string;
  updated_at?: string;
}

export interface CreateAgentFromWorkflowRequest {
  name: string;
  description?: string;
  api_config_id?: number;
  is_public: boolean;
  workflow_definition: WorkflowDefinition;
  system_prompt?: string;
  model_name?: string;
}

export const workflowService = {
  // 保存工作流到 localStorage
  saveToLocal: (workflow: SavedWorkflow) => {
    const workflows = workflowService.listLocal();
    const existingIndex = workflows.findIndex(w => w.name === workflow.name);
    
    if (existingIndex >= 0) {
      workflows[existingIndex] = {
        ...workflow,
        updated_at: new Date().toISOString(),
      };
    } else {
      workflows.push({
        ...workflow,
        id: `workflow_${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
    }
    
    localStorage.setItem('saved_workflows', JSON.stringify(workflows));
    return workflows[existingIndex >= 0 ? existingIndex : workflows.length - 1];
  },

  // 从 localStorage 获取所有工作流
  listLocal: (): SavedWorkflow[] => {
    const data = localStorage.getItem('saved_workflows');
    return data ? JSON.parse(data) : [];
  },

  // 从 localStorage 获取单个工作流
  getLocal: (id: string): SavedWorkflow | null => {
    const workflows = workflowService.listLocal();
    return workflows.find(w => w.id === id) || null;
  },

  // 从 localStorage 删除工作流
  deleteLocal: (id: string) => {
    const workflows = workflowService.listLocal();
    const filtered = workflows.filter(w => w.id !== id);
    localStorage.setItem('saved_workflows', JSON.stringify(filtered));
  },

  // 验证工作流
  validate: (definition: WorkflowDefinition): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!definition.nodes || definition.nodes.length === 0) {
      errors.push('工作流至少需要一个节点');
    }

    // 检查节点 ID 唯一性
    const nodeIds = new Set<string>();
    definition.nodes.forEach(node => {
      if (!node.id) {
        errors.push('节点缺少 ID');
      } else if (nodeIds.has(node.id)) {
        errors.push(`节点 ID 重复: ${node.id}`);
      } else {
        nodeIds.add(node.id);
      }
    });

    // 检查边的有效性
    definition.edges.forEach(edge => {
      if (!nodeIds.has(edge.source)) {
        errors.push(`边的源节点不存在: ${edge.source}`);
      }
      if (!nodeIds.has(edge.target)) {
        errors.push(`边的目标节点不存在: ${edge.target}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  },

  // 从工作流创建 Agent（后端 API）
  createAgentFromWorkflow: (data: CreateAgentFromWorkflowRequest) => {
    return api.post('/agents/from-workflow', data);
  },

  // 导出工作流为 JSON
  exportToJSON: (workflow: SavedWorkflow): string => {
    return JSON.stringify(workflow, null, 2);
  },

  // 从 JSON 导入工作流
  importFromJSON: (json: string): SavedWorkflow => {
    return JSON.parse(json);
  },

  // 获取工作流摘要
  getSummary: (definition: WorkflowDefinition) => {
    const nodeTypeCount: Record<string, number> = {};
    definition.nodes.forEach(node => {
      nodeTypeCount[node.type] = (nodeTypeCount[node.type] || 0) + 1;
    });

    return {
      totalNodes: definition.nodes.length,
      totalEdges: definition.edges.length,
      nodeTypeCount,
    };
  },
};

