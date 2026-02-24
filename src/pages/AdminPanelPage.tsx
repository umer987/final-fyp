import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../contexts/AuthContext';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopBar } from '../components/admin/AdminTopBar';
import { AdminDashboard } from '../components/admin/AdminDashboard';
import { LegalKnowledgeBase } from '../components/admin/LegalKnowledgeBase';
import { AIMonitoring } from '../components/admin/AIMonitoring';
import { UrduContentManagement } from '../components/admin/UrduContentManagement';
import { UserQueriesFeedback } from '../components/admin/UserQueriesFeedback';
import { AddLawyer } from '../components/admin/AddLawyer';

export function AdminPanelPage() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/admin-login', { replace: true });
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'knowledge-base':
        return <LegalKnowledgeBase />;
      case 'urdu-content':
        return <UrduContentManagement />;
      case 'voice-nlp':
        return <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <h3 className="text-2xl text-[#0B3D2E] mb-4">Voice & NLP Monitoring</h3>
          <p className="text-[#0B3D2E]/60">Under Development</p>
        </div>;
      case 'ai-review':
        return <AIMonitoring />;
      case 'queries-feedback':
        return <UserQueriesFeedback />;
      case 'add-lawyer':
        return <AddLawyer />;
      case 'analytics':
        return <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <h3 className="text-2xl text-[#0B3D2E] mb-4">Analytics & Reports</h3>
          <p className="text-[#0B3D2E]/60">Under Development</p>
        </div>;
      case 'settings':
        return <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <h3 className="text-2xl text-[#0B3D2E] mb-4">System Settings</h3>
          <p className="text-[#0B3D2E]/60">Under Development</p>
        </div>;
      case 'logs':
        return <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
          <h3 className="text-2xl text-[#0B3D2E] mb-4">Logs & Security</h3>
          <p className="text-[#0B3D2E]/60">Under Development</p>
        </div>;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#E8F5ED] to-white">
      {/* Sidebar */}
      <AdminSidebar 
        currentView={currentView}
        onViewChange={setCurrentView}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ${sidebarCollapsed ? 'ml-20' : 'ml-72'}`}>
        {/* Top Bar */}
        <AdminTopBar onLogout={handleLogout} sidebarCollapsed={sidebarCollapsed} />

        {/* Content */}
        <main className="pt-20 p-8">
          {renderView()}
        </main>
      </div>
    </div>
  );
}