import React, { useState, useCallback, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
  MarkerType,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { Save, Play, ArrowLeft, Trash2, Download, Upload, Bot, Variable, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CustomNode, CustomNodeData } from '../components/workflow/CustomNode';
import { NodePanel } from '../components/workflow/NodePanel';
import { NodeConfigPanel } from '../components/workflow/NodeConfigPanel';
import { workflowService, WorkflowDefinition } from '../services/workflowService';
import { apiConfigService } from '../services/apiConfigService';
import { APIConfig } from '../types';

const nodeTypes: NodeTypes = {
  custom: CustomNode,
};

let nodeId = 0;
const getId = () => `node_${nodeId++}`;

const WorkflowEditor: React.FC = () => {
  const navigate = useNavigate();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [selectedNode, setSelectedNode] = useState<Node<CustomNodeData> | null>(null);
  const [workflowName, setWorkflowName] = useState('新工作流');
  const [showCreateAgentModal, setShowCreateAgentModal] = useState(false);
  const [showVariablesPanel, setShowVariablesPanel] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [workflowVariables, setWorkflowVariables] = useState<Record<string, any>>({});
  const [testInput, setTestInput] = useState('{\n  "message": "Hello"\n}');
  const [testResult, setTestResult] = useState<any>(null);
  const [testRunning, setTestRunning] = useState(false);
  const [nodeExecutionStatus, setNodeExecutionStatus] = useState<Record<string, 'pending' | 'running' | 'success' | 'error'>>({});
  const [apiConfigs, setApiConfigs] = useState<APIConfig[]>([]);
  const [agentFormData, setAgentFormData] = useState({
    name: '',
    description: '',
    api_config_id: '',
    system_prompt: '',
    is_public: false,
  });

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!reactFlowWrapper.current || !reactFlowInstance) {
        return;
      }

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');

      if (!type) {
        return;
      }

      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node<CustomNodeData> = {
        id: getId(),
        type: 'custom',
        position,
        data: {
          label: `${type} 节点`,
          type: type as any,
          config: {},
        },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [reactFlowInstance, setNodes]
  );

  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node as Node<CustomNodeData>);
  }, []);

  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  const handleNodeUpdate = useCallback(
    (nodeId: string, data: Partial<CustomNodeData>) => {
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === nodeId) {
            return {
              ...node,
              data: {
                ...node.data,
                ...data,
              },
            };
          }
          return node;
        })
      );
    },
    [setNodes]
  );

  const handleSave = () => {
    const workflow = {
      name: workflowName,
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        config: node.data.config,
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };

    console.log('保存工作流:', workflow);
    
    // 保存到 localStorage 作为演示
    localStorage.setItem('workflow_draft', JSON.stringify(workflow));
    
    alert('工作流已保存！');
  };

  const handleTest = () => {
    if (nodes.length === 0) {
      alert('请先添加节点');
      return;
    }

    // 验证工作流
    const workflowDef: WorkflowDefinition = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        config: node.data.config || {},
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };

    const validation = workflowService.validate(workflowDef);
    if (!validation.valid) {
      alert('工作流验证失败：\n' + validation.errors.join('\n'));
      return;
    }

    // 重置测试状态
    setTestResult(null);
    setNodeExecutionStatus({});
    setShowTestModal(true);
  };

  const handleRunTest = async () => {
    setTestRunning(true);
    setTestResult(null);
    
    // 初始化所有节点状态为pending
    const initialStatus: Record<string, 'pending' | 'running' | 'success' | 'error'> = {};
    nodes.forEach(node => {
      initialStatus[node.id] = 'pending';
    });
    setNodeExecutionStatus(initialStatus);

    try {
      // 解析测试输入
      let inputData;
      try {
        inputData = JSON.parse(testInput);
      } catch (e) {
        throw new Error('测试输入不是有效的JSON格式');
      }

      // 模拟工作流执行
      const result = await simulateWorkflowExecution(inputData);
      
      setTestResult({
        success: true,
        output: result,
        executionTime: Date.now(),
      });
    } catch (error: any) {
      setTestResult({
        success: false,
        error: error.message || '执行失败',
        executionTime: Date.now(),
      });
    } finally {
      setTestRunning(false);
    }
  };

  const simulateWorkflowExecution = async (inputData: any): Promise<any> => {
    // 构建节点执行顺序（简单的拓扑排序）
    const executionOrder = getExecutionOrder();
    
    let currentData = inputData;
    const executionResults: Record<string, any> = {};
    const variables = { ...workflowVariables };

    for (const nodeId of executionOrder) {
      const node = nodes.find(n => n.id === nodeId);
      if (!node) continue;

      // 更新节点状态为运行中
      setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'running' }));
      
      // 模拟延迟
      await new Promise(resolve => setTimeout(resolve, 500));

      try {
        // 根据节点类型执行
        const result = await executeNode(node, currentData, variables, executionResults);
        executionResults[nodeId] = result;
        currentData = result;

        // 更新节点状态为成功
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'success' }));
      } catch (error: any) {
        // 更新节点状态为错误
        setNodeExecutionStatus(prev => ({ ...prev, [nodeId]: 'error' }));
        throw new Error(`节点 "${node.data.label}" 执行失败: ${error.message}`);
      }
    }

    return {
      finalOutput: currentData,
      nodeResults: executionResults,
      variables: variables,
    };
  };

  const getExecutionOrder = (): string[] => {
    // 简单的拓扑排序
    const order: string[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (nodeId: string) => {
      if (visited.has(nodeId)) return;
      if (visiting.has(nodeId)) {
        throw new Error('检测到循环依赖');
      }

      visiting.add(nodeId);

      // 获取所有指向当前节点的边
      const incomingEdges = edges.filter(e => e.target === nodeId);
      for (const edge of incomingEdges) {
        visit(edge.source);
      }

      visiting.delete(nodeId);
      visited.add(nodeId);
      order.push(nodeId);
    };

    // 找到所有起始节点（没有输入边的节点）
    const startNodes = nodes.filter(node => 
      !edges.some(edge => edge.target === node.id)
    );

    for (const node of startNodes) {
      visit(node.id);
    }

    return order;
  };

  const executeNode = async (
    node: Node<CustomNodeData>,
    input: any,
    variables: Record<string, any>,
    previousResults: Record<string, any>
  ): Promise<any> => {
    const { type, config } = node.data;

    switch (type) {
      case 'set_variable':
        return executeSetVariable(config, input, variables);
      
      case 'get_variable':
        return executeGetVariable(config, variables);
      
      case 'if_else':
        return executeIfElse(config, input, variables);
      
      case 'lambda':
        return executeLambda(config, input, variables);
      
      case 'transform':
        return executeTransform(config, input);
      
      case 'filter':
        return executeFilter(config, input);
      
      case 'merge':
        return executeMerge(config, input, previousResults);
      
      case 'template':
        return executeTemplate(config, input, variables);
      
      default:
        // 对于其他节点类型，返回模拟结果
        return {
          nodeType: type,
          input: input,
          output: `${type} 节点执行结果（模拟）`,
          timestamp: new Date().toISOString(),
        };
    }
  };

  const executeSetVariable = (config: any, input: any, variables: Record<string, any>) => {
    const varName = config.variable_name;
    if (!varName) throw new Error('变量名称未设置');

    let value;
    switch (config.value_source) {
      case 'static':
        try {
          value = JSON.parse(config.variable_value || 'null');
        } catch {
          value = config.variable_value;
        }
        break;
      case 'input':
        value = getNestedValue(input, config.input_path || '');
        break;
      case 'expression':
        value = evaluateExpression(config.expression || '', input, variables);
        break;
      default:
        value = null;
    }

    variables[varName] = value;
    return { variable: varName, value, input };
  };

  const executeGetVariable = (config: any, variables: Record<string, any>) => {
    const varName = config.variable_name;
    if (!varName) throw new Error('变量名称未设置');

    const value = variables[varName] ?? config.default_value;
    const outputField = config.output_field || 'value';

    return { [outputField]: value };
  };

  const executeIfElse = (config: any, input: any, variables: Record<string, any>) => {
    let conditionMet = false;
    let branch = 'else';

    // 评估主条件
    if (config.condition_type === 'expression') {
      conditionMet = evaluateExpression(config.if_condition || '', input, variables);
      if (conditionMet) branch = 'if';
    } else if (config.condition_type === 'compare') {
      const leftValue = getNestedValue(input, config.left_value || '');
      const rightValue = config.right_value;
      conditionMet = compareValues(leftValue, rightValue, config.operator || 'equals');
      if (conditionMet) branch = 'if';
    } else if (config.condition_type === 'exists') {
      const value = getNestedValue(input, config.check_path || '');
      conditionMet = value !== null && value !== undefined;
      if (conditionMet) branch = 'if';
    } else if (config.condition_type === 'type') {
      const value = getNestedValue(input, config.check_field || '');
      const expectedType = config.expected_type || 'string';
      conditionMet = checkType(value, expectedType);
      if (conditionMet) branch = 'if';
    }

    // 如果主条件不满足，检查 else if
    if (!conditionMet && config.else_if_conditions) {
      for (let i = 0; i < config.else_if_conditions.length; i++) {
        const elseIfCondition = config.else_if_conditions[i].condition;
        if (evaluateExpression(elseIfCondition, input, variables)) {
          conditionMet = true;
          branch = `else_if_${i}`;
          break;
        }
      }
    }

    return {
      conditionMet,
      branch,
      input,
    };
  };

  const executeLambda = (config: any, input: any, variables: Record<string, any>) => {
    const code = config.code || '';
    if (!code) throw new Error('Lambda代码未设置');

    try {
      // 创建一个安全的执行环境
      const func = new Function('input', 'variables', `
        ${code}
        return typeof process === 'function' ? process(input) : input;
      `);
      
      const result = func(input, variables);
      return result;
    } catch (error: any) {
      throw new Error(`代码执行错误: ${error.message}`);
    }
  };

  const executeTransform = (config: any, input: any) => {
    const transformType = config.transform_type || 'map';
    const transformFunc = config.transform_function || '';

    if (!transformFunc) throw new Error('转换函数未设置');

    try {
      const func = new Function('item', 'index', transformFunc);
      
      if (Array.isArray(input)) {
        switch (transformType) {
          case 'map':
            return input.map((item, index) => func(item, index));
          case 'filter':
            return input.filter((item, index) => func(item, index));
          case 'reduce':
            return input.reduce((acc, item, index) => func(acc, item, index));
          default:
            return input;
        }
      } else {
        return func(input, 0);
      }
    } catch (error: any) {
      throw new Error(`转换执行错误: ${error.message}`);
    }
  };

  const executeFilter = (config: any, input: any) => {
    const condition = config.filter_condition || '';
    if (!condition) throw new Error('过滤条件未设置');

    try {
      const func = new Function('item', `return ${condition}`);
      
      if (Array.isArray(input)) {
        return input.filter(item => func(item));
      } else {
        return func(input) ? input : null;
      }
    } catch (error: any) {
      throw new Error(`过滤执行错误: ${error.message}`);
    }
  };

  const executeMerge = (config: any, input: any, previousResults: Record<string, any>) => {
    const strategy = config.merge_strategy || 'concat';
    
    // 简单实现：合并当前输入和所有之前的结果
    const allData = [input, ...Object.values(previousResults)];
    
    switch (strategy) {
      case 'concat':
        return allData.flat();
      case 'merge':
        return Object.assign({}, ...allData);
      default:
        return allData;
    }
  };

  const executeTemplate = (config: any, input: any, variables: Record<string, any>) => {
    let template = config.template || '';
    if (!template) throw new Error('模板未设置');

    // 替换变量
    template = template.replace(/\{\{([^}]+)\}\}/g, (match: string, key: string) => {
      const trimmedKey = key.trim();
      if (trimmedKey.startsWith('$')) {
        // 变量引用
        return variables[trimmedKey.substring(1)] || match;
      } else {
        // 输入数据引用
        return getNestedValue(input, trimmedKey) || match;
      }
    });

    return { result: template, input };
  };

  // 辅助函数
  const getNestedValue = (obj: any, path: string): any => {
    if (!path) return obj;
    return path.split('.').reduce((current, key) => current?.[key], obj);
  };

  const evaluateExpression = (expr: string, input: any, variables: Record<string, any>): any => {
    // 替换变量引用
    let processedExpr = expr.replace(/\$(\w+)/g, (match, varName) => {
      return JSON.stringify(variables[varName]);
    });

    try {
      const func = new Function('input', `return ${processedExpr}`);
      return func(input);
    } catch (error) {
      return false;
    }
  };

  const compareValues = (left: any, right: any, operator: string): boolean => {
    switch (operator) {
      case 'equals': return left == right;
      case 'not_equals': return left != right;
      case 'greater': return left > right;
      case 'greater_equals': return left >= right;
      case 'less': return left < right;
      case 'less_equals': return left <= right;
      case 'contains': return String(left).includes(String(right));
      case 'starts_with': return String(left).startsWith(String(right));
      case 'ends_with': return String(left).endsWith(String(right));
      default: return false;
    }
  };

  const checkType = (value: any, expectedType: string): boolean => {
    switch (expectedType) {
      case 'string': return typeof value === 'string';
      case 'number': return typeof value === 'number';
      case 'boolean': return typeof value === 'boolean';
      case 'object': return typeof value === 'object' && !Array.isArray(value);
      case 'array': return Array.isArray(value);
      default: return false;
    }
  };

  const handleClear = () => {
    if (window.confirm('确定要清空画布吗？')) {
      setNodes([]);
      setEdges([]);
      setSelectedNode(null);
    }
  };

  const handleBack = () => {
    if (nodes.length > 0) {
      if (window.confirm('有未保存的更改，确定要离开吗？')) {
        navigate('/agents');
      }
    } else {
      navigate('/agents');
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

  const handleCreateAgent = () => {
    if (nodes.length === 0) {
      alert('请先添加节点到工作流');
      return;
    }

    // 验证工作流
    const workflowDef: WorkflowDefinition = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        config: node.data.config || {},
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };

    const validation = workflowService.validate(workflowDef);
    if (!validation.valid) {
      alert('工作流验证失败：\n' + validation.errors.join('\n'));
      return;
    }

    loadApiConfigs();
    setAgentFormData({
      name: workflowName || '新智能体',
      description: '',
      api_config_id: '',
      system_prompt: '',
      is_public: false,
    });
    setShowCreateAgentModal(true);
  };

  const handleSubmitAgent = async (e: React.FormEvent) => {
    e.preventDefault();

    const workflowDef: WorkflowDefinition = {
      nodes: nodes.map((node) => ({
        id: node.id,
        type: node.data.type,
        label: node.data.label,
        config: node.data.config || {},
        position: node.position,
      })),
      edges: edges.map((edge) => ({
        source: edge.source,
        target: edge.target,
      })),
    };

    try {
      await workflowService.createAgentFromWorkflow({
        name: agentFormData.name,
        description: agentFormData.description,
        api_config_id: agentFormData.api_config_id ? parseInt(agentFormData.api_config_id) : undefined,
        is_public: agentFormData.is_public,
        workflow_definition: workflowDef,
        system_prompt: agentFormData.system_prompt,
      });

      alert('Agent 创建成功！');
      setShowCreateAgentModal(false);
      navigate('/agents');
    } catch (error: any) {
      alert('创建失败: ' + (error.message || '未知错误'));
    }
  };

  const handleExport = () => {
    const workflow = {
      name: workflowName,
      description: '导出的工作流',
      workflow_definition: {
        nodes: nodes.map((node) => ({
          id: node.id,
          type: node.data.type,
          label: node.data.label,
          config: node.data.config || {},
          position: node.position,
        })),
        edges: edges.map((edge) => ({
          source: edge.source,
          target: edge.target,
        })),
      },
    };

    const json = workflowService.exportToJSON(workflow);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflowName}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const workflow = workflowService.importFromJSON(event.target?.result as string);
            setWorkflowName(workflow.name);
            
            // 转换节点
            const importedNodes = workflow.workflow_definition.nodes.map((node) => ({
              id: node.id,
              type: 'custom',
              position: node.position,
              data: {
                label: node.label,
                type: node.type as any,
                config: node.config,
              },
            }));

            // 转换边
            const importedEdges = workflow.workflow_definition.edges.map((edge, index) => ({
              id: `edge_${index}`,
              source: edge.source,
              target: edge.target,
              type: 'smoothstep',
              animated: true,
              markerEnd: {
                type: MarkerType.ArrowClosed,
              },
            }));

            setNodes(importedNodes);
            setEdges(importedEdges);
            alert('工作流导入成功！');
          } catch (error) {
            alert('导入失败：文件格式不正确');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* 顶部工具栏 */}
      <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={handleBack}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={20} className="mr-2" />
            返回
          </button>
          <div className="h-6 w-px bg-gray-300" />
          <input
            type="text"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="text-lg font-semibold text-gray-900 bg-transparent border-none focus:outline-none focus:ring-0"
            placeholder="工作流名称"
          />
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowVariablesPanel(!showVariablesPanel)}
            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
              showVariablesPanel
                ? 'bg-purple-100 text-purple-700'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <Variable size={18} className="mr-2" />
            变量
          </button>
          <button
            onClick={handleImport}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Upload size={18} className="mr-2" />
            导入
          </button>
          <button
            onClick={handleExport}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={nodes.length === 0}
          >
            <Download size={18} className="mr-2" />
            导出
          </button>
          <button
            onClick={handleClear}
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Trash2 size={18} className="mr-2" />
            清空
          </button>
          <button
            onClick={handleTest}
            className="flex items-center px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
          >
            <Play size={18} className="mr-2" />
            测试
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Save size={18} className="mr-2" />
            保存
          </button>
          <button
            onClick={handleCreateAgent}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={nodes.length === 0}
          >
            <Bot size={18} className="mr-2" />
            创建 Agent
          </button>
        </div>
      </div>

      {/* 主要内容区 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 节点面板 */}
        <NodePanel onDragStart={onDragStart} />

        {/* 画布区域 */}
        <div className="flex-1 relative" ref={reactFlowWrapper}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onInit={setReactFlowInstance}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            attributionPosition="bottom-left"
          >
            <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
            <Controls />
          </ReactFlow>

          {/* 空状态提示 */}
          {nodes.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  开始创建工作流
                </h3>
                <p className="text-gray-500">
                  从左侧拖拽节点到画布，连接它们创建工作流
                </p>
              </div>
            </div>
          )}
        </div>

        {/* 配置面板 */}
        {selectedNode && (
          <NodeConfigPanel
            selectedNode={selectedNode}
            onClose={() => setSelectedNode(null)}
            onUpdate={handleNodeUpdate}
          />
        )}

        {/* 变量管理面板 */}
        {showVariablesPanel && (
          <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Variable size={20} className="text-purple-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">工作流变量</h3>
              </div>
              <button
                onClick={() => setShowVariablesPanel(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              {/* 变量列表 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    全局变量
                  </label>
                  <button
                    onClick={() => {
                      const varName = prompt('输入变量名称:');
                      if (varName && /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(varName)) {
                        setWorkflowVariables({
                          ...workflowVariables,
                          [varName]: '',
                        });
                      } else if (varName) {
                        alert('变量名只能包含字母、数字和下划线，且不能以数字开头');
                      }
                    }}
                    className="text-xs px-2 py-1 bg-purple-600 text-white rounded hover:bg-purple-700"
                  >
                    + 添加
                  </button>
                </div>

                {Object.keys(workflowVariables).length === 0 ? (
                  <div className="text-sm text-gray-500 text-center py-8">
                    <Variable size={32} className="mx-auto mb-2 text-gray-400" />
                    <p>还没有变量</p>
                    <p className="text-xs mt-1">点击"添加"创建变量</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(workflowVariables).map(([key, value]) => (
                      <div key={key} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-900">
                            {key}
                          </span>
                          <button
                            onClick={() => {
                              const newVars = { ...workflowVariables };
                              delete newVars[key];
                              setWorkflowVariables(newVars);
                            }}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            删除
                          </button>
                        </div>
                        <input
                          type="text"
                          value={value as string}
                          onChange={(e) => {
                            setWorkflowVariables({
                              ...workflowVariables,
                              [key]: e.target.value,
                            });
                          }}
                          className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="变量值"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 使用说明 */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  使用说明
                </h4>
                <div className="text-xs text-gray-600 space-y-2">
                  <div>
                    <strong>设置变量:</strong> 使用 Set Variable 节点
                  </div>
                  <div>
                    <strong>获取变量:</strong> 使用 Get Variable 节点
                  </div>
                  <div>
                    <strong>引用变量:</strong> 在表达式中使用 <code className="bg-gray-100 px-1 rounded">$变量名</code>
                  </div>
                  <div className="pt-2 mt-2 border-t border-gray-200">
                    <strong>示例:</strong>
                    <pre className="bg-gray-100 p-2 rounded mt-1 text-xs">
{`// 在条件表达式中
$user_score > 80

// 在Lambda中
input.value + $threshold`}
                    </pre>
                  </div>
                </div>
              </div>

              {/* 变量统计 */}
              <div className="pt-4 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">
                  变量统计
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-purple-50 p-2 rounded">
                    <div className="text-purple-600 font-medium">全局变量</div>
                    <div className="text-purple-900 text-lg font-bold">
                      {Object.keys(workflowVariables).length}
                    </div>
                  </div>
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="text-blue-600 font-medium">Set节点</div>
                    <div className="text-blue-900 text-lg font-bold">
                      {nodes.filter(n => n.data.type === 'set_variable').length}
                    </div>
                  </div>
                  <div className="bg-green-50 p-2 rounded">
                    <div className="text-green-600 font-medium">Get节点</div>
                    <div className="text-green-900 text-lg font-bold">
                      {nodes.filter(n => n.data.type === 'get_variable').length}
                    </div>
                  </div>
                  <div className="bg-pink-50 p-2 rounded">
                    <div className="text-pink-600 font-medium">If-Else节点</div>
                    <div className="text-pink-900 text-lg font-bold">
                      {nodes.filter(n => n.data.type === 'if_else').length}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 创建 Agent 模态框 */}
      {showCreateAgentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">
                从工作流创建 Agent
              </h3>
            </div>

            <form onSubmit={handleSubmitAgent} className="p-6 space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-blue-900 mb-2">工作流摘要</h4>
                <div className="text-sm text-blue-700">
                  <p>节点数量: {nodes.length}</p>
                  <p>连接数量: {edges.length}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agent 名称 *
                </label>
                <input
                  type="text"
                  required
                  value={agentFormData.name}
                  onChange={(e) => setAgentFormData({ ...agentFormData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="给你的 Agent 起个名字"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  描述
                </label>
                <textarea
                  value={agentFormData.description}
                  onChange={(e) => setAgentFormData({ ...agentFormData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="描述这个 Agent 的用途"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  系统提示词
                </label>
                <textarea
                  value={agentFormData.system_prompt}
                  onChange={(e) => setAgentFormData({ ...agentFormData, system_prompt: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={4}
                  placeholder="定义 Agent 的角色和行为..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  API配置 *
                </label>
                <select
                  value={agentFormData.api_config_id}
                  onChange={(e) => setAgentFormData({ ...agentFormData, api_config_id: e.target.value })}
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_public"
                  checked={agentFormData.is_public}
                  onChange={(e) => setAgentFormData({ ...agentFormData, is_public: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_public" className="ml-2 text-sm text-gray-700">
                  公开此 Agent（其他用户可以查看和使用）
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t">
                <button
                  type="button"
                  onClick={() => setShowCreateAgentModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  创建 Agent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 测试模态框 */}
      {showTestModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
              <div className="flex items-center">
                <Play size={24} className="text-blue-600 mr-3" />
                <h3 className="text-lg font-semibold text-gray-900">
                  测试工作流
                </h3>
              </div>
              <button
                onClick={() => setShowTestModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* 测试输入 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  测试输入数据 (JSON)
                </label>
                <textarea
                  value={testInput}
                  onChange={(e) => setTestInput(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                  rows={8}
                  placeholder='{\n  "message": "Hello",\n  "user": "test"\n}'
                />
                <div className="mt-2 flex items-center justify-between">
                  <p className="text-xs text-gray-500">
                    💡 输入将作为工作流的初始数据
                  </p>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setTestInput('{\n  "message": "Hello"\n}')}
                      className="text-xs px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      示例1
                    </button>
                    <button
                      onClick={() => setTestInput('{\n  "score": 85,\n  "user": "Alice"\n}')}
                      className="text-xs px-3 py-1 text-blue-600 hover:bg-blue-50 rounded"
                    >
                      示例2
                    </button>
                  </div>
                </div>
              </div>

              {/* 节点执行状态 */}
              {Object.keys(nodeExecutionStatus).length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    节点执行状态
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {nodes.map((node) => {
                      const status = nodeExecutionStatus[node.id] || 'pending';
                      const statusConfig = {
                        pending: { color: 'bg-gray-100 text-gray-600', icon: '⏸️', text: '等待' },
                        running: { color: 'bg-blue-100 text-blue-700', icon: '▶️', text: '运行中' },
                        success: { color: 'bg-green-100 text-green-700', icon: '✅', text: '成功' },
                        error: { color: 'bg-red-100 text-red-700', icon: '❌', text: '失败' },
                      };
                      const config = statusConfig[status];

                      return (
                        <div
                          key={node.id}
                          className={`p-3 rounded-lg ${config.color} flex items-center justify-between`}
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">{config.icon}</span>
                            <div>
                              <div className="font-medium text-sm">{node.data.label}</div>
                              <div className="text-xs opacity-75">{node.data.type}</div>
                            </div>
                          </div>
                          <span className="text-xs font-medium">{config.text}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 测试结果 */}
              {testResult && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    测试结果
                  </label>
                  <div className={`p-4 rounded-lg ${
                    testResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center mb-3">
                      <span className="text-2xl mr-2">
                        {testResult.success ? '✅' : '❌'}
                      </span>
                      <span className={`font-semibold ${
                        testResult.success ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {testResult.success ? '执行成功' : '执行失败'}
                      </span>
                    </div>

                    {testResult.success ? (
                      <div className="space-y-3">
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">最终输出：</div>
                          <pre className="bg-white p-3 rounded border border-green-200 text-xs overflow-x-auto">
                            {JSON.stringify(testResult.output.finalOutput, null, 2)}
                          </pre>
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">变量状态：</div>
                          <pre className="bg-white p-3 rounded border border-green-200 text-xs overflow-x-auto">
                            {JSON.stringify(testResult.output.variables, null, 2)}
                          </pre>
                        </div>

                        <details className="cursor-pointer">
                          <summary className="text-sm font-medium text-gray-700 mb-1">
                            节点执行详情 (点击展开)
                          </summary>
                          <pre className="bg-white p-3 rounded border border-green-200 text-xs overflow-x-auto mt-2">
                            {JSON.stringify(testResult.output.nodeResults, null, 2)}
                          </pre>
                        </details>
                      </div>
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-red-900 mb-2">错误信息：</div>
                        <div className="bg-white p-3 rounded border border-red-200 text-sm text-red-700">
                          {testResult.error}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 提示信息 */}
              {!testRunning && !testResult && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">💡 测试说明</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• 测试将模拟执行整个工作流</li>
                    <li>• 支持的节点：Set/Get Variable, If-Else, Lambda, Transform, Filter等</li>
                    <li>• 不支持的节点（如ChatModel, Tool）将返回模拟结果</li>
                    <li>• 可以在变量管理面板中预设全局变量</li>
                    <li>• 测试结果包含每个节点的执行状态和输出</li>
                  </ul>
                </div>
              )}
            </div>

            <div className="border-t px-6 py-4 flex justify-end space-x-3 bg-gray-50">
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={testRunning}
              >
                关闭
              </button>
              <button
                onClick={handleRunTest}
                disabled={testRunning}
                className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                  testRunning
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                {testRunning ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    执行中...
                  </>
                ) : (
                  <>
                    <Play size={18} className="mr-2" />
                    开始测试
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowEditor;

