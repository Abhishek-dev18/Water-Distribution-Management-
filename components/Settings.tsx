
import React, { useState, useEffect, useRef } from 'react';
import { Settings as SettingsIcon, Save, Database, Trash2, Upload, RefreshCw, FolderDown, FolderOpen, HardDrive, ShieldCheck, Beaker, Users } from 'lucide-react';
import { getSettings, saveSettings, saveCustomersBulk, generateNextCustomerId, getCustomers, deleteCustomer, saveArea, getAreas, exportDatabase, importDatabase } from '../services/db';
import { AppSettings, Customer } from '../types';

const Settings: React.FC = () => {
  const [formData, setFormData] = useState<AppSettings>({
    companyName: '',
    companyAddress: '',
    companyMobile: '',
    billFooterNote: '',
    dataStoragePath: '',
    autoBackupPath: ''
  });
  const [showSuccess, setShowSuccess] = useState(false);
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

  const handlePickDirectory = async (type: 'data' | 'backup') => {
    try {
      if ('showDirectoryPicker' in window) {
        const handle = await (window as any).showDirectoryPicker();
        const pathLabel = handle.name || "Selected Folder";
        setFormData(prev => ({
          ...prev,
          [type === 'data' ? 'dataStoragePath' : 'autoBackupPath']: pathLabel
        }));
      } else {
        throw new Error("Not supported");
      }
    } catch (err: any) {
      console.warn("Directory picker restricted or unsupported:", err);
      alert("Browser security restricted the automatic folder picker. Please type the folder path manually in the input box.");
    }
  };

  const handleDownloadBackup = async () => {
    const jsonString = exportDatabase();
    const date = new Date().toISOString().split('T')[0];
    const fileName = `aquaflow_backup_${date}.json`;

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

    if (!confirm("WARNING: This will OVERWRITE all current data. Are you sure?")) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      const response = importDatabase(result);
      if (response.success) {
        alert("Data restored successfully! Reloading...");
        window.location.reload();
      } else {
        alert("Error: " + response.message);
      }
    };
    reader.readAsText(file);
  };

  const handleAddTestUsers = () => {
    const areas = getAreas();
    if (areas.length === 0) {
      alert("Please add at least one Area first!");
      return;
    }

    const testCustomers: Customer[] = [];
    const today = new Date().toISOString().split('T')[0];
    
    for (let i = 1; i <= 20; i++) {
      const area = areas[Math.floor(Math.random() * areas.length)].name;
      const id = generateNextCustomerId(today);
      const names = ["Rajesh Kumar", "Amit Sharma", "Suresh Gupta", "Priya Singh", "Anjali Verma", "Vikram Rathore", "Sunil Yadav", "Deepak Maurya", "Meena Devi", "Kavita Jha"];
      const hindiNames = ["राजेश कुमार", "अमित शर्मा", "सुरेश गुप्ता", "प्रिया सिंह", "अंजलि वर्मा", "विक्रम राठौर", "सुनील यादव", "दीपक मौर्य", "मीना देवी", "कविता झा"];
      
      const nameIdx = Math.floor(Math.random() * names.length);

      const newCust: Customer = {
        id: `${id.substring(0, 6)}${String(i).padStart(4, '0')}`, // Mocking sequence for bulk
        name: `${names[nameIdx]} ${i}`,
        nameHindi: `${hindiNames[nameIdx]} ${i}`,
        area: area,
        address: `${i * 101}, Main Street, Sector ${Math.floor(Math.random() * 50)}`,
        landmark: `Near ${['Water Tank', 'Temple', 'Park', 'Market', 'School'][Math.floor(Math.random() * 5)]}`,
        mobile: `98${Math.floor(10000000 + Math.random() * 90000000)}`,
        rateJar: 20,
        rateThermos: 10,
        securityDeposit: 500,
        startDate: today
      };
      testCustomers.push(newCust);
    }

    saveCustomersBulk(testCustomers);
    alert("20 Test Customers added successfully!");
    window.location.reload();
  };

  return (
    <div className="p-6 max-w-3xl mx-auto pb-24">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <SettingsIcon className="text-brand-600" /> Settings
        </h1>
        <p className="text-gray-500 mt-1">Configure company details and desktop storage.</p>
      </div>

      <div className="space-y-8">
        {/* General Settings */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-brand-100">
            <h2 className="text-lg font-semibold text-gray-800 mb-6 pb-2 border-b border-gray-100">Company Profile</h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Business Name</label>
                    <input 
                    type="text" required
                    className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    value={formData.companyName}
                    onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Number</label>
                    <input 
                    type="text" 
                    className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                    value={formData.companyMobile}
                    onChange={(e) => setFormData({...formData, companyMobile: e.target.value})}
                    />
                </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Office Address</label>
                  <input 
                  type="text" 
                  className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  value={formData.companyAddress}
                  onChange={(e) => setFormData({...formData, companyAddress: e.target.value})}
                  />
              </div>

              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Bill Footer Message</label>
                  <input 
                  type="text" 
                  className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-3 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                  value={formData.billFooterNote}
                  onChange={(e) => setFormData({...formData, billFooterNote: e.target.value})}
                  />
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-gray-50 mt-6">
                <p className="text-xs text-gray-400">These details appear on printed monthly bills.</p>
                <button 
                  type="submit" 
                  className="bg-brand-600 hover:bg-brand-700 text-white font-bold py-3 px-8 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-brand-100 active:scale-95"
                >
                  <Save size={18} /> Save Profile
                </button>
              </div>
            </form>
        </div>

        {/* Desktop & Storage Configuration */}
        <div className="bg-white p-8 rounded-xl shadow-sm border border-brand-100 relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <HardDrive size={120} />
           </div>
           
           <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center gap-2">
             <HardDrive className="text-brand-600" size={20} /> Desktop Storage Settings
           </h2>
           <p className="text-sm text-gray-500 mb-6 max-w-md">
             Configure local file paths for the Desktop App. Use "Browse" or type the path manually.
           </p>

           <div className="space-y-6">
              {/* Data Path */}
              <div className="space-y-2">
                 <label className="block text-sm font-bold text-gray-700">Database File Location</label>
                 <div className="flex gap-2">
                    <div className="flex-1 relative">
                       <input 
                         type="text"
                         placeholder="C:\AquaFlow\Data"
                         className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-600 font-mono outline-none focus:ring-2 focus:ring-brand-500/20"
                         value={formData.dataStoragePath || ''}
                         onChange={(e) => setFormData({...formData, dataStoragePath: e.target.value})}
                       />
                       <FolderOpen size={14} className="absolute left-3 top-4 text-gray-400 shrink-0" />
                    </div>
                    <button 
                      onClick={() => handlePickDirectory('data')}
                      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-lg flex items-center gap-2 font-medium transition-colors border border-gray-200"
                    >
                      Browse
                    </button>
                 </div>
              </div>

              {/* Backup Path */}
              <div className="space-y-2">
                 <label className="block text-sm font-bold text-gray-700">Automatic Backup Folder</label>
                 <div className="flex gap-2">
                    <div className="flex-1 relative">
                       <input 
                         type="text"
                         placeholder="D:\Backups\AquaFlow"
                         className="w-full bg-gray-50 border border-gray-200 rounded-lg pl-10 pr-4 py-3 text-sm text-gray-600 font-mono outline-none focus:ring-2 focus:ring-brand-500/20"
                         value={formData.autoBackupPath || ''}
                         onChange={(e) => setFormData({...formData, autoBackupPath: e.target.value})}
                       />
                       <ShieldCheck size={14} className="absolute left-3 top-4 text-brand-500 shrink-0" />
                    </div>
                    <button 
                       onClick={() => handlePickDirectory('backup')}
                       className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 rounded-lg flex items-center gap-2 font-medium transition-colors border border-gray-200"
                    >
                      Browse
                    </button>
                 </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                <p className="text-xs text-blue-700 leading-relaxed">
                  <strong>Developer Tip:</strong> Browser security might block the "Browse" button in some environments. You can <strong>type or paste</strong> the absolute path directly into the input fields above.
                </p>
              </div>
           </div>
        </div>

        {/* Database Actions */}
        <div className="bg-slate-800 text-white p-8 rounded-xl shadow-xl">
           <h2 className="text-lg font-semibold mb-2 flex items-center gap-2">
             <Database size={20} className="text-brand-400" /> Maintenance & Tools
           </h2>
           <p className="text-slate-400 text-sm mb-8">Export current session data or restore from a file.</p>
           
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button 
                onClick={handleDownloadBackup}
                className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-4 rounded-xl font-bold transition-all group"
              >
                <FolderDown size={22} className="text-brand-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-sm">Manual Backup</div>
                  <div className="text-[10px] text-slate-500 font-normal uppercase tracking-wider">Download .JSON</div>
                </div>
              </button>

              <button 
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 border border-white/10 px-6 py-4 rounded-xl font-bold transition-all group"
              >
                <Upload size={22} className="text-brand-400 group-hover:scale-110 transition-transform" />
                <div className="text-left">
                  <div className="text-sm">Restore Data</div>
                  <div className="text-[10px] text-slate-500 font-normal uppercase tracking-wider">Import .JSON File</div>
                </div>
              </button>
              <input type="file" ref={fileInputRef} onChange={handleRestoreBackup} accept=".json" className="hidden" />
           </div>
        </div>

        {/* Developer Tools */}
        <div className="bg-amber-50 border border-amber-200 p-8 rounded-xl">
           <h2 className="text-lg font-semibold text-amber-800 mb-2 flex items-center gap-2">
             <Beaker size={20} /> Developer Tools
           </h2>
           <p className="text-amber-700 text-sm mb-6">Use these tools for testing the application with sample data.</p>
           
           <button 
             onClick={handleAddTestUsers}
             className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-xl flex items-center gap-2 transition-all shadow-md active:scale-95"
           >
             <Users size={18} /> Populate 20 Test Customers
           </button>
           <p className="text-[10px] text-amber-600 mt-2 italic font-medium">Note: Requires at least one Area to be created first.</p>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-300 z-50">
          <ShieldCheck size={20} />
          <span className="font-bold">Settings Updated Successfully!</span>
        </div>
      )}
    </div>
  );
};

export default Settings;
