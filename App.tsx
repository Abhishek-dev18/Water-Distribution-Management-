
import React, { useState } from 'react';
import { Users, ClipboardList, Receipt, LayoutDashboard, Menu, MapPin, Settings as SettingsIcon, FileSpreadsheet, BarChart3, LogOut, Wallet } from 'lucide-react';
import CustomerManager from './components/CustomerManager';
import SupplySheet from './components/SupplySheet';
import Billing from './components/Billing';
import Dashboard from './components/Dashboard';
import AreaManager from './components/AreaManager';
import Settings from './components/Settings';
import SupplyChart from './components/SupplyChart';
import Analytics from './components/Analytics';
import Login from './components/Login';
import PaymentCollection from './components/PaymentCollection';

// Simple Router setup
type Page = 'dashboard' | 'analytics' | 'supply' | 'billing' | 'payments' | 'customers' | 'areas' | 'settings' | 'chart';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('dashboard');
  };

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  const NavItem = ({ page, icon: Icon, label }: { page: Page, icon: any, label: string }) => (
    <button
      onClick={() => { setCurrentPage(page); setSidebarOpen(false); }}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        currentPage === page ? 'bg-brand-600 text-white shadow-md' : 'text-slate-600 hover:bg-brand-50 hover:text-brand-600'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-800">
      {/* Sidebar - Mobile Responsive */}
      <div className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out shadow-lg md:shadow-none
        md:translate-x-0 md:static print:hidden
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-16 flex items-center px-6 border-b border-gray-100 bg-white">
          <span className="text-xl font-bold text-brand-600 flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">A</div>
            AquaFlow
          </span>
        </div>
        <div className="p-4 space-y-1 flex flex-col h-[calc(100%-4rem)] overflow-y-auto">
          <NavItem page="dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem page="analytics" icon={BarChart3} label="Analytics" />
          <NavItem page="supply" icon={ClipboardList} label="Daily Supply" />
          <NavItem page="chart" icon={FileSpreadsheet} label="Supply Chart" />
          <NavItem page="billing" icon={Receipt} label="Billing" />
          <NavItem page="payments" icon={Wallet} label="Payments" />
          
          <div className="pt-4 pb-2 px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</div>
          <NavItem page="customers" icon={Users} label="Customers" />
          <NavItem page="areas" icon={MapPin} label="Areas" />
          
          <div className="mt-auto pt-4 border-t border-gray-100 space-y-2">
             <NavItem page="settings" icon={SettingsIcon} label="Settings" />
             <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-red-500 hover:bg-red-50"
            >
              <LogOut size={20} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden print:h-auto print:overflow-visible">
        {/* Mobile Header */}
        <header className="h-16 bg-white border-b flex items-center px-4 md:hidden print:hidden shrink-0">
          <button onClick={() => setSidebarOpen(true)} className="text-gray-600 p-2 hover:bg-gray-100 rounded">
            <Menu size={24} />
          </button>
          <span className="ml-4 font-bold text-brand-600 text-lg">AquaFlow</span>
        </header>

        <main className="flex-1 overflow-auto bg-slate-50 print:overflow-visible print:h-auto">
          {currentPage === 'dashboard' && <Dashboard />}
          {currentPage === 'analytics' && <Analytics />}
          {currentPage === 'customers' && <CustomerManager />}
          {currentPage === 'areas' && <AreaManager />}
          {currentPage === 'supply' && <SupplySheet />}
          {currentPage === 'chart' && <SupplyChart />}
          {currentPage === 'billing' && <Billing />}
          {currentPage === 'payments' && <PaymentCollection />}
          {currentPage === 'settings' && <Settings />}
        </main>
      </div>
    </div>
  );
};

export default App;
