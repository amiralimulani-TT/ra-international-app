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
  { page: 'orders', label: 'Orders', icon: '📋' },
  { page: 'purchases', label: 'Purchases', icon: '🛒' },
  { page: 'deliveries', label: 'Deliveries', icon: '🚚' },
  { page: 'invoices', label: 'Invoices', icon: '🧾' },
  { page: 'payments', label: 'Payments', icon: '💰' },
  { page: 'expenses', label: 'Expenses', icon: '💸' },
  { page: 'reports', label: 'Reports', icon: '📈' },
  { page: 'settings', label: 'Settings', icon: '⚙️' },
];

export default function Sidebar({ currentPage, setCurrentPage, isOpen, setIsOpen }: SidebarProps) {
  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setIsOpen(false)} />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-gradient-to-b from-emerald-800 to-emerald-900 text-white z-50 transform transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 border-b border-emerald-700">
          <h1 className="text-xl font-bold">🏢 RA International</h1>
          <p className="text-emerald-300 text-sm mt-1">Business Accounts</p>
        </div>
        
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100%-120px)]">
          {menuItems.map(item => (
            <button
              key={item.page}
              onClick={() => { setCurrentPage(item.page); setIsOpen(false); }}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-all ${
                currentPage === item.page
                  ? 'bg-white/20 text-white font-semibold shadow-lg'
                  : 'text-emerald-100 hover:bg-white/10'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>
    </>
  );
}
