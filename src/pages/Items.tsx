import { useState } from 'react';
import { AppState, MasterItem } from '../types';
import { generateId, getToday, formatCurrency } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

const units = ['pcs', 'kg', 'box', 'set', 'meter', 'liter', 'pack', 'roll', 'pair', 'dozen'];
const categories = ['Electronics', 'Hardware', 'Software', 'Services', 'Raw Material', 'Finished Goods', 'Packaging', 'Other'];

export default function Items({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', unit: 'pcs', defaultRate: 0, category: '' });
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newItem: MasterItem = { id: generateId(), ...form, createdAt: getToday() };
    updateState({ masterItems: [...state.masterItems, newItem] });
    setForm({ name: '', description: '', unit: 'pcs', defaultRate: 0, category: '' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this item?')) {
      updateState({ masterItems: state.masterItems.filter(i => i.id !== id) });
    }
  };

  const filtered = state.masterItems.filter(i =>
    i.name.toLowerCase().includes(search.toLowerCase()) ||
    i.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📦 Master Items</h1>
          <p className="text-sm text-gray-500">Items linked across Orders, Purchases, Deliveries & Invoices</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          + Add Item
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">New Master Item</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input required placeholder="Item Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
              <option value="">Select Category</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
              {units.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
            <input type="number" min="0" placeholder="Default Rate (Rs.)" value={form.defaultRate || ''} onChange={e => setForm({...form, defaultRate: parseFloat(e.target.value) || 0})} className="border rounded-lg px-4 py-2 outline-none" />
            <div className="flex gap-3">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64 border rounded-lg px-4 py-2 outline-none" />
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Name</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Unit</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Default Rate</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No items yet. Add items to link them across orders, deliveries & invoices!</td></tr>
              ) : filtered.map(item => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.name}</p>
                    {item.description && <p className="text-xs text-gray-500">{item.description}</p>}
                  </td>
                  <td className="px-4 py-3"><span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">{item.category || '-'}</span></td>
                  <td className="px-4 py-3 text-sm">{item.unit}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.defaultRate)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(item.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
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
