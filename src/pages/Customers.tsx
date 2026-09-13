import { useState } from 'react';
import { AppState, Customer } from '../types';
import { generateId, getToday } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Customers({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', address: '', city: '' });
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newCustomer: Customer = {
      id: generateId(),
      ...form,
      createdAt: getToday(),
    };
    updateState({ customers: [...state.customers, newCustomer] });
    setForm({ name: '', contact: '', address: '', city: '' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this customer?')) {
      updateState({ customers: state.customers.filter(c => c.id !== id) });
    }
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
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input required placeholder="Customer Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            <input placeholder="Contact / Phone" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            <input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            <input placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            <div className="sm:col-span-2 flex gap-3">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </form>
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
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Address</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No customers found</td></tr>
              ) : filtered.map(c => (
                <tr key={c.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.contact || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.city || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{c.address || '-'}</td>
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
