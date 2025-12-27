
import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Search, Download, Filter, User, Hash } from 'lucide-react';
import { Customer, Transaction, calculateDailyCost, AppSettings } from '../types';
import { getCustomers, getTransactionsByCustomerAndMonth, getCustomerStats, getSettings } from '../services/db';

const Billing: React.FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState<string>('All');
  
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [settings, setSettings] = useState<AppSettings>({
      companyName: 'AquaFlow Services',
      companyAddress: '',
      companyMobile: '',
      billFooterNote: ''
  });
  
  useEffect(() => {
    setCustomers(getCustomers());
    setSettings(getSettings());
  }, []);

  // Computed
  const billData = useMemo(() => {
    if (!selectedCustomerId || !selectedMonth) return null;
    
    const [year, month] = selectedMonth.split('-').map(Number);
    const transactions = getTransactionsByCustomerAndMonth(selectedCustomerId, year, month - 1); 
    const customer = customers.find(c => c.id === selectedCustomerId);
    
    if (!customer) return null;

    const daysInMonth = new Date(year, month, 0).getDate();
    const dailyRows = [];
    let totalAmount = 0;
    let totalPaid = 0;
    let totalJars = 0;
    let totalThermos = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const tx = transactions.find(t => t.date === dateStr);
      
      const jars = tx?.jarsDelivered || 0;
      const thermos = tx?.thermosDelivered || 0;
      const paid = tx?.paymentAmount || 0;
      
      const dailyCost = (jars * customer.rateJar) + (thermos * customer.rateThermos);
      
      totalAmount += dailyCost;
      totalPaid += paid;
      totalJars += jars;
      totalThermos += thermos;

      dailyRows.push({
        date: dateStr,
        jars,
        thermos,
        rateJ: customer.rateJar,
        rateT: customer.rateThermos,
        amount: dailyCost,
        paid: paid
      });
    }

    const monthName = new Date(year, month - 1, 1).toLocaleString('default', { month: 'long' });

    return {
      customer,
      monthName,
      rows: dailyRows,
      summary: {
        totalAmount,
        totalPaid,
        netDue: totalAmount - totalPaid,
        totalJars,
        totalThermos
      }
    };
  }, [selectedCustomerId, selectedMonth, customers]);

  const areas = useMemo(() => ['All', ...Array.from(new Set(customers.map(c => c.area)))], [customers]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
       const matchesSearch = searchTerm === '' || 
          c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          c.mobile.includes(searchTerm) ||
          c.area.toLowerCase().includes(searchTerm.toLowerCase());
       
       const matchesArea = filterArea === 'All' || c.area === filterArea;

       return matchesSearch && matchesArea;
    });
  }, [customers, searchTerm, filterArea]);

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 print:bg-white print:p-0">
      <div className="flex flex-col xl:flex-row items-start xl:items-end gap-4 mb-6 bg-white p-4 rounded-xl shadow-sm print:hidden border border-gray-100">
        <div>
           <h1 className="text-2xl font-bold text-gray-800">Billing</h1>
           <p className="text-sm text-gray-400">Generate monthly statements.</p>
        </div>
        
        <div className="flex flex-wrap gap-4 w-full xl:w-auto flex-1 justify-end items-end">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Select Month</label>
            <input 
              type="month" 
              value={selectedMonth} 
              onChange={e => setSelectedMonth(e.target.value)}
              className="border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none bg-white min-w-[140px] text-gray-700 transition-all"
            />
          </div>

          <div className="min-w-[160px]">
             <label className="block text-xs font-medium text-gray-500 mb-1">Filter by Area</label>
             <div className="relative">
                <select
                  value={filterArea}
                  onChange={e => setFilterArea(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg p-2 text-sm focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none appearance-none bg-white pl-8 text-gray-700 cursor-pointer transition-all"
                >
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
                <Filter size={14} className="absolute left-2.5 top-3 text-brand-500 pointer-events-none" />
             </div>
          </div>

          <div className="flex-1 min-w-[280px] max-w-lg">
             <label className="block text-xs font-medium text-gray-500 mb-1">Find & Select Customer</label>
             <div className="flex flex-col rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-brand-500/10 focus-within:border-brand-500 transition-all bg-white">
               <div className="relative border-b border-gray-100">
                  <input 
                    type="text" 
                    placeholder="Filter by name or mobile..." 
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full p-2 pl-9 text-sm bg-white focus:bg-white outline-none placeholder-gray-400 text-gray-700"
                  />
                  <Search size={14} className="absolute left-3 top-3 text-gray-400" />
               </div>
               
               <div className="relative">
                 <select 
                    value={selectedCustomerId}
                    onChange={e => setSelectedCustomerId(e.target.value)}
                    className="w-full p-2 pl-9 text-sm bg-white focus:bg-white outline-none appearance-none cursor-pointer text-gray-700"
                  >
                    <option value="" disabled>Select a customer...</option>
                    {filteredCustomers.length === 0 ? (
                       <option disabled>No customers found matching filter</option>
                    ) : (
                      filteredCustomers.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.name} - {c.area} ({c.id})
                        </option>
                      ))
                    )}
                  </select>
                  <User size={14} className="absolute left-3 top-3 text-brand-500 pointer-events-none" />
               </div>
             </div>
          </div>

          <div className="flex items-end h-full pb-1">
            <button 
              onClick={() => window.print()} 
              disabled={!billData}
              className="bg-brand-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-all whitespace-nowrap"
            >
              <Printer size={18} /> Print Bill
            </button>
          </div>
        </div>
      </div>

      {billData ? (
        <div className="bg-white shadow-xl p-6 mx-auto max-w-[210mm] w-full min-h-[297mm] print:shadow-none print:p-0 print:m-0 rounded-lg border border-gray-100 print:border-none box-border flex flex-col">
          {/* Bill Header */}
          <div className="text-center border-b border-brand-700 pb-2 mb-2">
            <h2 className="text-2xl font-bold uppercase tracking-wide text-brand-700">{settings.companyName}</h2>
            <div className="flex justify-center gap-4 text-gray-600 text-[10px] mt-0.5">
               {settings.companyAddress && <span>{settings.companyAddress}</span>}
               {settings.companyMobile && <span>Ph: {settings.companyMobile}</span>}
            </div>
          </div>

          {/* Customer & Period Details - Compact */}
          <div className="flex justify-between items-start mb-1 text-sm border-b border-dashed border-gray-300 pb-2">
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-gray-400 text-[9px] uppercase font-bold tracking-tighter">Billed To:</span>
                <span className="font-bold text-lg text-gray-800 leading-none">{billData.customer.name}</span>
                <span className="text-[10px] text-brand-600 bg-brand-50 px-1.5 py-0.5 rounded font-mono font-bold">#{billData.customer.id}</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-600 mt-1 font-medium">
                <span>Area: <b>{billData.customer.area}</b></span>
                {billData.customer.landmark && <span>Landmark: <b>{billData.customer.landmark}</b></span>}
                <span>Ph: <b>{billData.customer.mobile}</b></span>
              </div>
            </div>
            <div className="text-right flex flex-col items-end">
              <div className="flex flex-col items-end mb-1">
                <span className="text-gray-400 text-[9px] uppercase font-bold tracking-tighter">Month</span>
                <span className="font-bold text-base text-gray-800 leading-none uppercase">{billData.monthName} {selectedMonth}</span>
              </div>
              <div className="flex gap-1.5">
                <span className="text-[9px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 text-gray-500 whitespace-nowrap">Jar Rate: <b className="text-gray-800">₹{billData.customer.rateJar}</b></span>
                <span className="text-[9px] bg-gray-50 px-1.5 py-0.5 rounded border border-gray-100 text-gray-500 whitespace-nowrap">Thermos Rate: <b className="text-gray-800">₹{billData.customer.rateThermos}</b></span>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-visible mt-1">
            <table className="w-full text-xs border-collapse border border-gray-400">
              <thead>
                <tr className="bg-gray-100 text-gray-800 font-bold">
                  <th className="border border-gray-400 p-0.5 w-10 text-center text-[10px]">Day</th>
                  <th className="border border-gray-400 p-0.5 text-center text-[10px]">Jars</th>
                  <th className="border border-gray-400 p-0.5 text-center text-[10px]">Thermos</th>
                  <th className="border border-gray-400 p-0.5 text-right text-[10px]">Daily Amt</th>
                  <th className="border border-gray-400 p-0.5 text-right text-[10px]">Paid</th>
                </tr>
              </thead>
              <tbody>
                {billData.rows.map((row, idx) => {
                  const day = parseInt(row.date.split('-')[2]);
                  return (
                    <tr key={idx} className="text-center h-4.5">
                      <td className="border border-gray-400 p-0.5 text-gray-700 bg-gray-50 text-[10px] font-bold">{day}</td>
                      <td className="border border-gray-400 p-0.5 text-gray-800 text-[11px]">{row.jars > 0 ? row.jars : ''}</td>
                      <td className="border border-gray-400 p-0.5 text-gray-800 text-[11px]">{row.thermos > 0 ? row.thermos : ''}</td>
                      <td className="border border-gray-400 p-0.5 text-right font-medium text-gray-800 text-[11px] pr-2">{row.amount > 0 ? `₹${row.amount}` : ''}</td>
                      <td className="border border-gray-400 p-0.5 text-right text-gray-600 text-[11px] pr-2">{row.paid > 0 ? `₹${row.paid}` : ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary - No gap after table */}
          <div className="flex flex-row justify-between items-start gap-4 mt-0.5 pt-1 border-t border-brand-700">
             <div className="w-1/3 border border-gray-200 rounded p-2 bg-gray-50">
                <h4 className="text-[9px] font-bold text-gray-400 uppercase mb-1 border-b border-gray-200 pb-0.5 tracking-wider">Supply Total</h4>
                <div className="flex justify-between text-xs mb-0.5">
                  <span className="text-gray-500">Total Jars:</span>
                  <span className="font-bold text-brand-700">{billData.summary.totalJars}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Total Thermos:</span>
                  <span className="font-bold text-orange-700">{billData.summary.totalThermos}</span>
                </div>
             </div>

             <div className="flex-1 border border-gray-800 p-0 max-w-[280px]">
               <div className="bg-gray-800 text-white text-[9px] font-bold p-1 px-2 uppercase tracking-wider text-center">Payment Summary</div>
               <div className="p-2 space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-gray-600">Total Bill Amount:</span>
                    <span className="font-bold">₹{billData.summary.totalAmount}</span>
                  </div>
                  <div className="flex justify-between text-[11px] text-gray-500">
                    <span>Amount Paid:</span>
                    <span>- ₹{billData.summary.totalPaid}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-gray-200 mt-1">
                    <span className="font-bold text-gray-800">Net Payable:</span>
                    <span className="font-bold text-lg text-brand-700">₹{billData.summary.netDue}</span>
                  </div>
               </div>
            </div>
          </div>
          
          {/* Footer - Just below Net Payable */}
          <div className="mt-1 pt-1 border-t border-gray-100 text-center text-[10px] text-gray-400">
            <p className="italic">{settings.billFooterNote}</p>
            <p className="mt-0.5 text-[8px] opacity-60">Generated by {settings.companyName} | {new Date().toLocaleString()}</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-300 bg-gray-50/50 rounded-xl border-2 border-dashed border-gray-200 m-4">
          <Printer size={48} className="mb-4 opacity-50"/>
          <p className="font-medium">Select a customer to generate bill</p>
        </div>
      )}
    </div>
  );
};

export default Billing;
