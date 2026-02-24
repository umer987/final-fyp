import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  BookOpen, 
  Languages, 
  Mic, 
  Bot, 
  MessageSquare, 
  BarChart3, 
  Settings, 
  Shield,
  ChevronLeft,
  ChevronRight,
  UserPlus
} from 'lucide-react';

interface AdminSidebarProps {
  currentView: string;
  onViewChange: (view: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function AdminSidebar({ currentView, onViewChange, collapsed, onToggleCollapse }: AdminSidebarProps) {
  const menuItems = [
    {
      id: 'dashboard',
      icon: LayoutDashboard,
      label: 'Dashboard',
      labelUrdu: 'ڈیش بورڈ'
    },
    {
      id: 'knowledge-base',
      icon: BookOpen,
      label: 'Legal Knowledge Base',
      labelUrdu: 'قانونی معلومات'
    },
    {
      id: 'urdu-content',
      icon: Languages,
      label: 'Urdu Law Content',
      labelUrdu: 'اردو قانونی مواد'
    },
    {
      id: 'voice-nlp',
      icon: Mic,
      label: 'Voice & NLP Monitoring',
      labelUrdu: 'آواز کی نگرانی'
    },
    {
      id: 'ai-review',
      icon: Bot,
      label: 'AI Response Review',
      labelUrdu: 'AI جائزہ'
    },
    {
      id: 'queries-feedback',
      icon: MessageSquare,
      label: 'User Queries & Feedback',
      labelUrdu: 'صارفین کے سوالات'
    },
    {
      id: 'add-lawyer',
      icon: UserPlus,
      label: 'Add Lawyer',
      labelUrdu: 'وکیل شامل کریں'
    },
    {
      id: 'analytics',
      icon: BarChart3,
      label: 'Analytics & Reports',
      labelUrdu: 'رپورٹس'
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'System Settings',
      labelUrdu: 'سیٹنگز'
    },
    {
      id: 'logs',
      icon: Shield,
      label: 'Logs & Security',
      labelUrdu: 'سیکیورٹی'
    }
  ];

  return (
    <aside className={`fixed left-0 top-0 h-screen bg-gradient-to-b from-[#0B3D2E] to-[#1FAA59] transition-all duration-300 ${collapsed ? 'w-20' : 'w-72'} z-50`}>
      {/* Logo Section */}
      <div className="p-6 border-b border-white/10">
        <div className={`flex items-center gap-3 ${collapsed ? 'justify-center' : ''}`}>
          <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
            <Shield className="w-6 h-6 text-[#1FAA59]" />
          </div>
          {!collapsed && (
            <div>
              <h2 className="text-white text-lg">Voice2Law</h2>
              <p className="text-white/70 text-xs">Admin Panel</p>
            </div>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <nav className="p-4 space-y-2 flex-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-white text-[#0B3D2E] shadow-lg'
                  : 'text-white hover:bg-white/10'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <div className="flex-1 text-left">
                  <div className="text-sm">{item.label}</div>
                  <div className="text-xs opacity-70 urdu-text">{item.labelUrdu}</div>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={onToggleCollapse}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white hover:bg-white/10 transition-all duration-300"
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
          {!collapsed && <span className="text-sm">Collapse</span>}
        </button>
      </div>
    </aside>
  );
}