import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, MapPin, Phone, Package, AlertCircle } from 'lucide-react';
import { Customer, Area } from '../types';
import { getCustomers, saveCustomer, deleteCustomer, getCustomerStats, getAreas } from '../services/db';

const CustomerManager: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Customer>>({
    name: '', area: '', landmark: '', mobile: '', rateJar: 20, rateThermos: 10, securityDeposit: 0, startDate: new Date().toISOString().split('T')[0]
  });

  const [stats, setStats] = useState<Record<string, any>>({});

  const loadData = () => {
    const data = getCustomers();
    const areaData = getAreas();
    setCustomers(data);
    setAreas(areaData);

    // Load stats for all
    const newStats: Record<string, any> = {};
    data.forEach(c => {
      newStats[c.id] = getCustomerStats(c.id);
    });
    setStats(newStats);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = editingId ? { ...formData, id: editingId } : formData;
    
    // Safety check for empty area
    if (!payload.area) {
      alert("Please select an Area.");
      return;
    }

    saveCustomer(payload as Customer);
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ name: '', area: '', landmark: '', mobile: '', rateJar: 20, rateThermos: 10, securityDeposit: 0, startDate: new Date().toISOString().split('T')[0] });
    loadData();
  };

  const handleEdit = (c: Customer) => {
    setFormData(c);
    setEditingId(c.id);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure? This will hide the customer but keep history.')) {
      deleteCustomer(id);
      loadData();
    }
  };

  const openNewModal = () => {
    setEditingId(null);
    setFormData(prev => ({ 
      ...prev, 
      name: '', landmark: '', mobile: '', 
      // Reset area or default to first
      area: areas.length > 0 ? areas[0].name : '',
      rateJar: 20, rateThermos: 10, securityDeposit: 0 
    }));
    setIsModalOpen(true);
  }

  // Group by Area
  const groupedCustomers = customers.reduce((acc, curr) => {
    const area = curr.area || 'Unassigned';
    if (!acc[area]) acc[area] = [];
    acc[area].push(curr);
    return acc;
  }, {} as Record<string, Customer[]>);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Customer Management</h1>
        <button 
          onClick={openNewModal}
          className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
        >
          <Plus size={20} /> Add Customer
        </button>
      </div>
      
      {customers.length === 0 && (
         <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300 mb-6">
            <div className="mx-auto w-12 h-12 bg-brand-50 rounded-full flex items-center justify-center text-brand-500 mb-3">
              <Package size={24} />
            </div>
            <p className="text-gray-500">No customers found.</p>
            {areas.length === 0 && (
              <p className="text-sm text-red-500 mt-2 font-medium">Please add Areas in the "Areas" section first.</p>
            )}
         </div>
      )}

      {Object.entries(groupedCustomers).map(([area, areaCustomers]: [string, Customer[]]) => (
        <div key={area} className="mb-8">
          <h2 className="text-lg font-bold text-brand-700 mb-3 border-b border-brand-100 pb-2 flex items-center gap-2">
            <MapPin size={18} className="text-brand-500" /> {area}
            <span className="text-xs font-normal text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{areaCustomers.length}</span>
          </h2>
          <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
            <table className="min-w-full divide-y divide-gray-100">
              <thead className="bg-brand-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">Name / Mobile</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">Landmark</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">Rates</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">Deposit</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-brand-800 uppercase tracking-wider">Balances</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-brand-800 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {areaCustomers.map(customer => {
                  const s = stats[customer.id] || { currentJarBalance: 0, currentThermosBalance: 0, totalDue: 0 };
                  return (
                    <tr key={customer.id} className="hover:bg-brand-50/30 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-gray-800">{customer.name}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1"><Phone size={12}/> {customer.mobile}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{customer.landmark}</td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        <div className="flex gap-2"><span className="text-gray-400 text-xs w-12">Jar:</span> ₹{customer.rateJar}</div>
                        <div className="flex gap-2"><span className="text-gray-400 text-xs w-12">Thermos:</span> ₹{customer.rateThermos}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">₹{customer.securityDeposit}</td>
                      <td className="px-6 py-4 text-sm">
                         <div className="flex flex-col gap-1">
                           <span className={s.currentJarBalance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                             Jar: {s.currentJarBalance}
                           </span>
                           <span className={s.currentThermosBalance > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                             Thermos: {s.currentThermosBalance}
                           </span>
                           <span className={s.totalDue > 0 ? 'text-red-600 font-bold bg-red-50 px-2 py-0.5 rounded w-fit' : 'text-gray-600'}>
                             Due: ₹{s.totalDue}
                           </span>
                         </div>
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button onClick={() => handleEdit(customer)} className="text-brand-600 hover:text-brand-800 mr-3 p-1 hover:bg-brand-50 rounded"><Edit2 size={16}/></button>
                        <button onClick={() => handleDelete(customer.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-lg border-t-8 border-brand-500 animate-in fade-in zoom-in duration-200">
            <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center gap-2">
              {editingId ? <Edit2 size={24} className="text-brand-500"/> : <Plus size={24} className="text-brand-500"/>}
              {editingId ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
                  <input required type="text" 
                    className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder-gray-300" 
                    placeholder="Enter full name"
                    value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Mobile</label>
                  <input required type="text" 
                    className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder-gray-300" 
                    placeholder="10 digit number"
                    value={formData.mobile} onChange={e => setFormData({...formData, mobile: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Area</label>
                  {areas.length > 0 ? (
                    <select 
                      required 
                      className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all"
                      value={formData.area} 
                      onChange={e => setFormData({...formData, area: e.target.value})}
                    >
                      <option value="" disabled>Select Area</option>
                      {areas.map(a => <option key={a.id} value={a.name}>{a.name}</option>)}
                    </select>
                  ) : (
                    <div className="text-sm text-red-500 border border-red-200 bg-red-50 p-2.5 rounded-lg flex items-center gap-2">
                      <AlertCircle size={16}/> No Areas found.
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Landmark</label>
                  <input type="text" 
                    className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all placeholder-gray-300" 
                    placeholder="Nearby..."
                    value={formData.landmark} onChange={e => setFormData({...formData, landmark: e.target.value})} />
                </div>
              </div>

              {/* Rates & Security Section - Clean White Look */}
              <div className="bg-white p-5 rounded-xl border border-brand-100 shadow-sm relative">
                <div className="absolute -top-3 left-3 bg-white px-2 text-xs font-bold text-brand-600 uppercase tracking-wider">Pricing & Security</div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Jar Rate</label>
                    <div className="relative group">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-xs">₹</span>
                      <input type="number" 
                        className="pl-6 w-full rounded-lg border-gray-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-gray-700" 
                        value={formData.rateJar} onChange={e => setFormData({...formData, rateJar: Number(e.target.value)})} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Thermos Rate</label>
                    <div className="relative group">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-xs">₹</span>
                      <input type="number" 
                        className="pl-6 w-full rounded-lg border-gray-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-gray-700" 
                        value={formData.rateThermos} onChange={e => setFormData({...formData, rateThermos: Number(e.target.value)})} />
                    </div>
                  </div>
                   <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Security</label>
                    <div className="relative group">
                      <span className="absolute left-3 top-2.5 text-gray-400 text-xs">₹</span>
                      <input type="number" 
                        className="pl-6 w-full rounded-lg border-gray-200 bg-white border p-2 text-sm focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all font-medium text-gray-700" 
                        value={formData.securityDeposit} onChange={e => setFormData({...formData, securityDeposit: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <input type="date" 
                    className="w-full rounded-lg border-gray-300 bg-white shadow-sm border p-2.5 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition-all text-gray-600" 
                    value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} />
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-gray-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors font-medium">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 shadow-lg shadow-brand-200 transition-all transform active:scale-95 font-medium">Save Customer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManager;