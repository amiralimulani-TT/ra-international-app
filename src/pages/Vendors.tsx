import { useState } from 'react';
import { AppState, Vendor } from '../types';
import { generateId, getToday, formatCurrency } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Vendors({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', contact: '', address: '', city: '', ntncn: '' });
  const [search, setSearch] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newVendor: Vendor = { id: generateId(), ...form, createdAt: getToday() };
    updateState({ vendors: [...state.vendors, newVendor] });
    setForm({ name: '', contact: '', address: '', city: '', ntncn: '' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this vendor?')) {
      updateState({ vendors: state.vendors.filter(v => v.id !== id) });
    }
  };

  const getVendorBalance = (vendorId: string) => {
    const po = state.purchases.filter(p => p.vendorId === vendorId);
    return po.reduce((sum, p) => {
      const paid = state.vendorPayments.filter(vp => vp.poId === p.id).reduce((s, vp) => s + vp.amount, 0);
      return sum + (p.totalAmount - paid);
    }, 0);
  };

  const filtered = state.vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🏭 Vendors</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
          + Add Vendor
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">New Vendor</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input required placeholder="Vendor Name *" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            <input placeholder="Contact / Phone" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            <input placeholder="NTN / CNIC" value={form.ntncn} onChange={e => setForm({...form, ntncn: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            <input placeholder="Address" value={form.address} onChange={e => setForm({...form, address: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            <input placeholder="City" value={form.city} onChange={e => setForm({...form, city: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            <div className="flex gap-3">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-4">
        <input placeholder="Search vendors..." value={search} onChange={e => setSearch(e.target.value)} className="w-full sm:w-64 border rounded-lg px-4 py-2 outline-none" />
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
                <tr><td colSpan={5} className="text-center py-8 text-gray-400">No vendors found</td></tr>
              ) : filtered.map(v => (
                <tr key={v.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{v.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{v.contact || '-'}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{v.city || '-'}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-semibold ${getVendorBalance(v.id) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(getVendorBalance(v.id))}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(v.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
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
