
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save } from 'lucide-react';
import { getSettings, saveSettings } from '../services/db';
import { AppSettings } from '../types';

const Settings: React.FC = () => {
  const [formData, setFormData] = useState<AppSettings>({
    companyName: '',
    companyAddress: '',
    companyMobile: '',
    billFooterNote: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setFormData(getSettings());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="text-brand-600" /> Application Settings
        </h1>
        <p className="text-gray-500 mt-1">Configure your company details for billing and prints.</p>
      </div>

      <div className="bg-white p-8 rounded-xl shadow-sm border border-brand-100">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
            <input 
              type="text" 
              required
              placeholder="e.g. AquaFlow Services" 
              className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              value={formData.companyName}
              onChange={(e) => setFormData({...formData, companyName: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Address</label>
            <textarea 
              rows={2}
              placeholder="e.g. 123 Main Market, New Delhi" 
              className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all resize-none"
              value={formData.companyAddress}
              onChange={(e) => setFormData({...formData, companyAddress: e.target.value})}
            />
          </div>

          <div>
             <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number</label>
             <input 
              type="text" 
              placeholder="e.g. +91 98765 43210" 
              className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              value={formData.companyMobile}
              onChange={(e) => setFormData({...formData, companyMobile: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill Footer Note</label>
            <input 
              type="text" 
              placeholder="e.g. Thank you for your business!" 
              className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
              value={formData.billFooterNote}
              onChange={(e) => setFormData({...formData, billFooterNote: e.target.value})}
            />
          </div>

          <div className="pt-4 flex items-center gap-4">
             <button 
              type="submit" 
              className="bg-brand-600 hover:bg-brand-700 text-white font-medium py-2.5 px-6 rounded-lg flex items-center gap-2 transition-colors shadow-md"
            >
              <Save size={18} /> Save Settings
            </button>
            {showSuccess && (
               <span className="text-green-600 font-medium animate-fade-in">Settings saved successfully!</span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default Settings;
