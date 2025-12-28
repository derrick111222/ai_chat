import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Send, Plus, Trash2, Bot, User as UserIcon } from 'lucide-react';
import { conversationService } from '../services/conversationService';
import { agentService } from '../services/agentService';
import { Conversation, Message, Agent } from '../types';

const Chat: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 加载对话列表
  useEffect(() => {
    loadConversations();
    loadAgents();
  }, []);

  // 加载当前对话的消息
  useEffect(() => {
    if (conversationId) {
      loadConversation(parseInt(conversationId));
      loadMessages(parseInt(conversationId));
    }
  }, [conversationId]);

  // 自动滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadConversations = async () => {
    try {
      const response = await conversationService.getConversations('active');
      setConversations(response.data || []);
    } catch (error) {
      console.error('加载对话列表失败:', error);
      setConversations([]);
    }
  };

  const loadAgents = async () => {
    try {
      const response = await agentService.getAgents();
      const agentList = response.data || [];
      setAgents(agentList);
      if (agentList.length > 0 && !selectedAgentId) {
        setSelectedAgentId(agentList[0].id);
      }
    } catch (error) {
      console.error('加载智能体列表失败:', error);
      setAgents([]);
    }
  };

  const loadConversation = async (id: number) => {
    try {
      const response = await conversationService.getConversation(id);
      setCurrentConversation(response.data);
    } catch (error) {
      console.error('加载对话失败:', error);
    }
  };

  const loadMessages = async (id: number) => {
    try {
      const response = await conversationService.getMessages(id);
      setMessages(response.data || []);
    } catch (error) {
      console.error('加载消息失败:', error);
      setMessages([]);
    }
  };

  const handleNewChat = async () => {
    if (!selectedAgentId) {
      alert('请选择一个智能体');
      return;
    }

    try {
      const response = await conversationService.createConversation({
        agent_id: selectedAgentId,
        title: '新对话',
      });
      setShowNewChatModal(false);
      navigate(`/chat/${response.data.id}`);
      loadConversations();
    } catch (error) {
      console.error('创建对话失败:', error);
      alert('创建对话失败');
    }
  };

  const handleDeleteConversation = async (id: number) => {
    if (!window.confirm('确定要删除这个对话吗？')) {
      return;
    }

    try {
      await conversationService.deleteConversation(id);
      loadConversations();
      if (conversationId && parseInt(conversationId) === id) {
        navigate('/chat');
        setCurrentConversation(null);
        setMessages([]);
      }
    } catch (error) {
      console.error('删除对话失败:', error);
      alert('删除对话失败');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !conversationId || loading) {
      return;
    }

    const userMessage = input.trim();
    setInput('');
    setLoading(true);

    // 立即显示用户消息
    const tempUserMessage: Message = {
      id: Date.now(),
      conversation_id: parseInt(conversationId),
      role: 'user',
      content: userMessage,
      attachments: [],
      input_tokens: 0,
      output_tokens: 0,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const response = await conversationService.sendMessage(parseInt(conversationId), userMessage);
      
      // 更新消息列表
      setMessages((prev) => {
        const filtered = prev.filter((m) => m.id !== tempUserMessage.id);
        return [
          ...filtered,
          response.data.user_message,
          response.data.assistant_message,
        ];
      });

      // 更新对话标题（如果是第一条消息）
      if (messages.length === 0 && currentConversation) {
        const title = userMessage.slice(0, 30) + (userMessage.length > 30 ? '...' : '');
        await conversationService.updateConversation(parseInt(conversationId), { title });
        loadConversations();
      }
    } catch (error: any) {
      console.error('发送消息失败:', error);
      alert('发送消息失败: ' + (error.message || '未知错误'));
      // 移除临时消息
      setMessages((prev) => prev.filter((m) => m.id !== tempUserMessage.id));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* 对话列表侧边栏 */}
      <div className="w-64 bg-white border-r flex flex-col">
        <div className="p-4 border-b">
          <button
            onClick={() => setShowNewChatModal(true)}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} className="mr-2" />
            新建对话
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                conversationId && parseInt(conversationId) === conv.id ? 'bg-blue-50' : ''
              }`}
              onClick={() => navigate(`/chat/${conv.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{conv.title}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {conv.agent?.name || '未知智能体'}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(conv.updated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteConversation(conv.id);
                  }}
                  className="ml-2 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 聊天主区域 */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {currentConversation ? (
          <>
            {/* 聊天头部 */}
            <div className="bg-white border-b px-6 py-4">
              <h2 className="text-lg font-semibold text-gray-900">{currentConversation.title}</h2>
              <p className="text-sm text-gray-500">
                {currentConversation.agent?.name} • {messages.length} 条消息 • {currentConversation.total_tokens} tokens
              </p>
            </div>

            {/* 消息列表 */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`mb-6 flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex max-w-3xl ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div
                      className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.role === 'user' ? 'bg-blue-600 ml-3' : 'bg-gray-600 mr-3'
                      }`}
                    >
                      {message.role === 'user' ? (
                        <UserIcon size={16} className="text-white" />
                      ) : (
                        <Bot size={16} className="text-white" />
                      )}
                    </div>
                    <div
                      className={`px-4 py-3 rounded-lg ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-900 border border-gray-200'
                      }`}
                    >
                      <div className="markdown-body">
                        <ReactMarkdown>{message.content}</ReactMarkdown>
                      </div>
                      {message.role === 'assistant' && (
                        <div className="mt-2 text-xs text-gray-400">
                          {message.input_tokens + message.output_tokens} tokens
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="mb-6 flex justify-start">
                  <div className="flex max-w-3xl">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-600 mr-3">
                      <Bot size={16} className="text-white" />
                    </div>
                    <div className="px-4 py-3 rounded-lg bg-white border border-gray-200">
                      <div className="loading-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 输入框 */}
            <div className="bg-white border-t px-6 py-4">
              <form onSubmit={handleSendMessage} className="flex items-end space-x-4">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  placeholder="输入消息... (Shift+Enter 换行)"
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  rows={3}
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Bot size={64} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">开始新对话</h3>
              <p className="text-gray-500 mb-6">选择一个对话或创建新对话</p>
              <button
                onClick={() => setShowNewChatModal(true)}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建新对话
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 新建对话模态框 */}
      {showNewChatModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">创建新对话</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                选择智能体
              </label>
              <select
                value={selectedAgentId || ''}
                onChange={(e) => setSelectedAgentId(parseInt(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleNewChat}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;

