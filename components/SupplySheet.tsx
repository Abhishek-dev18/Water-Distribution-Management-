
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Filter, Printer, Save, AlertCircle } from 'lucide-react';
import { Customer, Transaction, CustomerStats, calculateDailyCost, AppSettings } from '../types';
import { getCustomers, getTransactionsByDate, saveTransaction, getCustomerStats, getSettings } from '../services/db';

const SupplySheet: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [transactions, setTransactions] = useState<Record<string, Transaction>>({});
  const [originalTransactions, setOriginalTransactions] = useState<Record<string, Transaction>>({});
  const [baseStats, setBaseStats] = useState<Record<string, CustomerStats>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [settings, setSettings] = useState<AppSettings>({
    companyName: 'AquaFlow Services',
    companyAddress: '',
    companyMobile: '',
    billFooterNote: ''
  });
  
  const [filterArea, setFilterArea] = useState<string>('');

  useEffect(() => {
    loadData();
  }, [date]);

  const loadData = () => {
    setSettings(getSettings());
    const loadedCustomers = getCustomers();
    setCustomers(loadedCustomers);
    
    const txs = getTransactionsByDate(date);
    const txMap: Record<string, Transaction> = {};
    txs.forEach(t => {
      txMap[t.customerId] = { ...t };
    });
    
    setTransactions(JSON.parse(JSON.stringify(txMap)));
    setOriginalTransactions(JSON.parse(JSON.stringify(txMap)));

    const newStats: Record<string, CustomerStats> = {};
    loadedCustomers.forEach(c => {
      newStats[c.id] = getCustomerStats(c.id);
    });
    setBaseStats(newStats);
    setHasUnsavedChanges(false);
  };

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

  const handleInputChange = (customerId: string, field: keyof Transaction, value: string) => {
    const numValue = value === '' ? 0 : parseFloat(value);
    setTransactions(prev => ({
      ...prev,
      [customerId]: {
        ...(prev[customerId] || { id: '', customerId, date, jarsDelivered: 0, jarsReturned: 0, thermosDelivered: 0, thermosReturned: 0, paymentAmount: 0 }),
        [field]: numValue
      }
    }));
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    Object.values(transactions).forEach(tx => {
      saveTransaction(tx as Transaction);
    });
    loadData();
    alert("Supply sheet saved successfully!");
  };

  const getProjectedStats = (customer: Customer): CustomerStats => {
    const currentTx = transactions[customer.id] || { jarsDelivered: 0, jarsReturned: 0, thermosDelivered: 0, thermosReturned: 0, paymentAmount: 0 };
    const originalTx = originalTransactions[customer.id] || { jarsDelivered: 0, jarsReturned: 0, thermosDelivered: 0, thermosReturned: 0, paymentAmount: 0 };
    const base = baseStats[customer.id] || { currentJarBalance: 0, currentThermosBalance: 0, totalDue: 0 };

    const jarDiff = (currentTx.jarsDelivered - currentTx.jarsReturned) - (originalTx.jarsDelivered - originalTx.jarsReturned);
    const thermosDiff = (currentTx.thermosDelivered - currentTx.thermosReturned) - (originalTx.thermosDelivered - originalTx.thermosReturned);
    const currentCost = calculateDailyCost(currentTx as Transaction, customer);
    const originalCost = calculateDailyCost(originalTx as Transaction, customer);
    const costDiff = currentCost - originalCost;
    const payDiff = currentTx.paymentAmount - originalTx.paymentAmount;
    const dueDiff = costDiff - payDiff;

    return {
      currentJarBalance: base.currentJarBalance + jarDiff,
      currentThermosBalance: base.currentThermosBalance + thermosDiff,
      totalDue: base.totalDue + dueDiff
    };
  };

  return (
    <div className="p-6 h-full flex flex-col bg-brand-50/30 print:bg-white print:p-0 print:h-auto print:block">
      
      {/* Print-Only Professional Header */}
      <div className="hidden print:block mb-1">
        <h2 className="text-xl font-bold uppercase tracking-tight text-center">{settings.companyName || 'AquaFlow Services'}</h2>
        <div className="flex justify-between items-baseline border-b-2 border-black pb-1 px-1">
          <div className="text-[13px] font-bold">Area: <span className="text-base ml-1">{filterArea || 'N/A'}</span></div>
          <div className="text-[13px] font-bold">Date: <span className="text-base ml-1">{date}</span></div>
        </div>
      </div>

      {/* Screen Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 print:hidden">
        <div>
           <h1 className="text-2xl font-bold text-brand-800">Daily Supply Sheet</h1>
           <p className="text-brand-600/60 text-sm">Manage daily deliveries and collections.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center bg-white p-2 rounded-lg shadow-sm border border-brand-100">
          <div className="flex items-center gap-2 pr-3 border-r border-gray-100 relative group">
            <Calendar size={18} className="text-brand-400 pointer-events-none group-hover:text-brand-600" />
            <input 
              type="date" 
              value={date} 
              onClick={(e) => (e.currentTarget as any).showPicker?.()}
              onChange={(e) => setDate(e.target.value)} 
              className="border-none text-sm font-medium outline-none bg-transparent cursor-pointer" 
            />
          </div>
          <div className="flex items-center gap-2 px-2 border-r border-gray-100"><Filter size={18} className="text-brand-400" />
            <select value={filterArea} onChange={(e) => setFilterArea(e.target.value)} className="border-none text-sm font-medium outline-none bg-transparent cursor-pointer">{areas.map(a => <option key={a} value={a}>{a}</option>)}</select>
          </div>
          <button onClick={handleSave} disabled={!hasUnsavedChanges} className={`px-4 py-1.5 text-xs font-semibold rounded transition-all ${hasUnsavedChanges ? 'bg-brand-600 text-white shadow-md' : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}>Save Changes</button>
          <button onClick={() => window.print()} className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded hover:bg-gray-200">Print</button>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="flex-1 overflow-auto bg-white shadow-xl rounded-xl border border-brand-100 flex flex-col print:overflow-visible print:shadow-none print:border-none print:block print:w-full">
        <table className="w-full text-xs text-left border-collapse print:border print:border-black print:mb-8 print:w-full print:table">
          <thead className="bg-brand-50 text-brand-900 sticky top-0 z-10 shadow-sm print:static print:bg-gray-100 print:table-header-group">
            <tr>
              <th className="p-3 border border-brand-200 font-semibold min-w-[150px] print:border-black print:p-1.5 print:font-bold">Customer Name</th>
              <th className="p-3 border border-brand-200 font-semibold min-w-[120px] print:border-black print:p-1.5 print:font-bold">Landmark</th>
              <th className="p-3 border border-brand-200 font-semibold w-20 text-center bg-blue-50/80 print:bg-transparent print:border-black print:p-1 print:font-bold">Jar IN</th>
              <th className="p-3 border border-brand-200 font-semibold w-20 text-center bg-blue-50/80 print:bg-transparent print:border-black print:p-1 print:font-bold">Jar OUT</th>
              <th className="p-3 border border-brand-200 font-semibold w-24 text-center bg-green-50/80 print:bg-transparent print:border-black print:p-1 print:font-bold">Payment</th>
              <th className="p-3 border border-brand-200 font-semibold w-20 text-center bg-brand-100/50 print:bg-transparent print:border-black print:p-1 print:font-bold">Jar Bal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50 print:divide-black print:table-row-group">
            {filteredCustomers.length === 0 ? (
               <tr><td colSpan={6} className="p-12 text-center text-gray-400 italic">No customers found for this area.</td></tr>
            ) : (
              filteredCustomers.map(customer => {
                const tx = (transactions[customer.id] || { jarsDelivered: 0, jarsReturned: 0, thermosDelivered: 0, thermosReturned: 0, paymentAmount: 0 }) as Transaction;
                const stat = getProjectedStats(customer);
                return (
                  <tr key={customer.id} className="hover:bg-brand-50/30 transition-colors print:hover:bg-transparent break-inside-avoid print:h-8">
                    <td className="p-3 border border-brand-100 print:border-black print:p-1.5"><div className="font-bold text-gray-800 text-sm font-hindi leading-tight">{customer.nameHindi || customer.name}</div></td>
                    <td className="p-3 border border-brand-100 text-gray-500 print:border-black print:p-1.5 font-hindi text-[11px] leading-tight">{customer.landmarkHindi || customer.landmark}</td>
                    
                    <td className="p-0 border border-brand-100 print:border-black">
                      <input type="number" className="w-full h-full p-2 text-center outline-none bg-transparent print:hidden" value={tx.jarsDelivered === 0 ? '' : tx.jarsDelivered} onChange={(e) => handleInputChange(customer.id, 'jarsDelivered', e.target.value)}/>
                      <div className="hidden print:block text-center font-bold text-base">{tx.jarsDelivered || ''}</div>
                    </td>
                    
                    <td className="p-0 border border-brand-100 bg-gray-50/50 print:bg-transparent print:border-black">
                      <input type="number" className="w-full h-full p-2 text-center outline-none bg-transparent print:hidden" value={tx.jarsReturned === 0 ? '' : tx.jarsReturned} onChange={(e) => handleInputChange(customer.id, 'jarsReturned', e.target.value)}/>
                      <div className="hidden print:block text-center font-bold text-base">{tx.jarsReturned || ''}</div>
                    </td>
                    
                    <td className="p-0 border border-brand-100 bg-green-50/10 print:bg-transparent print:border-black">
                      <input type="number" className="w-full h-full p-2 text-center outline-none bg-transparent font-bold text-green-700 print:hidden" value={tx.paymentAmount === 0 ? '' : tx.paymentAmount} onChange={(e) => handleInputChange(customer.id, 'paymentAmount', e.target.value)}/>
                      <div className="hidden print:block text-center font-bold text-base">{tx.paymentAmount || ''}</div>
                    </td>
                    
                    <td className={`p-2 border border-brand-100 text-center font-bold text-sm ${stat.currentJarBalance > 0 ? 'text-brand-700' : 'text-gray-400'} print:border-black print:text-black`}>
                      {stat.currentJarBalance || '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        
        {/* Print-Only Footer */}
        <div className="mt-4 pt-4 border-t border-black flex justify-between text-[11px] print:flex hidden font-bold">
           <div>Printed: {new Date().toLocaleString()} | Area: {filterArea}</div>
        </div>
      </div>

      <style>{`
        @media print {
          body { overflow: visible !important; margin: 0; padding: 0; }
          .print\\:block { display: block !important; }
          .print\\:hidden { display: none !important; }
          @page { size: A4; margin: 10mm 5mm; }
          table { width: 100% !important; border-collapse: collapse !important; border: 1px solid black !important; }
          th, td { border: 1px solid black !important; }
        }
      `}</style>
    </div>
  );
};

export default SupplySheet;
