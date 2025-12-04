import React, { useState, useEffect } from 'react';
import { Sparkles, Loader, TrendingUp, Users, AlertCircle, Droplets, Package, Calendar, IndianRupee, Wallet } from 'lucide-react';
import { getCustomers, getTransactions, getTransactionsByDate, getAllCustomerStats } from '../services/db';
import { generateBusinessInsight } from '../services/geminiService';
import { Customer, Transaction, CustomerStats } from '../types';

const Dashboard: React.FC = () => {
  const [insight, setInsight] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState(false);
  
  // Stats State
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalDue: 0,
    jarsToday: 0,
    thermosToday: 0,
    paymentToday: 0,
    jarsMonth: 0,
    thermosMonth: 0,
    paymentMonth: 0,
    activeCustomers: 0
  });

  useEffect(() => {
    const customers = getCustomers();
    const allStats = getAllCustomerStats();
    
    // Calculate Total Due
    const totalDue = Object.values(allStats).reduce((acc, curr) => acc + curr.totalDue, 0);
    
    // Today's Activity
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysTx = getTransactionsByDate(todayStr);
    
    const jarsToday = todaysTx.reduce((acc, t) => acc + (t.jarsDelivered || 0), 0);
    const thermosToday = todaysTx.reduce((acc, t) => acc + (t.thermosDelivered || 0), 0);
    const paymentToday = todaysTx.reduce((acc, t) => acc + (t.paymentAmount || 0), 0);
    
    // Monthly Activity
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const allTransactions = getTransactions();
    const monthTx = allTransactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const jarsMonth = monthTx.reduce((acc, t) => acc + (t.jarsDelivered || 0), 0);
    const thermosMonth = monthTx.reduce((acc, t) => acc + (t.thermosDelivered || 0), 0);
    const paymentMonth = monthTx.reduce((acc, t) => acc + (t.paymentAmount || 0), 0);

    setStats({
      totalCustomers: customers.length,
      totalDue,
      jarsToday,
      thermosToday,
      paymentToday,
      jarsMonth,
      thermosMonth,
      paymentMonth,
      activeCustomers: customers.length
    });
  }, []);

  const handleGenerateInsight = async () => {
    setLoadingAi(true);
    const customers = getCustomers();
    const transactions = getTransactions();
    
    // Safety check for API key
    if (!process.env.API_KEY) {
       setInsight("API Key configuration required for AI analysis.");
       setLoadingAi(false);
       return;
    }

    const result = await generateBusinessInsight(customers, transactions);
    setInsight(result);
    setLoadingAi(false);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <TrendingUp className="text-brand-600" /> Dashboard & Analytics
      </h1>

      {/* Financial Snapshot */}
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Financial Snapshot</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Due */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total Outstanding</p>
              <h3 className="text-2xl font-bold text-red-600 mt-1">₹{stats.totalDue.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-red-50 rounded-lg text-red-500">
              <AlertCircle size={20} />
            </div>
          </div>
        </div>

        {/* Daily Collection */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Collected Today</p>
              <h3 className="text-2xl font-bold text-green-600 mt-1">₹{stats.paymentToday.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-green-50 rounded-lg text-green-500">
              <IndianRupee size={20} />
            </div>
          </div>
        </div>

        {/* Monthly Revenue */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Revenue (Month)</p>
              <h3 className="text-2xl font-bold text-brand-600 mt-1">₹{stats.paymentMonth.toLocaleString()}</h3>
            </div>
            <div className="p-2 bg-brand-50 rounded-lg text-brand-500">
              <Wallet size={20} />
            </div>
          </div>
        </div>

        {/* Total Customers */}
        <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-medium text-gray-500 uppercase">Total Customers</p>
              <h3 className="text-2xl font-bold text-gray-800 mt-1">{stats.totalCustomers}</h3>
            </div>
            <div className="p-2 bg-blue-50 rounded-lg text-blue-500">
              <Users size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Supply Overview */}
      <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Supply Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        
        {/* Today's Supply */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
           <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
             <Calendar size={16} className="text-brand-500"/> Today's Delivery
           </h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-brand-50/50 p-4 rounded-lg flex items-center gap-4">
                 <div className="bg-brand-100 text-brand-600 p-2 rounded-full">
                    <Droplets size={20}/>
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 font-medium">Jars</p>
                    <p className="text-xl font-bold text-gray-800">{stats.jarsToday}</p>
                 </div>
              </div>
              <div className="bg-orange-50/50 p-4 rounded-lg flex items-center gap-4">
                 <div className="bg-orange-100 text-orange-600 p-2 rounded-full">
                    <Package size={20}/>
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 font-medium">Thermos</p>
                    <p className="text-xl font-bold text-gray-800">{stats.thermosToday}</p>
                 </div>
              </div>
           </div>
        </div>

        {/* Monthly Supply */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
           <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
             <TrendingUp size={16} className="text-brand-500"/> Monthly Performance
           </h3>
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                 <div className="text-brand-600">
                    <Droplets size={24}/>
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 font-medium">Total Jars</p>
                    <p className="text-xl font-bold text-gray-800">{stats.jarsMonth}</p>
                 </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg flex items-center gap-4">
                 <div className="text-orange-500">
                    <Package size={24}/>
                 </div>
                 <div>
                    <p className="text-xs text-gray-500 font-medium">Total Thermos</p>
                    <p className="text-xl font-bold text-gray-800">{stats.thermosMonth}</p>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* AI Section */}
      <div className="bg-white rounded-xl shadow-sm border border-brand-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Sparkles className="text-purple-600" size={20} /> AI Business Insights
            </h2>
            <p className="text-sm text-gray-500">Get intelligent analysis of your supply trends and revenue.</p>
          </div>
          <button 
            onClick={handleGenerateInsight}
            disabled={loadingAi}
            className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2 disabled:opacity-70"
          >
            {loadingAi ? <Loader className="animate-spin" size={16} /> : <Sparkles size={16} />}
            {loadingAi ? 'Analyzing...' : 'Generate Report'}
          </button>
        </div>

        {(insight || loadingAi) && (
          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
             {loadingAi ? (
               <div className="text-center text-purple-600 py-4">
                 <p className="animate-pulse">Consulting Gemini AI...</p>
               </div>
             ) : (
               <div className="prose prose-sm max-w-none text-gray-800 whitespace-pre-wrap">
                 {insight}
               </div>
             )}
          </div>
        )}
        
        {!insight && !loadingAi && (
          <div className="text-center py-8 text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
            Click "Generate Report" to analyze your business data.
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;