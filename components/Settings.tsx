
import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Save, Database, Trash2, Download, Upload, RefreshCw, FolderDown } from 'lucide-react';
import { getSettings, saveSettings, saveCustomersBulk, generateNextCustomerId, getCustomers, deleteCustomer, saveArea, getAreas, exportDatabase, importDatabase } from '../services/db';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData(getSettings());
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveSettings(formData);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const handleDownloadBackup = async () => {
    const jsonString = exportDatabase();
    const date = new Date().toISOString().split('T')[0];
    const fileName = `aquaflow_backup_${date}.json`;

    // Try using the Modern File System Access API (allows choosing location)
    if ('showSaveFilePicker' in window) {
      try {
        const handle = await (window as any).showSaveFilePicker({
          suggestedName: fileName,
          types: [{
            description: 'AquaFlow Database',
            accept: { 'application/json': ['.json'] },
          }],
        });
        
        const writable = await handle.createWritable();
        await writable.write(jsonString);
        await writable.close();
        
        alert("Backup saved successfully to your selected location!");
        return;
      } catch (err: any) {
        // If user cancelled the dialog, just stop.
        if (err.name === 'AbortError') return;
        console.warn("File System API failed, falling back to download.", err);
      }
    }

    // Fallback: Standard Download (for Firefox/Safari or if API fails)
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRestoreBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("WARNING: This will OVERWRITE all current data with the backup file. This action cannot be undone. Are you sure?")) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const response = importDatabase(result);
      if (response.success) {
        alert("Data restored successfully! The page will now reload.");
        window.location.reload();
      } else {
        alert("Error: " + response.message);
      }
    };
    reader.readAsText(file);
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
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
    <div className="p-6 max-w-3xl mx-auto pb-20">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="text-brand-600" /> Application Settings
        </h1>
        <p className="text-gray-500 mt-1">Configure your company details and manage data.</p>
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

        {/* Database Management */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-brand-100">
           <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
             <Database className="text-brand-600" size={20} />
             <h2 className="text-lg font-semibold text-gray-800">Database Management</h2>
           </div>
           
           <p className="text-sm text-gray-500 mb-6">
             Manage your local data. You can save a backup file to a specific location on your computer or restore from a previous file.
           </p>

           <div className="flex gap-4">
              <button 
                onClick={handleDownloadBackup}
                className="flex items-center gap-2 bg-brand-600 text-white border border-brand-600 px-5 py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors shadow-sm"
              >
                <FolderDown size={18} /> Backup & Save As...
              </button>

              <button 
                onClick={triggerFileUpload}
                className="flex items-center gap-2 bg-white text-gray-700 border border-gray-300 px-5 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Upload size={18} /> Restore Backup
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleRestoreBackup} 
                accept=".json" 
                className="hidden" 
              />
           </div>
        </div>

        {/* Developer / Testing Actions */}
        <div className="bg-gray-50 p-6 rounded-xl border border-dashed border-gray-300">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                Developer / Testing
            </h2>
            <div className="flex gap-4 flex-wrap">
                <button 
                    onClick={handleAddTestData}
                    disabled={loading}
                    className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                    {loading ? <RefreshCw className="animate-spin" size={14}/> : '+'} Add 50 Test Customers
                </button>

                <button 
                    onClick={handleClearTestData}
                    className="bg-white border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm flex items-center gap-2"
                >
                    <Trash2 size={14}/> Clear Test Data
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
