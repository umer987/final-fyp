import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Globe, 
  Shield, 
  Bell, 
  Database, 
  Mail, 
  Lock,
  Save,
  RefreshCw,
  AlertCircle,
  Check
} from 'lucide-react';

interface SystemSettingsData {
  siteName: string;
  siteNameUrdu: string;
  maintenanceMode: boolean;
  allowRegistration: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  sessionTimeout: number;
  maxLoginAttempts: number;
  backupFrequency: string;
  adminEmail: string;
  supportEmail: string;
  aiConfidenceThreshold: number;
  urduAccuracyThreshold: number;
}

export function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsData>({
    siteName: 'Voice2Law',
    siteNameUrdu: 'وائس ٹو لاء',
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true,
    smsNotifications: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    backupFrequency: 'daily',
    adminEmail: 'admin@voice2law.com',
    supportEmail: 'support@voice2law.com',
    aiConfidenceThreshold: 85,
    urduAccuracyThreshold: 90
  });

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Load settings from localStorage on mount
  useEffect(() => {
    const storedSettings = localStorage.getItem('systemSettings');
    if (storedSettings) {
      setSettings(JSON.parse(storedSettings));
    }
  }, []);

  const handleSave = () => {
    setSaveStatus('saving');
    
    // Simulate save delay
    setTimeout(() => {
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      setSaveStatus('saved');
      
      // Reset status after 3 seconds
      setTimeout(() => {
        setSaveStatus('idle');
      }, 3000);
    }, 1000);
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      const defaultSettings: SystemSettingsData = {
        siteName: 'Voice2Law',
        siteNameUrdu: 'وائس ٹو لاء',
        maintenanceMode: false,
        allowRegistration: true,
        emailNotifications: true,
        smsNotifications: false,
        sessionTimeout: 30,
        maxLoginAttempts: 5,
        backupFrequency: 'daily',
        adminEmail: 'admin@voice2law.com',
        supportEmail: 'support@voice2law.com',
        aiConfidenceThreshold: 85,
        urduAccuracyThreshold: 90
      };
      setSettings(defaultSettings);
      localStorage.setItem('systemSettings', JSON.stringify(defaultSettings));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl text-[#0B3D2E] mb-2">System Settings</h2>
          <p className="text-[#0B3D2E]/60 urdu-text">سسٹم کی ترتیبات</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-500 hover:bg-gray-600 text-white rounded-xl transition-all duration-300 flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            <span>Reset to Default</span>
          </button>
          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving'}
            className="px-6 py-3 bg-gradient-to-r from-[#1FAA59] to-[#0B3D2E] text-white rounded-xl hover:shadow-lg transition-all duration-300 flex items-center gap-2 disabled:opacity-50"
          >
            {saveStatus === 'saving' ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saveStatus === 'saved' ? (
              <>
                <Check className="w-5 h-5" />
                <span>Saved!</span>
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* General Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#1FAA59]/10 rounded-lg flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#1FAA59]" />
          </div>
          <h3 className="text-2xl text-[#0B3D2E]">General Settings</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-2 text-[#0B3D2E]">Site Name (English)</label>
            <input
              type="text"
              value={settings.siteName}
              onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
              className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-[#0B3D2E]">Site Name (Urdu)</label>
            <input
              type="text"
              value={settings.siteNameUrdu}
              onChange={(e) => setSettings({ ...settings, siteNameUrdu: e.target.value })}
              className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all urdu-text"
            />
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => setSettings({ ...settings, maintenanceMode: e.target.checked })}
                className="w-5 h-5 accent-[#1FAA59]"
              />
              <span className="text-[#0B3D2E]">Maintenance Mode</span>
            </label>
            <p className="text-sm text-[#0B3D2E]/60 mt-2">Disable public access to the site</p>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.allowRegistration}
                onChange={(e) => setSettings({ ...settings, allowRegistration: e.target.checked })}
                className="w-5 h-5 accent-[#1FAA59]"
              />
              <span className="text-[#0B3D2E]">Allow User Registration</span>
            </label>
            <p className="text-sm text-[#0B3D2E]/60 mt-2">Enable new users to sign up</p>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
            <Bell className="w-5 h-5 text-blue-500" />
          </div>
          <h3 className="text-2xl text-[#0B3D2E]">Notification Settings</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => setSettings({ ...settings, emailNotifications: e.target.checked })}
                className="w-5 h-5 accent-[#1FAA59]"
              />
              <span className="text-[#0B3D2E]">Email Notifications</span>
            </label>
            <p className="text-sm text-[#0B3D2E]/60 mt-2">Send email alerts for important events</p>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => setSettings({ ...settings, smsNotifications: e.target.checked })}
                className="w-5 h-5 accent-[#1FAA59]"
              />
              <span className="text-[#0B3D2E]">SMS Notifications</span>
            </label>
            <p className="text-sm text-[#0B3D2E]/60 mt-2">Send SMS alerts for critical issues</p>
          </div>

          <div>
            <label className="block text-sm mb-2 text-[#0B3D2E]">Admin Email</label>
            <input
              type="email"
              value={settings.adminEmail}
              onChange={(e) => setSettings({ ...settings, adminEmail: e.target.value })}
              className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            />
          </div>

          <div>
            <label className="block text-sm mb-2 text-[#0B3D2E]">Support Email</label>
            <input
              type="email"
              value={settings.supportEmail}
              onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
              className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            />
          </div>
        </div>
      </div>

      {/* Security Settings */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-500" />
          </div>
          <h3 className="text-2xl text-[#0B3D2E]">Security Settings</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-2 text-[#0B3D2E]">Session Timeout (minutes)</label>
            <input
              type="number"
              min="5"
              max="120"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            />
            <p className="text-sm text-[#0B3D2E]/60 mt-2">Auto-logout after inactivity</p>
          </div>

          <div>
            <label className="block text-sm mb-2 text-[#0B3D2E]">Max Login Attempts</label>
            <input
              type="number"
              min="3"
              max="10"
              value={settings.maxLoginAttempts}
              onChange={(e) => setSettings({ ...settings, maxLoginAttempts: parseInt(e.target.value) })}
              className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            />
            <p className="text-sm text-[#0B3D2E]/60 mt-2">Lock account after failed attempts</p>
          </div>
        </div>
      </div>

      {/* Database & Backup */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
            <Database className="w-5 h-5 text-purple-500" />
          </div>
          <h3 className="text-2xl text-[#0B3D2E]">Database & Backup</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-2 text-[#0B3D2E]">Backup Frequency</label>
            <select
              value={settings.backupFrequency}
              onChange={(e) => setSettings({ ...settings, backupFrequency: e.target.value })}
              className="w-full px-4 py-3 bg-[#F8F9FA] rounded-xl outline-none focus:ring-2 focus:ring-[#1FAA59] transition-all"
            >
              <option value="hourly">Every Hour</option>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div className="flex items-center">
            <button className="px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-xl transition-all duration-300 flex items-center gap-2">
              <Database className="w-5 h-5" />
              <span>Create Backup Now</span>
            </button>
          </div>
        </div>
      </div>

      {/* AI Configuration */}
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-[#C5A253]/10 rounded-lg flex items-center justify-center">
            <Lock className="w-5 h-5 text-[#C5A253]" />
          </div>
          <h3 className="text-2xl text-[#0B3D2E]">AI Configuration</h3>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm mb-2 text-[#0B3D2E]">
              AI Confidence Threshold ({settings.aiConfidenceThreshold}%)
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={settings.aiConfidenceThreshold}
              onChange={(e) => setSettings({ ...settings, aiConfidenceThreshold: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1FAA59]"
            />
            <p className="text-sm text-[#0B3D2E]/60 mt-2">Minimum confidence for AI responses</p>
          </div>

          <div>
            <label className="block text-sm mb-2 text-[#0B3D2E]">
              Urdu Accuracy Threshold ({settings.urduAccuracyThreshold}%)
            </label>
            <input
              type="range"
              min="50"
              max="100"
              value={settings.urduAccuracyThreshold}
              onChange={(e) => setSettings({ ...settings, urduAccuracyThreshold: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#1FAA59]"
            />
            <p className="text-sm text-[#0B3D2E]/60 mt-2">Minimum Urdu speech recognition accuracy</p>
          </div>
        </div>
      </div>

      {/* Warning Message */}
      <div className="bg-orange-50 border-l-4 border-orange-500 p-6 rounded-xl">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-6 h-6 text-orange-600 flex-shrink-0 mt-1" />
          <div>
            <h4 className="text-lg text-[#0B3D2E] mb-2">Important Notice</h4>
            <p className="text-[#0B3D2E]/70 text-sm">
              Changing critical settings may affect system performance and user experience. Make sure to test changes in a development environment before applying them to production.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
