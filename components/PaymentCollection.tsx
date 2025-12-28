
import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Wallet, IndianRupee, User, Calendar, CheckCircle2, ArrowRight, X, Clock } from 'lucide-react';
import { Customer, Transaction, CustomerStats } from '../types';
import { getCustomers, getAreas, saveTransaction, getCustomerStats, getTransactions } from '../services/db';

const PaymentCollection: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterArea, setFilterArea] = useState('All');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [areas, setAreas] = useState<string[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

  // Load Initial Data
  useEffect(() => {
    setCustomers(getCustomers());
    setAreas(['All', ...getAreas().map(a => a.name)]);
    loadRecentPayments();
  }, []);

  const loadRecentPayments = () => {
    const allTxs = getTransactions();
    const custMap = Object.fromEntries(getCustomers().map(c => [c.id, c]));
    
    // Get last 5 payments
    const payments = allTxs
      .filter(t => t.paymentAmount > 0)
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 5)
      .map(t => ({
        ...t,
        customerName: custMap[t.customerId]?.name || 'Unknown'
      }));
    
    setRecentPayments(payments);
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           c.mobile.includes(searchTerm) ||
                           c.id.includes(searchTerm);
      const matchesArea = filterArea === 'All' || c.area === filterArea;
      return matchesSearch && matchesArea;
    });
  }, [customers, searchTerm, filterArea]);

  const handleCollectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    // Existing transaction on same date?
    const existingTxs = getTransactions().find(t => t.customerId === selectedCustomer.id && t.date === paymentDate);

    const payload: Partial<Transaction> & { customerId: string; date: string } = {
      customerId: selectedCustomer.id,
      date: paymentDate,
      paymentAmount: (existingTxs?.paymentAmount || 0) + amount
    };

    saveTransaction(payload);
    
    // Reset and feedback
    setShowSuccess(true);
    setPaymentAmount('');
    setSelectedCustomer(null);
    loadRecentPayments();
    setCustomers(getCustomers()); // Refresh balances

    setTimeout(() => setShowSuccess(false), 3000);
  };

  const getStats = (id: string): CustomerStats => {
    return getCustomerStats(id);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Wallet className="text-brand-600" /> Payment Collection
          </h1>
          <p className="text-sm text-gray-500">Search customers and record payments directly into their accounts.</p>
        </div>
        
        {/* Recent Activity Mini-Widget */}
        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4 hidden lg:flex">
          <div className="p-2 bg-brand-50 text-brand-600 rounded-lg">
             <Clock size={18} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider leading-none mb-1">Last Payment</p>
            {recentPayments.length > 0 ? (
              <p className="text-xs font-bold text-gray-700">
                ₹{recentPayments[0].paymentAmount} from {recentPayments[0].customerName.split(' ')[0]}
              </p>
            ) : (
              <p className="text-xs text-gray-400 italic">No recent payments</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Search & List Panel */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <input 
                type="text"
                placeholder="Search by Name, Mobile or ID..."
                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 bg-white text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
            <div className="relative min-w-[150px]">
              <select 
                className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-500/10 focus:border-brand-500 outline-none appearance-none bg-white text-gray-700 cursor-pointer"
                value={filterArea}
                onChange={(e) => setFilterArea(e.target.value)}
              >
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
              <Filter className="absolute left-3 top-3 text-gray-400" size={18} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full py-12 text-center bg-white rounded-xl border-2 border-dashed border-gray-100 text-gray-400">
                No matching customers found.
              </div>
            ) : (
              filteredCustomers.map(c => {
                const s = getStats(c.id);
                return (
                  <div key={c.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="text-[10px] text-brand-500 font-mono font-bold mb-1">#{c.id}</div>
                        <h3 className="font-bold text-gray-800 leading-tight group-hover:text-brand-600 transition-colors">{c.name}</h3>
                        <p className="text-xs text-gray-500 mt-1 flex items-center gap-1 font-hindi">{c.nameHindi}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Balance Due</p>
                        <p className={`text-lg font-black ${s.totalDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ₹{s.totalDue.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                      <div className="text-xs text-gray-400 flex items-center gap-1">
                        <User size={12}/> {c.mobile}
                      </div>
                      <button 
                        onClick={() => setSelectedCustomer(c)}
                        className="flex items-center gap-2 text-brand-600 hover:text-brand-700 font-bold text-xs uppercase tracking-wider"
                      >
                        Collect <ArrowRight size={14}/>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Payment Form Panel */}
        <div className="space-y-6">
          <div className={`bg-white rounded-2xl shadow-xl border overflow-hidden transition-all ${selectedCustomer ? 'border-brand-500 ring-4 ring-brand-50' : 'border-gray-100 opacity-60'}`}>
            <div className="bg-brand-600 p-6 text-white">
               <h2 className="text-lg font-bold flex items-center gap-2 uppercase tracking-wide">
                 <IndianRupee size={20}/> Record Payment
               </h2>
               <p className="text-brand-100 text-xs mt-1">Select a customer from the left to begin.</p>
            </div>

            {selectedCustomer ? (
              <form onSubmit={handleCollectPayment} className="p-6 space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                 <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Paying For</p>
                    <div className="flex justify-between items-end">
                      <div className="font-bold text-gray-800">{selectedCustomer.name}</div>
                      <button type="button" onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-red-500 transition-colors"><X size={16}/></button>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-200 flex justify-between items-baseline">
                       <span className="text-xs text-gray-500">Current Outstanding:</span>
                       <span className="text-sm font-black text-red-600">₹{getStats(selectedCustomer.id).totalDue.toLocaleString()}</span>
                    </div>
                 </div>

                 <div className="space-y-4">
                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Payment Date</label>
                     <div className="relative">
                       <input 
                         type="date"
                         className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none font-medium text-gray-700"
                         value={paymentDate}
                         onChange={(e) => setPaymentDate(e.target.value)}
                       />
                       <Calendar className="absolute left-3 top-3.5 text-gray-400" size={18}/>
                     </div>
                   </div>

                   <div>
                     <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Amount Paid (₹)</label>
                     <div className="relative">
                       <input 
                         type="number"
                         required
                         autoFocus
                         placeholder="0.00"
                         className="w-full pl-10 pr-4 py-4 bg-gray-50 border border-gray-200 rounded-xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none font-black text-xl text-brand-700"
                         value={paymentAmount}
                         onChange={(e) => setPaymentAmount(e.target.value)}
                       />
                       <IndianRupee className="absolute left-3 top-5 text-brand-400" size={24}/>
                     </div>
                   </div>
                 </div>

                 <button 
                   type="submit"
                   className="w-full bg-brand-600 hover:bg-brand-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-brand-100 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                 >
                   Confirm Payment <CheckCircle2 size={18}/>
                 </button>
              </form>
            ) : (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center gap-4">
                <div className="p-4 bg-gray-50 rounded-full">
                  <User size={48} className="opacity-20"/>
                </div>
                <p className="text-sm italic">Please pick a customer from the list to enter their payment amount.</p>
              </div>
            )}
          </div>

          {/* Recent History Widget */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-sm font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Clock size={16} className="text-brand-500"/> Recent Daily Collections
            </h3>
            <div className="space-y-3">
              {recentPayments.map((p, idx) => (
                <div key={idx} className="flex justify-between items-center text-xs p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div>
                    <div className="font-bold text-gray-700">{p.customerName}</div>
                    <div className="text-[10px] text-gray-400">{p.date}</div>
                  </div>
                  <div className="font-bold text-green-600">₹{p.paymentAmount}</div>
                </div>
              ))}
              {recentPayments.length === 0 && (
                <p className="text-center text-gray-300 italic text-xs py-4">No payments recorded yet.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed bottom-8 right-8 bg-green-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-right-10 duration-500 z-50">
          <div className="bg-white/20 p-1 rounded-full">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <div className="font-bold">Payment Recorded!</div>
            <div className="text-xs opacity-90">Account balance updated successfully.</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentCollection;
