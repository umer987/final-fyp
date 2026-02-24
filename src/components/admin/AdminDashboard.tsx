import React from 'react';
import { 
  Users, 
  MessageSquare, 
  Mic, 
  FileText, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Brain,
  Award,
  AlertCircle
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

export function AdminDashboard() {
  // Stats Data
  const stats = [
    {
      title: 'Total Legal Queries',
      value: '12,847',
      change: '+12.5%',
      trend: 'up',
      icon: MessageSquare,
      color: 'bg-blue-500'
    },
    {
      title: 'Voice Queries',
      value: '7,234',
      change: '+8.3%',
      trend: 'up',
      icon: Mic,
      color: 'bg-green-500'
    },
    {
      title: 'Text Queries',
      value: '5,613',
      change: '+16.2%',
      trend: 'up',
      icon: FileText,
      color: 'bg-purple-500'
    },
    {
      title: 'Active Users',
      value: '3,892',
      change: '-2.1%',
      trend: 'down',
      icon: Users,
      color: 'bg-orange-500'
    }
  ];

  // Voice vs Text Data
  const voiceTextData = [
    { name: 'Mon', voice: 850, text: 620 },
    { name: 'Tue', voice: 920, text: 680 },
    { name: 'Wed', voice: 1050, text: 720 },
    { name: 'Thu', voice: 980, text: 790 },
    { name: 'Fri', voice: 1150, text: 850 },
    { name: 'Sat', voice: 890, text: 680 },
    { name: 'Sun', voice: 760, text: 590 }
  ];

  // Most Asked Legal Topics
  const topicsData = [
    { name: 'Family Law', value: 2847, color: '#1FAA59' },
    { name: 'Property Law', value: 2234, color: '#C5A253' },
    { name: 'Criminal Law', value: 1876, color: '#0B3D2E' },
    { name: 'Business Law', value: 1456, color: '#60A5FA' },
    { name: 'Other', value: 1234, color: '#A78BFA' }
  ];

  // AI Performance Trend
  const aiPerformanceData = [
    { month: 'Jan', confidence: 82, accuracy: 78 },
    { month: 'Feb', confidence: 85, accuracy: 82 },
    { month: 'Mar', confidence: 88, accuracy: 85 },
    { month: 'Apr', confidence: 89, accuracy: 87 },
    { month: 'May', confidence: 91, accuracy: 89 },
    { month: 'Jun', confidence: 93, accuracy: 91 }
  ];

  // Recent Activities
  const recentActivities = [
    {
      id: 1,
      type: 'query',
      message: 'New legal query on inheritance law',
      time: '2 minutes ago',
      icon: MessageSquare,
      color: 'text-blue-500'
    },
    {
      id: 2,
      type: 'warning',
      message: 'Low confidence AI response flagged',
      time: '15 minutes ago',
      icon: AlertCircle,
      color: 'text-yellow-500'
    },
    {
      id: 3,
      type: 'success',
      message: 'Urdu NLP accuracy improved to 93%',
      time: '1 hour ago',
      icon: Award,
      color: 'text-green-500'
    },
    {
      id: 4,
      type: 'info',
      message: 'New legal content approved',
      time: '2 hours ago',
      icon: FileText,
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 ${stat.color} rounded-xl flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`flex items-center gap-1 text-sm ${
                  stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trend === 'up' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  {stat.change}
                </span>
              </div>
              <h3 className="text-3xl text-[#0B3D2E] mb-2">{stat.value}</h3>
              <p className="text-sm text-[#0B3D2E]/60">{stat.title}</p>
            </div>
          );
        })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Voice vs Text Usage */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl text-[#0B3D2E] mb-1">Voice vs Text Usage</h3>
              <p className="text-sm text-[#0B3D2E]/60">Weekly comparison</p>
            </div>
            <div className="w-10 h-10 bg-[#1FAA59]/10 rounded-lg flex items-center justify-center">
              <BarChart className="w-5 h-5 text-[#1FAA59]" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={voiceTextData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="name" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Bar dataKey="voice" fill="#1FAA59" name="Voice Queries" radius={[8, 8, 0, 0]} />
              <Bar dataKey="text" fill="#C5A253" name="Text Queries" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Most Asked Legal Topics */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl text-[#0B3D2E] mb-1">Most Asked Legal Topics</h3>
              <p className="text-sm text-[#0B3D2E]/60">This month</p>
            </div>
            <div className="w-10 h-10 bg-[#C5A253]/10 rounded-lg flex items-center justify-center">
              <Activity className="w-5 h-5 text-[#C5A253]" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={topicsData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {topicsData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* AI Performance Metrics */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl text-[#0B3D2E] mb-1">AI Performance Trend</h3>
              <p className="text-sm text-[#0B3D2E]/60">Confidence & Accuracy over time</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <Brain className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={aiPerformanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="month" stroke="#6B7280" style={{ fontSize: '12px' }} />
              <YAxis stroke="#6B7280" style={{ fontSize: '12px' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="confidence" 
                stroke="#1FAA59" 
                strokeWidth={3}
                name="AI Confidence %"
                dot={{ fill: '#1FAA59', r: 5 }}
              />
              <Line 
                type="monotone" 
                dataKey="accuracy" 
                stroke="#C5A253" 
                strokeWidth={3}
                name="Urdu Accuracy %"
                dot={{ fill: '#C5A253', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Key Metrics */}
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-xl text-[#0B3D2E] mb-6">Key Metrics</h3>
          <div className="space-y-4">
            <div className="p-4 bg-green-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#0B3D2E]/70">Urdu Speech Accuracy</span>
                <span className="text-lg text-green-600">93%</span>
              </div>
              <div className="w-full bg-green-200 rounded-full h-2">
                <div className="bg-green-600 h-2 rounded-full" style={{ width: '93%' }}></div>
              </div>
            </div>

            <div className="p-4 bg-blue-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#0B3D2E]/70">AI Response Confidence</span>
                <span className="text-lg text-blue-600">91%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full" style={{ width: '91%' }}></div>
              </div>
            </div>

            <div className="p-4 bg-purple-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#0B3D2E]/70">User Satisfaction</span>
                <span className="text-lg text-purple-600">88%</span>
              </div>
              <div className="w-full bg-purple-200 rounded-full h-2">
                <div className="bg-purple-600 h-2 rounded-full" style={{ width: '88%' }}></div>
              </div>
            </div>

            <div className="p-4 bg-orange-50 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-[#0B3D2E]/70">System Uptime</span>
                <span className="text-lg text-orange-600">99.8%</span>
              </div>
              <div className="w-full bg-orange-200 rounded-full h-2">
                <div className="bg-orange-600 h-2 rounded-full" style={{ width: '99.8%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-xl text-[#0B3D2E] mb-6">Recent Activities</h3>
        <div className="space-y-4">
          {recentActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <div key={activity.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center ${activity.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[#0B3D2E]">{activity.message}</p>
                  <p className="text-sm text-[#0B3D2E]/50 mt-1">{activity.time}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
