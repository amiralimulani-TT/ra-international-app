import { useState, useEffect } from 'react';
import { AppState } from './types';
import { loadState, saveState } from './utils/storage';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Customers from './pages/Customers';
import Vendors from './pages/Vendors';
import Items from './pages/Items';
import Orders from './pages/Orders';
import Purchases from './pages/Purchases';
import Inventory from './pages/Inventory';
import Deliveries from './pages/Deliveries';
import Invoices from './pages/Invoices';
import Payments from './pages/Payments';
import Expenses from './pages/Expenses';
import CompanyProfile from './pages/CompanyProfile';
import Reports from './pages/Reports';
import GoogleSheetsGuide from './pages/GoogleSheetsGuide';
import Settings from './pages/Settings';

export type Page = 'dashboard' | 'customers' | 'vendors' | 'items' | 'orders' | 'purchases' | 'deliveries' | 'invoices' | 'payments' | 'expenses' | 'inventory' | 'company' | 'reports' | 'guide' | 'settings';

function App() {
  const [state, setState] = useState<AppState>(loadState());
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard': return <Dashboard state={state} />;
      case 'customers': return <Customers state={state} updateState={updateState} />;
      case 'vendors': return <Vendors state={state} updateState={updateState} />;
      case 'items': return <Items state={state} updateState={updateState} />;
      case 'orders': return <Orders state={state} updateState={updateState} />;
      case 'purchases': return <Purchases state={state} updateState={updateState} />;
      case 'deliveries': return <Deliveries state={state} updateState={updateState} />;
      case 'invoices': return <Invoices state={state} updateState={updateState} />;
      case 'payments': return <Payments state={state} updateState={updateState} />;
      case 'expenses': return <Expenses state={state} updateState={updateState} />;
      case 'inventory': return <Inventory state={state} />;
      case 'company': return <CompanyProfile state={state} updateState={updateState} />;
      case 'reports': return <Reports state={state} />;
      case 'guide': return <GoogleSheetsGuide state={state} />;
      case 'settings': return <Settings state={state} updateState={updateState} />;
      default: return <Dashboard state={state} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        isOpen={sidebarOpen}
        setIsOpen={setSidebarOpen}
      />
      <div className="flex-1 lg:ml-64">
        <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-emerald-700">RA International</h1>
          <div className="w-10"></div>
        </div>
        <main className="p-4 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
}

export default App;
