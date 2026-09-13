import { useState } from 'react';
import { AppState, Customer } from '../types';
import { generateId, getToday, formatCurrency } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Customers({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editCustomer, setEditCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({ name: '', contact: '', address: '', city: '', ntnNumber: '', gstNumber: '', creditLimit: 0 });
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const openNewForm = () => {
    setEditCustomer(null);
    setForm({ name: '', contact: '', address: '', city: '', ntnNumber: '', gstNumber: '', creditLimit: 0 });
    setShowForm(true);
  };

  const openEditForm = (customer: Customer) => {
    setEditCustomer(customer);
    setForm({
      name: customer.name,
      contact: customer.contact,
      address: customer.address,
      city: customer.city,
      ntnNumber: customer.ntnNumber || '',
      gstNumber: customer.gstNumber || '',
      creditLimit: customer.creditLimit || 0,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editCustomer) {
      // Update existing customer
      updateState({
        customers: state.customers.map(c => 
          c.id === editCustomer.id ? { ...c, ...form } : c
        )
      });
    } else {
      // Create new customer
      const newCustomer: Customer = { id: generateId(), ...form, createdAt: getToday() };
      updateState({ customers: [...state.customers, newCustomer] });
    }
    
    setForm({ name: '', contact: '', address: '', city: '', ntnNumber: '', gstNumber: '', creditLimit: 0 });
    setShowForm(false);
    setEditCustomer(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this customer?')) {
      updateState({ customers: state.customers.filter(c => c.id !== id) });
    }
  };

  const getCustomerBalance = (customerId: string) => {
    return state.invoices
      .filter(inv => inv.customerId === customerId)
      .reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
  };

  const filtered = state.customers.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
            👥 Customers
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your customer database</p>
        </div>
        <button 
          onClick={openNewForm} 
          className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
        >
          + Add Customer
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100 animate-in slide-in-from-top">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">
            {editCustomer ? '✏️ Edit Customer' : '✨ New Customer'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Customer Name *</label>
              <input 
                required 
                placeholder="Enter name" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Contact / Phone</label>
              <input 
                placeholder="Phone number" 
                value={form.contact} 
                onChange={e => setForm({...form, contact: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">NTN Number</label>
              <input 
                placeholder="NTN" 
                value={form.ntnNumber} 
                onChange={e => setForm({...form, ntnNumber: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">GST Number</label>
              <input 
                placeholder="GST" 
                value={form.gstNumber} 
                onChange={e => setForm({...form, gstNumber: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Address</label>
              <input 
                placeholder="Street address" 
                value={form.address} 
                onChange={e => setForm({...form, address: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
              <input 
                placeholder="City name" 
                value={form.city} 
                onChange={e => setForm({...form, city: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Credit Limit</label>
              <input 
                type="number" 
                placeholder="0" 
                value={form.creditLimit || ''} 
                onChange={e => setForm({...form, creditLimit: parseFloat(e.target.value) || 0})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
              <button 
                type="submit" 
                className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
              >
                {editCustomer ? '✓ Update Customer' : '✓ Save Customer'}
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditCustomer(null); }} 
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-gray-800">{selectedCustomer.name}</h3>
              <button 
                onClick={() => setSelectedCustomer(null)} 
                className="text-gray-400 hover:text-gray-600 text-2xl transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[100px]">Contact:</span>
                <span className="text-gray-800">{selectedCustomer.contact || '-'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[100px]">NTN:</span>
                <span className="text-gray-800">{selectedCustomer.ntnNumber || '-'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[100px]">GST:</span>
                <span className="text-gray-800">{selectedCustomer.gstNumber || '-'}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[100px]">Address:</span>
                <span className="text-gray-800">{selectedCustomer.address || '-'}, {selectedCustomer.city}</span>
              </div>
              <div className="flex items-start gap-2">
                <span className="text-gray-500 font-medium min-w-[100px]">Credit Limit:</span>
                <span className="text-gray-800 font-semibold">{formatCurrency(selectedCustomer.creditLimit || 0)}</span>
              </div>
              <hr className="my-4 border-gray-200" />
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-lg p-4 border border-red-100">
                <p className="text-sm text-gray-600 mb-1">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(getCustomerBalance(selectedCustomer.id))}</p>
              </div>
              <hr className="my-4 border-gray-200" />
              <h4 className="font-semibold text-gray-800">Recent Invoices:</h4>
              <div className="space-y-2">
                {state.invoices.filter(inv => inv.customerId === selectedCustomer.id).slice(-5).reverse().map(inv => (
                  <div key={inv.id} className="flex justify-between py-2 px-3 bg-gray-50 rounded-lg text-xs">
                    <span className="font-medium text-gray-700">{inv.invoiceNumber}</span>
                    <span className="text-gray-500">{inv.date}</span>
                    <span className={inv.status === 'paid' ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {formatCurrency(inv.totalAmount - inv.paidAmount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input 
          placeholder="🔍 Search customers by name or city..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="w-full sm:w-96 border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all" 
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <tr>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Name</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Contact</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">City</th>
                <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">NTN</th>
                <th className="text-right px-6 py-4 text-sm font-semibold text-gray-700">Balance</th>
                <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-2">👥</div>
                    <p>No customers found</p>
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800 cursor-pointer hover:text-emerald-600 transition-colors" onClick={() => setSelectedCustomer(c)}>
                    {c.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.contact || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.city || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{c.ntnNumber || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${getCustomerBalance(c.id) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(getCustomerBalance(c.id))}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => openEditForm(c)} 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded transition-all"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(c.id)} 
                        className="text-red-600 hover:text-red-800 text-sm font-medium hover:bg-red-50 px-2 py-1 rounded transition-all"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
