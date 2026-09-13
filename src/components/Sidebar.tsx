import { Page } from '../App';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const menuItems: { page: Page; label: string; icon: string }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: '📊' },
  { page: 'customers', label: 'Customers', icon: '👥' },
  { page: 'vendors', label: 'Vendors', icon: '🏭' },
  { page: 'items', label: 'Items', icon: '📦' },
  { page: 'orders', label: 'Orders', icon: '📋' },
  { page: 'purchases', label: 'Purchases', icon: '🛒' },
  { page: 'deliveries', label: 'Deliveries', icon: '🚚' },
  { page: 'invoices', label: 'Invoices', icon: '🧾' },
  { page: 'payments', label: 'Payments', icon: '💰' },
  { page: 'expenses', label: 'Expenses', icon: '💸' },
  { page: 'inventory', label: 'Inventory', icon: '📊' },
  { page: 'company', label: 'Company', icon: '🏢' },
  { page: 'reports', label: 'Reports', icon: '📈' },
  { page: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ currentPage, setCurrentPage, isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 text-white z-50 transform transition-transform duration-300 shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-xl flex items-center justify-center text-xl font-bold shadow-lg">
              RA
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">RA International</h1>
              <p className="text-slate-400 text-xs">Business Accounts</p>
            </div>
          </div>
        </div>
        
        {/* Navigation */}
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-120px)] scrollbar-thin">
          {menuItems.map(item => (
            <button
              key={item.page}
              onClick={() => { setCurrentPage(item.page); setIsOpen(false); }}
              className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center gap-3 transition-all duration-200 group ${
                currentPage === item.page
                  ? 'bg-gradient-to-r from-emerald-500/20 to-blue-500/20 text-white font-semibold shadow-lg border border-emerald-500/30'
                  : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
              }`}
            >
              <span className="text-lg group-hover:scale-110 transition-transform">{item.icon}</span>
              <span className="text-sm">{item.label}</span>
              {currentPage === item.page && (
                <div className="ml-auto w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700/50 bg-slate-900/50">
          <p className="text-xs text-slate-500 text-center">v2.0 • Modern UI</p>
        </div>
      </aside>
    </>
  );
}
