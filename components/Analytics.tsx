
import React, { useState, useMemo, useEffect } from 'react';
import { BarChart3, Calendar, TrendingUp, DollarSign, Package, Droplets, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { getTransactions, getCustomers } from '../services/db';
import { Transaction, Customer } from '../types';

// --- SVG CHART COMPONENTS ---

const SimpleBarChart = ({ data, colorClass = "text-brand-500", height = 150 }: { data: { label: string, value: number }[], colorClass?: string, height?: number }) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end justify-between gap-2 h-full w-full pt-4 pr-2">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center flex-1 group relative">
           {/* Tooltip */}
           <div className="absolute -top-8 opacity-0 group-hover:opacity-100 bg-gray-800 text-white text-[10px] px-2 py-1 rounded pointer-events-none transition-opacity whitespace-nowrap z-10">
             {d.label}: {d.value}
           </div>
           
           <div 
             className={`w-full max-w-[20px] rounded-t-sm transition-all duration-500 ${colorClass} bg-current opacity-80 hover:opacity-100`} 
             style={{ height: `${(d.value / maxValue) * 100}%`, minHeight: '4px' }}
           ></div>
           <span className="text-[9px] text-gray-400 mt-1 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const SimpleLineChart = ({ data, height = 150 }: { data: { label: string, v1: number, v2: number }[], height?: number }) => {
  const max = Math.max(...data.map(d => Math.max(d.v1, d.v2)), 1);
  const points1 = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.v1 / max) * 100}`).join(" ");
  const points2 = data.map((d, i) => `${(i / (data.length - 1)) * 100},${100 - (d.v2 / max) * 100}`).join(" ");

  return (
    <div className="relative w-full h-full pt-4">
       <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
          {/* Grid lines */}
          <line x1="0" y1="25" x2="100" y2="25" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2" />
          <line x1="0" y1="50" x2="100" y2="50" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2" />
          <line x1="0" y1="75" x2="100" y2="75" stroke="#e5e7eb" strokeWidth="0.5" strokeDasharray="2" />
          
          {/* Jar Line (Blue) */}
          <polyline fill="none" stroke="#3b82f6" strokeWidth="2" points={points1} vectorEffect="non-scaling-stroke" />
          
          {/* Thermos Line (Orange) */}
          <polyline fill="none" stroke="#f97316" strokeWidth="2" points={points2} vectorEffect="non-scaling-stroke" />
       </svg>
       
       {/* Labels overlay */}
       <div className="absolute bottom-0 w-full flex justify-between text-[9px] text-gray-400 mt-1">
         <span>{data[0]?.label}</span>
         <span>{data[Math.floor(data.length / 2)]?.label}</span>
         <span>{data[data.length - 1]?.label}</span>
       </div>
    </div>
  );
};


// --- MAIN COMPONENT ---

type ViewMode = 'daily' | 'monthly' | 'yearly';

const Analytics: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [viewMode, setViewMode] = useState<ViewMode>('monthly');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [filterArea, setFilterArea] = useState<string>('All');

  useEffect(() => {
    setTransactions(getTransactions());
    setCustomers(getCustomers());
  }, []);

  const areas = useMemo(() => ['All', ...Array.from(new Set(customers.map(c => c.area))).sort()], [customers]);

  // --- NAVIGATION HELPERS ---
  
  const navigateDate = (direction: -1 | 1) => {
    const newDate = new Date(selectedDate);
    if (viewMode === 'daily') newDate.setDate(newDate.getDate() + direction);
    if (viewMode === 'monthly') newDate.setMonth(newDate.getMonth() + direction);
    if (viewMode === 'yearly') newDate.setFullYear(newDate.getFullYear() + direction);
    setSelectedDate(newDate);
  };

  const getPeriodLabel = () => {
    if (viewMode === 'daily') return selectedDate.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' });
    if (viewMode === 'monthly') return selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    if (viewMode === 'yearly') return selectedDate.getFullYear().toString();
    return '';
  };

  // --- DATA PROCESSING ---

  // 1. Filter Transactions by Period & Area
  const periodTransactions = useMemo(() => {
    return transactions.filter(t => {
      const tDate = new Date(t.date);
      
      // Area Filter
      if (filterArea !== 'All') {
        const cust = customers.find(c => c.id === t.customerId);
        if (!cust || cust.area !== filterArea) return false;
      }

      // Date Filter
      if (viewMode === 'daily') {
        return t.date === selectedDate.toISOString().split('T')[0];
      }
      if (viewMode === 'monthly') {
        return tDate.getMonth() === selectedDate.getMonth() && tDate.getFullYear() === selectedDate.getFullYear();
      }
      if (viewMode === 'yearly') {
        return tDate.getFullYear() === selectedDate.getFullYear();
      }
      return true;
    });
  }, [transactions, customers, viewMode, selectedDate, filterArea]);

  // 2. Calculate Totals for Summary Cards
  const totals = useMemo(() => {
    return periodTransactions.reduce((acc, t) => ({
      revenue: acc.revenue + t.paymentAmount,
      jars: acc.jars + t.jarsDelivered,
      thermos: acc.thermos + t.thermosDelivered
    }), { revenue: 0, jars: 0, thermos: 0 });
  }, [periodTransactions]);

  // 3. Generate Chart Data (Trend)
  const chartData = useMemo(() => {
    const dataPoints: { label: string, value: number, v1: number, v2: number }[] = [];
    
    // Helper to get formatted date string YYYY-MM-DD
    const toYMD = (d: Date) => d.toISOString().split('T')[0];

    // If Daily: Show last 14 days trend leading up to selected date
    if (viewMode === 'daily') {
      for (let i = 13; i >= 0; i--) {
        const d = new Date(selectedDate);
        d.setDate(d.getDate() - i);
        const dateStr = toYMD(d);
        
        // Filter for specific day across all filtered transactions (we need to re-filter from source because periodTransactions only contains the single day)
        const dayTxs = transactions.filter(t => t.date === dateStr && (filterArea === 'All' || customers.find(c => c.id === t.customerId)?.area === filterArea));
        
        dataPoints.push({
          label: d.getDate().toString(),
          value: dayTxs.reduce((s, t) => s + t.paymentAmount, 0),
          v1: dayTxs.reduce((s, t) => s + t.jarsDelivered, 0),
          v2: dayTxs.reduce((s, t) => s + t.thermosDelivered, 0)
        });
      }
    } 
    // If Monthly: Show days in month
    else if (viewMode === 'monthly') {
      const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), i);
        const dateStr = toYMD(d);
        const dayTxs = periodTransactions.filter(t => t.date === dateStr);
         dataPoints.push({
          label: i.toString(),
          value: dayTxs.reduce((s, t) => s + t.paymentAmount, 0),
          v1: dayTxs.reduce((s, t) => s + t.jarsDelivered, 0),
          v2: dayTxs.reduce((s, t) => s + t.thermosDelivered, 0)
        });
      }
    }
    // If Yearly: Show months
    else if (viewMode === 'yearly') {
       for(let i=0; i<12; i++) {
         const monthTxs = periodTransactions.filter(t => new Date(t.date).getMonth() === i);
         dataPoints.push({
           label: new Date(2000, i, 1).toLocaleString('default', { month: 'short' }),
           value: monthTxs.reduce((s, t) => s + t.paymentAmount, 0),
           v1: monthTxs.reduce((s, t) => s + t.jarsDelivered, 0),
           v2: monthTxs.reduce((s, t) => s + t.thermosDelivered, 0)
         });
       }
    }
    
    return dataPoints;
  }, [viewMode, selectedDate, periodTransactions, transactions, filterArea, customers]);

  // 4. Area Breakdown Data
  const areaStats = useMemo(() => {
    const stats: Record<string, { revenue: number, jars: number, thermos: number }> = {};
    
    periodTransactions.forEach(t => {
      const cust = customers.find(c => c.id === t.customerId);
      const areaName = cust?.area || 'Unknown';
      
      if (!stats[areaName]) stats[areaName] = { revenue: 0, jars: 0, thermos: 0 };
      
      stats[areaName].revenue += t.paymentAmount;
      stats[areaName].jars += t.jarsDelivered;
      stats[areaName].thermos += t.thermosDelivered;
    });

    return Object.entries(stats).sort((a, b) => b[1].revenue - a[1].revenue);
  }, [periodTransactions, customers]);


  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header & Controls */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <BarChart3 className="text-brand-600" /> Analytics Center
          </h1>
          <p className="text-sm text-gray-500">Analyze performance trends and area distribution.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
           {/* View Mode Toggle */}
           <div className="flex bg-gray-100 rounded-lg p-1">
            {(['daily', 'monthly', 'yearly'] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold uppercase transition-all ${
                  viewMode === mode 
                    ? 'bg-white text-brand-600 shadow-sm' 
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          {/* Date Navigator */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1">
            <button onClick={() => navigateDate(-1)} className="p-1.5 hover:bg-white hover:text-brand-600 rounded-md transition-colors"><ChevronLeft size={16}/></button>
            <div className="px-4 font-bold text-gray-700 min-w-[140px] text-center text-sm">{getPeriodLabel()}</div>
            <button onClick={() => navigateDate(1)} className="p-1.5 hover:bg-white hover:text-brand-600 rounded-md transition-colors"><ChevronRight size={16}/></button>
          </div>

          {/* Area Filter */}
          <div className="relative">
             <select 
               value={filterArea}
               onChange={(e) => setFilterArea(e.target.value)}
               className="pl-9 pr-4 py-2 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none cursor-pointer"
             >
               {areas.map(a => <option key={a} value={a}>{a}</option>)}
             </select>
             <Filter size={14} className="absolute left-3 top-3 text-gray-500 pointer-events-none"/>
          </div>
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-brand-600 to-brand-700 rounded-xl p-6 text-white shadow-lg shadow-brand-200">
           <div className="flex items-center gap-3 mb-2 opacity-90">
             <div className="p-2 bg-white/20 rounded-lg"><DollarSign size={20}/></div>
             <span className="text-sm font-medium">Revenue Collected</span>
           </div>
           <div className="text-3xl font-bold">₹{totals.revenue.toLocaleString()}</div>
           <p className="text-xs opacity-70 mt-1">For {getPeriodLabel()}</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
           <div className="flex items-center gap-3 mb-2 text-gray-500">
             <div className="p-2 bg-blue-50 text-blue-500 rounded-lg"><Droplets size={20}/></div>
             <span className="text-sm font-medium">Total Jars</span>
           </div>
           <div className="text-3xl font-bold text-gray-800">{totals.jars.toLocaleString()}</div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
           <div className="flex items-center gap-3 mb-2 text-gray-500">
             <div className="p-2 bg-orange-50 text-orange-500 rounded-lg"><Package size={20}/></div>
             <span className="text-sm font-medium">Total Thermos</span>
           </div>
           <div className="text-3xl font-bold text-gray-800">{totals.thermos.toLocaleString()}</div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80 flex flex-col">
           <h3 className="font-bold text-gray-700 mb-4 flex items-center gap-2">
             <TrendingUp size={18} className="text-green-500"/> Revenue Trend
           </h3>
           <div className="flex-1 w-full">
              <SimpleBarChart 
                data={chartData.map(d => ({ label: d.label, value: d.value }))} 
                colorClass="text-brand-500"
              />
           </div>
        </div>

        {/* Supply Volume Chart */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-80 flex flex-col">
           <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <Package size={18} className="text-orange-500"/> Supply Volume
              </h3>
              <div className="flex gap-4 text-xs font-medium">
                <div className="flex items-center gap-1 text-blue-600"><span className="w-2 h-2 rounded-full bg-blue-500"></span> Jars</div>
                <div className="flex items-center gap-1 text-orange-600"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Thermos</div>
              </div>
           </div>
           <div className="flex-1 w-full">
              <SimpleLineChart 
                 data={chartData.map(d => ({ label: d.label, v1: d.v1, v2: d.v2 }))}
              />
           </div>
        </div>
      </div>

      {/* Area Breakdown Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <h3 className="font-bold text-gray-700">Area Performance Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-white text-gray-500 border-b border-gray-100">
                <th className="px-6 py-3 font-medium">Area Name</th>
                <th className="px-6 py-3 font-medium text-center">Jars</th>
                <th className="px-6 py-3 font-medium text-center">Thermos</th>
                <th className="px-6 py-3 font-medium text-right">Revenue</th>
                <th className="px-6 py-3 font-medium text-right">% Contribution</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
               {areaStats.length === 0 ? (
                 <tr><td colSpan={5} className="p-8 text-center text-gray-400">No data for this period.</td></tr>
               ) : (
                 areaStats.map(([area, stat]) => (
                   <tr key={area} className="hover:bg-brand-50/30">
                     <td className="px-6 py-3 font-semibold text-gray-700">{area}</td>
                     <td className="px-6 py-3 text-center text-gray-600">{stat.jars}</td>
                     <td className="px-6 py-3 text-center text-gray-600">{stat.thermos}</td>
                     <td className="px-6 py-3 text-right font-medium text-green-700">₹{stat.revenue.toLocaleString()}</td>
                     <td className="px-6 py-3 text-right text-gray-400 text-xs">
                       {totals.revenue > 0 ? Math.round((stat.revenue / totals.revenue) * 100) : 0}%
                     </td>
                   </tr>
                 ))
               )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
