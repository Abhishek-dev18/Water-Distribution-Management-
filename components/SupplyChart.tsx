
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Filter, Printer, FileSpreadsheet } from 'lucide-react';
import { Customer, Transaction, CustomerStats, AppSettings } from '../types';
import { getCustomers, getTransactionsByDate, getCustomerStats, getSettings } from '../services/db';

const SupplyChart: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Record<string, Transaction>>({});
  const [filterArea, setFilterArea] = useState<string>('');
  const [stats, setStats] = useState<Record<string, CustomerStats>>({});
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'AquaFlow Services',
    companyAddress: '',
    companyMobile: '',
    billFooterNote: ''
  });

  useEffect(() => {
    // Load Settings
    setSettings(getSettings());
    
    // Load Customers
    const loadedCustomers = getCustomers();
    setCustomers(loadedCustomers);
    
    // Load Transactions for Date (Used only for balances if needed, but supply chart is usually for NEXT day manual entry)
    const txs = getTransactionsByDate(date);
    const txMap: Record<string, Transaction> = {};
    txs.forEach(t => {
      txMap[t.customerId] = t;
    });
    setTransactions(txMap);

    // Load Stats (Balances)
    const newStats: Record<string, CustomerStats> = {};
    loadedCustomers.forEach(c => {
      newStats[c.id] = getCustomerStats(c.id);
    });
    setStats(newStats);

  }, [date]);

  const areas = useMemo(() => Array.from(new Set(customers.map(c => c.area))).sort(), [customers]);

  // Auto-select first area
  useEffect(() => {
    if (areas.length > 0 && (!filterArea || !areas.includes(filterArea))) {
      setFilterArea(areas[0]);
    }
  }, [areas, filterArea]);

  const filteredCustomers = useMemo(() => {
    if (!filterArea) return [];
    return customers
      .filter(c => c.area === filterArea)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [customers, filterArea]);

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50">
      {/* Controls - Hidden on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <FileSpreadsheet className="text-brand-600" /> Supply Chart
           </h1>
           <p className="text-sm text-gray-500">Printable A4 sheet for daily delivery tracking.</p>
        </div>
       
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Date</label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <Calendar size={16} className="text-gray-400" />
              <input 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)} 
                className="border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent outline-none p-0"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Filter Area</label>
            <div className="flex items-center gap-2 border border-gray-300 rounded-lg px-3 py-2 bg-white">
              <Filter size={16} className="text-gray-400" />
              {areas.length > 0 ? (
                <select 
                  value={filterArea} 
                  onChange={(e) => setFilterArea(e.target.value)}
                  className="border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer min-w-[120px]"
                >
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              ) : (
                <span className="text-sm text-gray-400 italic px-2">No Areas</span>
              )}
            </div>
          </div>

          <button 
            onClick={() => window.print()} 
            className="px-6 py-2.5 bg-brand-600 text-white font-medium rounded-lg hover:bg-brand-700 flex items-center gap-2 shadow-sm transition-colors"
          >
            <Printer size={18}/> Print Sheet
          </button>
        </div>
      </div>

      {/* A4 Preview Container */}
      <div className="flex-1 overflow-auto flex justify-center bg-gray-100 print:bg-white print:overflow-visible">
        <div className="bg-white shadow-xl print:shadow-none w-[210mm] min-h-[297mm] p-[10mm] box-border text-black">
          
          {/* Print Header */}
          <div className="text-center mb-4 border-b-2 border-black pb-2">
             <h2 className="text-2xl font-bold uppercase tracking-wide">{settings.companyName || 'Daily Supply Sheet'}</h2>
             <div className="flex justify-between items-end mt-2 text-sm font-medium">
                <div>Area: <span className="font-bold text-lg">{filterArea || 'N/A'}</span></div>
                <div>Date: <span className="font-bold text-lg">{date}</span></div>
             </div>
          </div>

          {/* Print Table */}
          <table className="w-full border-collapse border border-black text-xs">
            <thead>
              <tr className="bg-gray-100 print:bg-transparent">
                <th className="border border-black px-1 py-2 text-left w-8">No.</th>
                <th className="border border-black px-2 py-2 text-left">Customer Name</th>
                <th className="border border-black px-2 py-2 text-left w-32">Landmark</th>
                <th className="border border-black px-1 py-2 text-center w-10">Jar<br/>IN</th>
                <th className="border border-black px-1 py-2 text-center w-10">Jar<br/>OUT</th>
                <th className="border border-black px-1 py-2 text-center w-10">Th<br/>IN</th>
                <th className="border border-black px-1 py-2 text-center w-10">Th<br/>OUT</th>
                <th className="border border-black px-1 py-2 text-center w-16">Pay</th>
                <th className="border border-black px-1 py-2 text-center w-16">Due</th>
                <th className="border border-black px-1 py-2 text-center w-12 bg-gray-50 print:bg-transparent">Jar<br/>Bal</th>
                <th className="border border-black px-1 py-2 text-center w-12 bg-gray-50 print:bg-transparent">Th<br/>Bal</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={11} className="text-center py-8 text-gray-500 italic">
                    {areas.length === 0 ? "No Areas Found" : "Select an area to view supply sheet"}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => {
                  const stat = stats[customer.id] || { currentJarBalance: 0, currentThermosBalance: 0, totalDue: 0 };
                  
                  return (
                    <tr key={customer.id} className="print:h-8">
                      <td className="border border-black px-1 py-1 text-center text-gray-600">{index + 1}</td>
                      <td className="border border-black px-2 py-1 font-semibold truncate max-w-[150px]">{customer.name}</td>
                      <td className="border border-black px-2 py-1 truncate max-w-[100px] text-[10px]">{customer.landmark}</td>
                      
                      {/* Blank Columns for Manual Entry */}
                      <td className="border border-black px-1 py-1 text-center font-medium"></td>
                      <td className="border border-black px-1 py-1 text-center font-medium"></td>
                      <td className="border border-black px-1 py-1 text-center font-medium"></td>
                      <td className="border border-black px-1 py-1 text-center font-medium"></td>
                      <td className="border border-black px-1 py-1 text-center font-medium"></td>
                      <td className="border border-black px-1 py-1 text-center font-medium"></td>
                      
                      {/* Balances - Show Current System Balance */}
                      <td className="border border-black px-1 py-1 text-center font-bold text-[10px] bg-gray-50 print:bg-transparent">
                        {stat.currentJarBalance > 0 ? stat.currentJarBalance : ''}
                      </td>
                      <td className="border border-black px-1 py-1 text-center font-bold text-[10px] bg-gray-50 print:bg-transparent">
                        {stat.currentThermosBalance > 0 ? stat.currentThermosBalance : ''}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          {/* Print Footer */}
          <div className="mt-4 pt-4 border-t border-black flex justify-between text-xs print:flex hidden">
             <div>Printed on: {new Date().toLocaleString()}</div>
             <div className="font-bold">Signature: __________________________</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChart;
