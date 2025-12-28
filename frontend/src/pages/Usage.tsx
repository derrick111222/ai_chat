import React, { useState, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageSquare, DollarSign, Zap } from 'lucide-react';
import { usageService } from '../services/usageService';
import { UsageStats, DailyUsage } from '../types';

const Usage: React.FC = () => {
  const [stats, setStats] = useState<UsageStats | null>(null);
  const [dailyUsage, setDailyUsage] = useState<DailyUsage[]>([]);
  const [agentUsage, setAgentUsage] = useState<any[]>([]);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [days]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, dailyRes, agentRes] = await Promise.all([
        usageService.getStats(),
        usageService.getDailyUsage(days),
        usageService.getByAgent(),
      ]);

      setStats(statsRes.data || null);
      setDailyUsage(dailyRes.data || []);
      setAgentUsage(agentRes.data || []);
    } catch (error) {
      console.error('加载统计数据失败:', error);
      setStats(null);
      setDailyUsage([]);
      setAgentUsage([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="loading-dots text-blue-600">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 头部 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">使用统计</h1>
          <p className="mt-2 text-gray-600">查看您的Token使用情况和成本分析</p>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总Token使用</p>
                <p className="text-2xl font-bold text-gray-900">
                  {(stats?.total_tokens || 0).toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Zap size={24} className="text-blue-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              输入: {(stats?.total_input_tokens || 0).toLocaleString()} • 
              输出: {(stats?.total_output_tokens || 0).toLocaleString()}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">总成本</p>
                <p className="text-2xl font-bold text-gray-900">
                  ${(stats?.total_cost || 0).toFixed(4)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <DollarSign size={24} className="text-green-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              平均每1K tokens: ${((stats?.total_cost || 0) / (stats?.total_tokens || 1) * 1000).toFixed(4)}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">对话数量</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.conversation_count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <MessageSquare size={24} className="text-purple-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              活跃对话
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 mb-1">消息总数</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats?.message_count || 0}
                </p>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp size={24} className="text-orange-600" />
              </div>
            </div>
            <div className="mt-4 text-xs text-gray-500">
              平均每对话: {stats?.conversation_count ? Math.round((stats?.message_count || 0) / stats.conversation_count) : 0} 条
            </div>
          </div>
        </div>

        {/* 时间范围选择 */}
        <div className="mb-6 flex justify-end">
          <div className="inline-flex rounded-lg border border-gray-300 bg-white">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-4 py-2 text-sm font-medium transition-colors ${
                  days === d
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                } ${d === 7 ? 'rounded-l-lg' : ''} ${d === 90 ? 'rounded-r-lg' : ''}`}
              >
                {d}天
              </button>
            ))}
          </div>
        </div>

        {/* 每日使用趋势 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">每日Token使用趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="input_tokens" stroke="#3b82f6" name="输入Token" />
              <Line type="monotone" dataKey="output_tokens" stroke="#10b981" name="输出Token" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 每日成本趋势 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">每日成本趋势</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dailyUsage}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="cost" fill="#8b5cf6" name="成本 ($)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 按智能体统计 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">按智能体统计</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    智能体
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    输入Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    输出Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    总Token
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    成本
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {agentUsage.map((agent, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {agent.agent_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.input_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {agent.output_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {agent.total_tokens.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${agent.estimated_cost.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Usage;

