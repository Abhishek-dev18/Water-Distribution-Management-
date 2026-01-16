
import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, Filter, Printer, Save, AlertCircle } from 'lucide-react';
import { Customer, Transaction, CustomerStats, calculateDailyCost, AppSettings } from '../types';
import { getCustomers, getTransactionsByDate, saveTransaction, getCustomerStats, getSettings } from '../services/db';

const SupplySheet: React.FC = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  // State for data management
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
    // Load Settings
    setSettings(getSettings());

    // 1. Load Customers
    const loadedCustomers = getCustomers();
    setCustomers(loadedCustomers);
    
    // 2. Load Transactions for Date
    const txs = getTransactionsByDate(date);
    const txMap: Record<string, Transaction> = {};
    
    txs.forEach(t => {
      txMap[t.customerId] = { ...t };
    });
    
    setTransactions(JSON.parse(JSON.stringify(txMap))); // Deep copy for editing
    setOriginalTransactions(JSON.parse(JSON.stringify(txMap))); // Deep copy for comparison

    // 3. Load Base Stats (Snapshot before current day's edit)
    const newStats: Record<string, CustomerStats> = {};
    loadedCustomers.forEach(c => {
      newStats[c.id] = getCustomerStats(c.id);
    });
    setBaseStats(newStats);
    setHasUnsavedChanges(false);
  };

  const areas = useMemo(() => Array.from(new Set(customers.map(c => c.area))).sort(), [customers]);

  // Auto-select first area
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
    // Save all dirty transactions
    Object.values(transactions).forEach(tx => {
      saveTransaction(tx as Transaction);
    });
    
    // Reload to refresh stats and sync states
    loadData();
    alert("Supply sheet saved successfully!");
  };

  // Helper to project stats based on unsaved inputs
  const getProjectedStats = (customer: Customer): CustomerStats => {
    const currentTx = transactions[customer.id] || { jarsDelivered: 0, jarsReturned: 0, thermosDelivered: 0, thermosReturned: 0, paymentAmount: 0 };
    const originalTx = originalTransactions[customer.id] || { jarsDelivered: 0, jarsReturned: 0, thermosDelivered: 0, thermosReturned: 0, paymentAmount: 0 };
    const base = baseStats[customer.id] || { currentJarBalance: 0, currentThermosBalance: 0, totalDue: 0 };

    // Calculate diffs
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

  // Calculate Column Totals
  const totals = useMemo(() => {
    const acc = {
      jarsIn: 0,
      jarsOut: 0,
      thermosIn: 0,
      thermosOut: 0,
      payment: 0,
      due: 0,
      jarBal: 0,
      thermosBal: 0
    };

    filteredCustomers.forEach(c => {
      const tx = transactions[c.id] || { jarsDelivered: 0, jarsReturned: 0, thermosDelivered: 0, thermosReturned: 0, paymentAmount: 0 };
      const stats = getProjectedStats(c);

      acc.jarsIn += (tx.jarsDelivered || 0);
      acc.jarsOut += (tx.jarsReturned || 0);
      acc.thermosIn += (tx.thermosDelivered || 0);
      acc.thermosOut += (tx.thermosReturned || 0);
      acc.payment += (tx.paymentAmount || 0);
      
      acc.due += stats.totalDue;
      acc.jarBal += stats.currentJarBalance;
      acc.thermosBal += stats.currentThermosBalance;
    });

    return acc;
  }, [filteredCustomers, transactions, baseStats]); // Re-calc when inputs change

  return (
    <div className="p-6 h-full flex flex-col bg-brand-50/30 print:bg-white print:p-0 print:h-auto print:block">
      {/* Print Header - Visible only in Print */}
      <div className="hidden print:block mb-4 text-center">
        <h1 className="text-2xl font-bold uppercase text-gray-800">{settings.companyName}</h1>
        <p className="text-sm text-gray-600">{settings.companyAddress}</p>
        {settings.companyMobile && <p className="text-sm text-gray-600">Ph: {settings.companyMobile}</p>}
        <div className="flex justify-between items-end mt-4 border-b-2 border-gray-800 pb-2">
           <div className="font-bold">Daily Supply Sheet</div>
           <div className="text-sm">
             Area: <span className="font-bold mr-4">{filterArea}</span>
             Date: <span className="font-bold">{date}</span>
           </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4 print:hidden">
        <div>
           <h1 className="text-2xl font-bold text-brand-800">Daily Supply Sheet</h1>
           <p className="text-brand-600/60 text-sm">Manage daily deliveries and collections.</p>
        </div>
       
        <div className="flex flex-wrap gap-3 items-center bg-white p-2 rounded-lg shadow-sm border border-brand-100">
          <div className="flex items-center gap-2 border-r border-gray-200 pr-3 relative group">
            <Calendar size={18} className="text-brand-400 group-hover:text-brand-600 transition-colors pointer-events-none" />
            <input 
              type="date" 
              value={date} 
              onClick={(e) => (e.currentTarget as any).showPicker?.()}
              onChange={(e) => setDate(e.target.value)} 
              className="border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer"
            />
          </div>
          <div className="flex items-center gap-2 px-2 border-r border-gray-200">
            <Filter size={18} className="text-brand-400" />
            {areas.length > 0 ? (
              <select 
                value={filterArea} 
                onChange={(e) => setFilterArea(e.target.value)}
                className="border-none focus:ring-0 text-sm font-medium text-gray-700 bg-transparent outline-none cursor-pointer min-w-[100px]"
              >
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            ) : (
              <span className="text-sm text-gray-400 italic px-2">No Areas</span>
            )}
          </div>

           <button 
            onClick={handleSave} 
            disabled={!hasUnsavedChanges}
            className={`ml-2 px-4 py-1.5 text-xs font-semibold rounded flex items-center gap-2 transition-all transform active:scale-95 ${
              hasUnsavedChanges 
                ? 'bg-brand-600 text-white hover:bg-brand-700 shadow-md ring-2 ring-brand-200 ring-offset-1' 
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            <Save size={14}/> {hasUnsavedChanges ? 'Save Changes' : 'Saved'}
          </button>

          <button 
            onClick={() => window.print()} 
            className="px-3 py-1.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded hover:bg-gray-200 flex items-center gap-2 transition-colors"
          >
            <Printer size={14}/> Print
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto bg-white shadow-xl rounded-xl border border-brand-100 flex flex-col print:overflow-visible print:shadow-none print:border-none print:h-auto print:block">
        {hasUnsavedChanges && (
          <div className="bg-yellow-50 text-yellow-800 text-xs text-center py-1 border-b border-yellow-100 flex items-center justify-center gap-2 print:hidden">
            <AlertCircle size={12}/> You have unsaved changes. Click "Save Changes" to update balances.
          </div>
        )}
        
        <table className="w-full text-xs text-left border-collapse print:border print:border-gray-400 print:mb-8">
          <thead className="bg-brand-50 text-brand-900 sticky top-0 z-10 shadow-sm print:static print:bg-gray-100 print:shadow-none">
            <tr>
              <th className="p-3 border border-brand-200 font-semibold min-w-[150px] print:border-gray-400 print:text-black">Name</th>
              <th className="p-3 border border-brand-200 font-semibold min-w-[120px] print:border-gray-400 print:text-black">Landmark</th>
              <th className="p-3 border border-brand-200 font-semibold min-w-[100px] print:border-gray-400 print:text-black">Mobile</th>
              
              <th className="p-2 border border-brand-200 font-semibold text-center w-20 bg-blue-50/80 align-middle print:border-gray-400 print:bg-transparent print:text-black">Jar<br/>IN</th>
              <th className="p-2 border border-brand-200 font-semibold text-center w-20 bg-blue-50/80 align-middle print:border-gray-400 print:bg-transparent print:text-black">Jar<br/>OUT</th>
              <th className="p-2 border border-brand-200 font-semibold text-center w-20 bg-orange-50/80 align-middle print:border-gray-400 print:bg-transparent print:text-black">Thermos<br/>IN</th>
              <th className="p-2 border border-brand-200 font-semibold text-center w-20 bg-orange-50/80 align-middle print:border-gray-400 print:bg-transparent print:text-black">Thermos<br/>OUT</th>
              
              <th className="p-2 border border-brand-200 font-semibold text-center w-32 bg-green-50/80 align-middle print:border-gray-400 print:bg-transparent print:text-black">Payment</th>
              <th className="p-2 border border-brand-200 font-semibold text-center w-32 bg-red-50/80 align-middle print:border-gray-400 print:bg-transparent print:text-black">Dues</th>
              
              <th className="p-2 border border-brand-200 font-semibold text-center w-20 bg-brand-100/50 align-middle print:border-gray-400 print:bg-transparent print:text-black">Jar<br/>Bal</th>
              <th className="p-2 border border-brand-200 font-semibold text-center w-20 bg-orange-100/50 align-middle print:border-gray-400 print:bg-transparent print:text-black">Thermos<br/>Bal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-50 print:divide-gray-400">
            {filteredCustomers.length === 0 ? (
               <tr>
                 <td colSpan={11} className="p-8 text-center text-gray-500 print:border print:border-gray-400">
                   {areas.length === 0 ? "No customers/areas found. Please add areas and customers first." : "Select an area to view customers."}
                 </td>
               </tr>
            ) : (
              filteredCustomers.map(customer => {
                const tx = (transactions[customer.id] || { jarsDelivered: 0, jarsReturned: 0, thermosDelivered: 0, thermosReturned: 0, paymentAmount: 0 }) as Transaction;
                const stat = getProjectedStats(customer);
                
                return (
                  <tr key={customer.id} className="hover:bg-brand-50/30 group transition-colors print:hover:bg-transparent break-inside-avoid">
                    <td className="p-3 border border-brand-100 print:border-gray-400">
                      <div className="font-bold text-gray-800 text-sm font-hindi">{customer.nameHindi || customer.name}</div>
                    </td>
                    
                    <td className="p-3 border border-brand-100 text-gray-500 print:border-gray-400 font-hindi">
                      {customer.landmarkHindi || customer.landmark}
                    </td>

                    <td className="p-3 border border-brand-100 text-gray-600 font-mono text-[11px] print:border-gray-400">
                      {customer.mobile}
                    </td>
                    
                    {/* Inputs */}
                    <td className="p-0 border border-brand-100 print:border-gray-400">
                      <input 
                        type="number" min="0" placeholder="-"
                        className="w-full h-full p-2 text-center focus:ring-2 focus:ring-inset focus:ring-brand-500 outline-none bg-transparent placeholder-gray-300 font-medium print:hidden"
                        value={tx.jarsDelivered === 0 ? '' : tx.jarsDelivered}
                        onChange={(e) => handleInputChange(customer.id, 'jarsDelivered', e.target.value)}
                      />
                      <div className="hidden print:block text-center">{tx.jarsDelivered > 0 ? tx.jarsDelivered : ''}</div>
                    </td>
                    <td className="p-0 border border-brand-100 bg-gray-50/50 print:bg-transparent print:border-gray-400">
                       <input 
                        type="number" min="0" placeholder="-"
                        className="w-full h-full p-2 text-center focus:ring-2 focus:ring-inset focus:ring-brand-500 outline-none bg-transparent text-gray-600 placeholder-gray-300 print:hidden"
                        value={tx.jarsReturned === 0 ? '' : tx.jarsReturned}
                        onChange={(e) => handleInputChange(customer.id, 'jarsReturned', e.target.value)}
                      />
                       <div className="hidden print:block text-center">{tx.jarsReturned > 0 ? tx.jarsReturned : ''}</div>
                    </td>

                    <td className="p-0 border border-brand-100 print:border-gray-400">
                       <input 
                        type="number" min="0" placeholder="-"
                        className="w-full h-full p-2 text-center focus:ring-2 focus:ring-inset focus:ring-orange-400 outline-none bg-transparent placeholder-gray-300 font-medium print:hidden"
                        value={tx.thermosDelivered === 0 ? '' : tx.thermosDelivered}
                        onChange={(e) => handleInputChange(customer.id, 'thermosDelivered', e.target.value)}
                      />
                      <div className="hidden print:block text-center">{tx.thermosDelivered > 0 ? tx.thermosDelivered : ''}</div>
                    </td>
                    <td className="p-0 border border-brand-100 bg-gray-50/50 print:bg-transparent print:border-gray-400">
                       <input 
                        type="number" min="0" placeholder="-"
                        className="w-full h-full p-2 text-center focus:ring-2 focus:ring-inset focus:ring-orange-400 outline-none bg-transparent text-gray-600 placeholder-gray-300 print:hidden"
                        value={tx.thermosReturned === 0 ? '' : tx.thermosReturned}
                        onChange={(e) => handleInputChange(customer.id, 'thermosReturned', e.target.value)}
                      />
                      <div className="hidden print:block text-center">{tx.thermosReturned > 0 ? tx.thermosReturned : ''}</div>
                    </td>

                    <td className="p-0 border border-brand-100 bg-green-50/10 print:bg-transparent print:border-gray-400">
                       <input 
                        type="number" min="0" placeholder="-"
                        className="w-full h-full p-2 text-center focus:ring-2 focus:ring-inset focus:ring-green-500 outline-none bg-transparent font-bold text-green-700 placeholder-gray-300 print:hidden"
                        value={tx.paymentAmount === 0 ? '' : tx.paymentAmount}
                        onChange={(e) => handleInputChange(customer.id, 'paymentAmount', e.target.value)}
                      />
                      <div className="hidden print:block text-center font-bold">{tx.paymentAmount > 0 ? tx.paymentAmount : ''}</div>
                    </td>

                    <td className={`p-2 border border-brand-100 text-center font-bold ${stat.totalDue > 0 ? 'text-red-600 bg-red-50/30 print:bg-transparent print:text-black' : 'text-gray-400'} print:border-gray-400`}>
                      {stat.totalDue > 0 ? `₹${stat.totalDue}` : '-'}
                    </td>

                    <td className={`p-2 border border-brand-100 text-center font-medium ${stat.currentJarBalance > 0 ? 'text-brand-700 print:text-black' : 'text-gray-400'} print:border-gray-400`}>
                       {stat.currentJarBalance > 0 ? stat.currentJarBalance : '-'}
                    </td>

                    <td className={`p-2 border border-brand-100 text-center font-medium ${stat.currentThermosBalance > 0 ? 'text-orange-700 print:text-black' : 'text-gray-400'} print:border-gray-400`}>
                      {stat.currentThermosBalance > 0 ? stat.currentThermosBalance : '-'}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          {/* Footer Totals */}
          <tfoot className="bg-gray-100 font-bold sticky bottom-0 z-10 shadow-inner print:static print:shadow-none print:bg-gray-200">
             <tr>
               <td className="p-3 border border-gray-300 text-right text-gray-700 print:border-gray-400" colSpan={3}>Totals:</td>
               <td className="p-2 border border-gray-300 text-center text-brand-700 bg-blue-100 print:bg-transparent print:text-black print:border-gray-400">{totals.jarsIn}</td>
               <td className="p-2 border border-gray-300 text-center text-gray-600 bg-gray-200 print:bg-transparent print:text-black print:border-gray-400">{totals.jarsOut}</td>
               <td className="p-2 border border-gray-300 text-center text-orange-700 bg-orange-100 print:bg-transparent print:text-black print:border-gray-400">{totals.thermosIn}</td>
               <td className="p-2 border border-gray-300 text-center text-gray-600 bg-gray-200 print:bg-transparent print:text-black print:border-gray-400">{totals.thermosOut}</td>
               <td className="p-2 border border-gray-300 text-center text-green-700 bg-green-100 print:bg-transparent print:text-black print:border-gray-400">₹{totals.payment}</td>
               <td className="p-2 border border-gray-300 text-center text-red-700 bg-red-100 print:bg-transparent print:text-black print:border-gray-400">₹{totals.due}</td>
               <td className="p-2 border border-gray-300 text-center text-gray-700 bg-gray-200 print:bg-transparent print:text-black print:border-gray-400">{totals.jarBal}</td>
               <td className="p-2 border border-gray-300 text-center text-gray-700 bg-gray-200 print:bg-transparent print:text-black print:border-gray-400">{totals.thermosBal}</td>
             </tr>
          </tfoot>
        </table>
      </div>

      {/* Print Footer */}
      <div className="hidden print:flex mt-auto pt-8 justify-between text-xs text-black">
         <div>Printed on: {new Date().toLocaleString()}</div>
         <div className="font-bold border-t border-black px-4 pt-1">Signature</div>
      </div>
    </div>
  );
};

export default SupplySheet;
