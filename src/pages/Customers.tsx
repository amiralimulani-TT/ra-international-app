import { useState } from 'react';
import { AppState, Customer } from '../types';
import { generateId, getToday, formatCurrency } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Customers({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', address: '', city: '', ntncn: '', creditLimit: 0 });
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = { id: generateId(), ...form, createdAt: getToday() };
    updateState({ customers: [...state.customers, newCustomer] });
    setForm({ name: '', contact: '', address: '', city: '', ntncn: '', creditLimit: 0 });
    setShowForm(false);
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
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">👥 Customers</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
          + Add Customer
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">New Customer</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input required placeholder="Customer Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            <input placeholder="Contact / Phone" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            <input placeholder="NTN / CNIC" value={form.ntncn} onChange={e => setForm({...form, ntncn: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            <input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            <input placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            <input type="number" placeholder="Credit Limit" value={form.creditLimit || ''} onChange={e => setForm({...form, creditLimit: parseFloat(e.target.value) || 0})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Customer Detail Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedCustomer(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{selectedCustomer.name}</h3>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="space-y-2 text-sm">
              <p><strong>Contact:</strong> {selectedCustomer.contact || '-'}</p>
              <p><strong>NTN/CNIC:</strong> {selectedCustomer.ntncn || '-'}</p>
              <p><strong>Address:</strong> {selectedCustomer.address || '-'}, {selectedCustomer.city}</p>
              <p><strong>Credit Limit:</strong> {formatCurrency(selectedCustomer.creditLimit)}</p>
              <hr className="my-3" />
              <p className="font-bold text-red-600">Outstanding Balance: {formatCurrency(getCustomerBalance(selectedCustomer.id))}</p>
              <hr className="my-3" />
              <h4 className="font-semibold">Recent Invoices:</h4>
              {state.invoices.filter(inv => inv.customerId === selectedCustomer.id).slice(-5).reverse().map(inv => (
                <div key={inv.id} className="flex justify-between py-1 border-b text-xs">
                  <span>{inv.invoiceNumber} ({inv.date})</span>
                  <span className={inv.status === 'paid' ? 'text-green-600' : 'text-red-600'}>{formatCurrency(inv.totalAmount - inv.paidAmount)} remaining</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="mb-4">
        <input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64 border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Contact</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">City</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Balance</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No customers found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium cursor-pointer text-emerald-700" onClick={() => setSelectedCustomer(c)}>{c.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.contact || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.city || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${getCustomerBalance(c.id) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(getCustomerBalance(c.id))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
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
