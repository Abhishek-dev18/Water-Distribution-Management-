
import React, { useState, useMemo, useEffect } from 'react';
import { Printer, Search, Download, Filter, User } from 'lucide-react';
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
    // month variable is 1-12 from string, getTransactions expects 0-11 for month arg
    const transactions = getTransactionsByCustomerAndMonth(selectedCustomerId, year, month - 1); 
    const customer = customers.find(c => c.id === selectedCustomerId);
    
    if (!customer) return null;

    // Generate array of days in month
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
      
      // Cost calculation
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

    return {
      customer,
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

  // Unique Areas for Dropdown
  const areas = useMemo(() => ['All', ...Array.from(new Set(customers.map(c => c.area)))], [customers]);

  // Filter Customers based on Search AND Area
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
    <div className="p-6 h-full flex flex-col">
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

          {/* Area Filter */}
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

          {/* Customer Search & Selection */}
          <div className="flex-1 min-w-[280px] max-w-lg">
             <label className="block text-xs font-medium text-gray-500 mb-1">Find & Select Customer</label>
             <div className="flex flex-col rounded-lg overflow-hidden border border-gray-200 focus-within:ring-2 focus-within:ring-brand-500/10 focus-within:border-brand-500 transition-all bg-white">
               {/* Search Box */}
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
               
               {/* Dropdown */}
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
                          {c.name} {c.nameHindi ? `/ ${c.nameHindi}` : ''} - {c.area} {c.mobile ? `(${c.mobile})` : ''}
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
              <Printer size={18} /> Print
            </button>
          </div>
        </div>
      </div>

      {/* Bill Preview Area - A4 Optimized */}
      {billData ? (
        <div className="bg-white shadow-xl p-8 mx-auto max-w-[210mm] w-full min-h-[297mm] print:shadow-none print:p-0 print:m-0 rounded-lg border border-gray-100 print:border-none box-border">
          {/* Bill Header */}
          <div className="text-center border-b-2 border-brand-700 pb-4 mb-4">
            <h2 className="text-3xl font-bold uppercase tracking-wide text-brand-700">{settings.companyName}</h2>
            {settings.companyAddress && <p className="text-gray-600 text-sm mt-1">{settings.companyAddress}</p>}
            {settings.companyMobile && <p className="text-gray-600 text-sm">Ph: {settings.companyMobile}</p>}
          </div>

          <div className="flex justify-between mb-4 text-sm border-b border-dashed border-gray-300 pb-4">
            <div className="w-1/2">
              <p className="text-gray-500 text-xs uppercase mb-1">Billed To:</p>
              <p className="font-bold text-lg text-gray-800">{billData.customer.name}</p>
              {billData.customer.nameHindi && <p className="font-bold text-lg text-gray-800 font-hindi">{billData.customer.nameHindi}</p>}
              <p className="text-gray-600 mt-1">{billData.customer.area}</p>
              {billData.customer.landmark && <p className="text-gray-600 text-xs">({billData.customer.landmark})</p>}
              <p className="text-gray-600 font-medium">Ph: {billData.customer.mobile}</p>
            </div>
            <div className="w-1/2 text-right">
              <p className="text-gray-500 uppercase text-xs tracking-wider">Invoice Month</p>
              <p className="font-bold text-lg text-gray-800 mb-2">{selectedMonth}</p>
              <div className="text-xs text-gray-600">
                <span className="bg-brand-50 px-2 py-1 rounded border border-brand-100 mr-2">Jar Rate: <b>₹{billData.customer.rateJar}</b></span>
                <span className="bg-brand-50 px-2 py-1 rounded border border-brand-100">Thermos Rate: <b>₹{billData.customer.rateThermos}</b></span>
              </div>
            </div>
          </div>

          {/* Compact Table */}
          <div className="mb-4">
             <table className="w-full text-sm border-collapse border border-gray-300">
            <thead>
              <tr className="bg-brand-50 text-brand-900 font-bold">
                <th className="border border-gray-300 p-1.5 w-12 text-center text-xs">Day</th>
                <th className="border border-gray-300 p-1.5 text-center text-xs">Jars</th>
                <th className="border border-gray-300 p-1.5 text-center text-xs">Thermos</th>
                <th className="border border-gray-300 p-1.5 text-right text-xs">Daily Amt</th>
                <th className="border border-gray-300 p-1.5 text-right text-xs">Paid</th>
              </tr>
            </thead>
            <tbody>
              {billData.rows.map((row, idx) => {
                const day = parseInt(row.date.split('-')[2]);
                return (
                  <tr key={idx} className="text-center hover:bg-gray-50 print:bg-transparent">
                    <td className="border border-gray-300 p-0.5 text-gray-700 bg-gray-50/50 text-xs font-medium">{day}</td>
                    <td className="border border-gray-300 p-0.5 text-gray-800 text-xs">{row.jars > 0 ? row.jars : ''}</td>
                    <td className="border border-gray-300 p-0.5 text-gray-800 text-xs">{row.thermos > 0 ? row.thermos : ''}</td>
                    <td className="border border-gray-300 p-0.5 text-right font-medium text-gray-800 text-xs">{row.amount > 0 ? `₹${row.amount}` : ''}</td>
                    <td className="border border-gray-300 p-0.5 text-right text-gray-600 text-xs">{row.paid > 0 ? `₹${row.paid}` : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>

          {/* Total Counts & Financials */}
          <div className="flex flex-row justify-between items-start gap-4 mt-2">
             {/* Supply Summary */}
             <div className="border border-gray-200 rounded p-3 bg-brand-50/30 w-1/3">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-2 border-b border-gray-200 pb-1">Supply Total</h4>
                <div className="flex justify-between text-sm mb-1">
                  <span>Total Jars:</span>
                  <span className="font-bold text-brand-700">{billData.summary.totalJars}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Thermos:</span>
                  <span className="font-bold text-orange-700">{billData.summary.totalThermos}</span>
                </div>
             </div>

             {/* Financial Summary */}
             <div className="border border-gray-800 p-0 w-1/2">
               <div className="bg-gray-800 text-white text-xs font-bold p-1 px-2 uppercase">Payment Summary</div>
               <div className="p-3">
                  <div className="flex justify-between mb-1 text-sm">
                    <span>Total Amount:</span>
                    <span className="font-bold">₹{billData.summary.totalAmount}</span>
                  </div>
                  <div className="flex justify-between mb-2 text-sm text-gray-600 border-b border-gray-200 pb-2">
                    <span>Less Paid:</span>
                    <span>- ₹{billData.summary.totalPaid}</span>
                  </div>
                  <div className="flex justify-between pt-1 text-lg font-bold text-brand-700">
                    <span>Net Payable:</span>
                    <span>₹{billData.summary.netDue}</span>
                  </div>
               </div>
            </div>
          </div>
          
          <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-500 print:mt-auto print:mb-4">
            <p className="italic">{settings.billFooterNote}</p>
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
