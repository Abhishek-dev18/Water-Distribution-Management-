
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
    setSettings(getSettings());
    const loadedCustomers = getCustomers();
    setCustomers(loadedCustomers);
    
    const txs = getTransactionsByDate(date);
    const txMap: Record<string, Transaction> = {};
    txs.forEach(t => {
      txMap[t.customerId] = t;
    });
    setTransactions(txMap);

    const newStats: Record<string, CustomerStats> = {};
    loadedCustomers.forEach(c => {
      newStats[c.id] = getCustomerStats(c.id);
    });
    setStats(newStats);
  }, [date]);

  const areas = useMemo(() => Array.from(new Set(customers.map(c => c.area))).sort(), [customers]);

  useEffect(() => {
    if (areas.length > 0 && (!filterArea || !areas.includes(filterArea))) {
      setFilterArea(areas[0]);
    }
  }, [areas, filterArea]);

  const filteredCustomers = useMemo(() => {
    if (!filterArea) return [];
    return customers.filter(c => c.area === filterArea);
  }, [customers, filterArea]);

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 print:bg-white print:p-0 print:block">
      {/* Controls - Hidden on Print */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 print:hidden bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div>
           <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
             <FileSpreadsheet className="text-brand-600" /> Supply Chart
           </h1>
           <p className="text-sm text-gray-500">Printable sheet for daily tracking (35+ rows/page).</p>
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

      {/* Sheet Container */}
      <div className="flex-1 overflow-auto bg-gray-100 print:bg-white print:overflow-visible print:block">
        <div className="bg-white shadow-xl print:shadow-none w-full max-w-[210mm] mx-auto p-6 md:p-[10mm] box-border text-black min-h-full print:p-0 print:max-w-none print:w-full print:block">
          
          {/* Redesigned Print Header - Compact */}
          <div className="print:block mb-1">
             <h2 className="text-xl font-bold uppercase tracking-tight text-center">{settings.companyName || 'AquaFlow Services'}</h2>
             <div className="flex justify-between items-baseline border-b-2 border-black pb-1 px-1">
                <div className="text-[13px] font-bold">Area: <span className="text-base ml-1">{filterArea || 'N/A'}</span></div>
                <div className="text-[13px] font-bold">Date: <span className="text-base ml-1">{date}</span></div>
             </div>
          </div>

          {/* Print Table - Increased Font Sizes */}
          <table className="w-full border-collapse border border-black text-[13px] print:text-[13px] print:table">
            <thead className="print:table-header-group">
              <tr className="bg-gray-100 print:bg-gray-100">
                <th className="border border-black px-1 py-1.5 text-left w-[30px] font-bold">No.</th>
                <th className="border border-black px-2 py-1.5 text-left w-[150px] font-bold">Customer Name</th>
                <th className="border border-black px-2 py-1.5 text-left w-[110px] font-bold">Landmark</th>
                <th className="border border-black px-2 py-1.5 text-left w-[95px] font-bold">Phone</th>
                <th className="border border-black px-0.5 py-1 text-center w-8 font-bold">Jar<br/>IN</th>
                <th className="border border-black px-0.5 py-1 text-center w-8 font-bold">Jar<br/>OUT</th>
                <th className="border border-black px-0.5 py-1 text-center w-8 font-bold">Th<br/>IN</th>
                <th className="border border-black px-0.5 py-1 text-center w-8 font-bold">Th<br/>OUT</th>
                <th className="border border-black px-1 py-1 text-center w-10 font-bold">Pay</th>
                <th className="border border-black px-1 py-1 text-center w-10 font-bold">Due</th>
                <th className="border border-black px-0.5 py-1 text-center w-9 bg-gray-50 print:bg-gray-50 font-bold">Jar<br/>Bal</th>
                <th className="border border-black px-0.5 py-1 text-center w-9 bg-gray-50 print:bg-gray-50 font-bold">Th<br/>Bal</th>
              </tr>
            </thead>
            <tbody className="print:table-row-group">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={12} className="text-center py-8 text-gray-500 italic border border-black">
                    {areas.length === 0 ? "No Areas Found" : "Select an area to view supply sheet"}
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((customer, index) => {
                  const stat = stats[customer.id] || { currentJarBalance: 0, currentThermosBalance: 0, totalDue: 0 };
                  
                  return (
                    <tr key={customer.id} className="h-7 print:h-[7.5mm] break-inside-avoid print:break-inside-avoid">
                      <td className="border border-black px-1 py-0 text-center text-gray-500 font-medium">{index + 1}</td>
                      <td className="border border-black px-2 py-0">
                        <div className="font-bold truncate max-w-[145px] font-hindi leading-tight">{customer.nameHindi || customer.name}</div>
                      </td>
                      <td className="border border-black px-2 py-0 truncate max-w-[105px] text-[11px] leading-tight font-medium text-gray-600">{customer.landmark}</td>
                      <td className="border border-black px-2 py-0 text-[11px] font-bold font-mono text-gray-700">{customer.mobile}</td>
                      
                      <td className="border border-black px-1 py-0 text-center"></td>
                      <td className="border border-black px-1 py-0 text-center"></td>
                      <td className="border border-black px-1 py-0 text-center"></td>
                      <td className="border border-black px-1 py-0 text-center"></td>
                      <td className="border border-black px-1 py-0 text-center"></td>
                      <td className="border border-black px-1 py-0 text-center"></td>
                      
                      <td className="border border-black px-1 py-0 text-center font-bold bg-gray-50/30 print:bg-transparent">
                        {stat.currentJarBalance > 0 ? stat.currentJarBalance : ''}
                      </td>
                      <td className="border border-black px-1 py-0 text-center font-bold bg-gray-50/30 print:bg-transparent">
                        {stat.currentThermosBalance > 0 ? stat.currentThermosBalance : ''}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          
          <div className="mt-4 pt-4 border-t border-black flex justify-between text-[11px] print:flex hidden font-bold">
             <div>Printed: {new Date().toLocaleString()} | Area: {filterArea}</div>
             <div>Authorized Signature: __________________________</div>
          </div>
        </div>
      </div>
      <style>{`
        @media print {
          body { 
            overflow: visible !important; 
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          #root { height: auto !important; overflow: visible !important; }
          .print\\:block { display: block !important; }
          .print\\:hidden { display: none !important; }
          @page { 
            size: A4;
            margin: 10mm 5mm 10mm 5mm; 
          }
          /* Ensure layout doesn't break table pagination */
          .flex, .flex-col { display: block !important; }
          
          table { 
            width: 100% !important; 
            border-collapse: collapse !important; 
            table-layout: fixed !important;
            page-break-inside: auto !important;
          }
          thead { display: table-header-group !important; }
          tbody { display: table-row-group !important; }
          tr { 
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
        }
      `}</style>
    </div>
  );
};

export default SupplyChart;
