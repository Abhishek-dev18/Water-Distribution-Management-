
import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Save, Database, Trash2 } from 'lucide-react';
import { getSettings, saveSettings, saveCustomersBulk, generateNextCustomerId, getCustomers, deleteCustomer, saveArea, getAreas } from '../services/db';
import { AppSettings, Customer } from '../types';

const Settings: React.FC = () => {
  const [formData, setFormData] = useState<AppSettings>({
    companyName: '',
    companyAddress: '',
    companyMobile: '',
    billFooterNote: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFormData(getSettings());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleAddTestData = async () => {
    if (!confirm("This will add 50 'Test Customer' entries to your database. Continue?")) return;
    
    setLoading(true);
    
    try {
        // 1. Ensure Areas exist
        const areas = getAreas();
        let areaNames = areas.map(a => a.name);
        
        if (areaNames.length === 0) {
            saveArea({ name: 'Test Area A' });
            saveArea({ name: 'Test Area B' });
            // Refresh areas after saving
            const updatedAreas = getAreas();
            areaNames = updatedAreas.map(a => a.name);
            // Fallback if saveArea failed for some reason, though it shouldn't
            if (areaNames.length === 0) areaNames = ['Test Area A', 'Test Area B'];
        }

        const today = new Date().toISOString().split('T')[0];
        
        // 2. Determine Starting Sequence for IDs
        // Get the next ID from DB (e.g. 2025020001)
        const nextIdStr = generateNextCustomerId(today);
        const prefix = nextIdStr.substring(0, 6); // YYYYMM
        let startSeq = parseInt(nextIdStr.substring(6), 10); // 0001 -> 1
        
        if (isNaN(startSeq)) startSeq = 1;

        // 3. Generate 50 Customers in Memory
        const batch: Customer[] = [];
        
        for (let i = 0; i < 50; i++) {
            const currentSeq = startSeq + i;
            const newId = `${prefix}${String(currentSeq).padStart(4, '0')}`;
            const area = areaNames[i % areaNames.length];
            const num = i + 1;

            batch.push({
                id: newId,
                name: `Test Customer ${num}`,
                nameHindi: `टेस्ट ग्राहक ${num}`,
                area: area,
                address: `House No ${num}, Test Street`,
                landmark: `Landmark ${num}`,
                mobile: `99999${String(num).padStart(5, '0')}`,
                rateJar: 20,
                rateThermos: 10,
                securityDeposit: 500,
                startDate: today
            });
        }

        // 4. Bulk Save
        // We use a small timeout to let the UI update 'Loading...' state first
        setTimeout(() => {
            saveCustomersBulk(batch);
            setLoading(false);
            alert(`Success! ${batch.length} Test Customers added.`);
        }, 100);

    } catch (err) {
        console.error("Error generating data:", err);
        setLoading(false);
        alert("Failed to generate data. Check console for errors.");
    }
  };

  const handleClearTestData = () => {
      if (!confirm("Are you sure? This will delete all customers with name starting with 'Test Customer'.")) return;
      
      const all = getCustomers();
      const testCustomers = all.filter(c => c.name.startsWith("Test Customer"));
      
      if (testCustomers.length === 0) {
          alert("No test customers found.");
          return;
      }

      // Delete one by one (or we could add bulk delete, but this is fine for cleanup)
      testCustomers.forEach(c => deleteCustomer(c.id));
      alert(`Deleted ${testCustomers.length} test customers.`);
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="text-brand-600" /> Application Settings
        </h1>
        <p className="text-gray-500 mt-1">Configure your company details for billing and prints.</p>
      </div>

      <div className="space-y-8">
        {/* General Settings */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-brand-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b border-gray-100">General Information</h2>
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

        {/* Developer / Testing Actions */}
        <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
            <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4 flex items-center gap-2">
                <Database size={16}/> Developer / Testing Actions
            </h2>
            <div className="flex gap-4 flex-wrap">
                <button 
                    onClick={handleAddTestData}
                    disabled={loading}
                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
                >
                    {loading ? 'Generating...' : '+ Add 50 Test Customers'}
                </button>

                <button 
                    onClick={handleClearTestData}
                    className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                    <Trash2 size={14}/> Clear Test Data
                </button>
            </div>
            <p className="text-xs text-gray-400 mt-2">
                These actions help you test the Supply Chart and Pagination. "Add 50" creates customers named "Test Customer X". "Clear" removes them.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Settings;
