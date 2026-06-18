import React from 'react';
import { Bell, User, LogOut, Activity, Shield } from 'lucide-react';

interface AdminTopBarProps {
  onLogout: () => void;
  sidebarCollapsed?: boolean;
}

export function AdminTopBar({ onLogout, sidebarCollapsed = false }: AdminTopBarProps) {
  return (
    <header className={`fixed top-0 right-0 h-16 bg-white border-b border-gray-200 z-40 transition-all duration-300 ${sidebarCollapsed ? 'left-20' : 'left-72'}`}>
      <div className="h-full px-6 flex items-center justify-between">
        {/* Page Title */}
        <div>
          <h1 className="text-xl text-[#0B3D2E]">Admin Dashboard</h1>
          <p className="text-xs text-[#0B3D2E]/60">Welcome back, Administrator</p>
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-4">
          {/* System Status */}
          <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-green-50 rounded-lg">
            <Activity className="w-4 h-4 text-green-600 animate-pulse" />
            <span className="text-sm text-green-700">System Online</span>
          </div>

          {/* Role Badge */}
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-[#C5A253]/10 rounded-lg">
            <Shield className="w-4 h-4 text-[#C5A253]" />
            <span className="text-sm text-[#0B3D2E]">Super Admin</span>
          </div>

          {/* Notifications */}
          <button className="relative w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors">
            <Bell className="w-5 h-5 text-[#0B3D2E]" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
              3
            </span>
          </button>

          {/* Admin Profile */}
          <div className="flex items-center gap-3 px-4 py-2 bg-gray-100 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#0B3D2E] to-[#1FAA59] flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="hidden md:block">
              <p className="text-sm text-[#0B3D2E]">Admin User</p>
              <p className="text-xs text-[#0B3D2E]/60">admin@voice2law.com</p>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline text-sm">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}