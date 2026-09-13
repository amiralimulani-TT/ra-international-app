import { useState } from 'react';
import { AppState, Vendor } from '../types';
import { generateId, getToday, formatCurrency } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Vendors({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editVendor, setEditVendor] = useState<Vendor | null>(null);
  const [form, setForm] = useState({ name: '', contact: '', address: '', city: '', ntnNumber: '', gstNumber: '' });
  const [search, setSearch] = useState('');

  const openNewForm = () => {
    setEditVendor(null);
    setForm({ name: '', contact: '', address: '', city: '', ntnNumber: '', gstNumber: '' });
    setShowForm(true);
  };

  const openEditForm = (vendor: Vendor) => {
    setEditVendor(vendor);
    setForm({
      name: vendor.name,
      contact: vendor.contact,
      address: vendor.address,
      city: vendor.city,
      ntnNumber: vendor.ntnNumber || '',
      gstNumber: vendor.gstNumber || '',
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editVendor) {
      updateState({
        vendors: state.vendors.map(v => 
          v.id === editVendor.id ? { ...v, ...form } : v
        )
      });
    } else {
      const newVendor: Vendor = { id: generateId(), ...form, createdAt: getToday() };
      updateState({ vendors: [...state.vendors, newVendor] });
    }
    
    setForm({ name: '', contact: '', address: '', city: '', ntnNumber: '', gstNumber: '' });
    setShowForm(false);
    setEditVendor(null);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this vendor?')) {
      updateState({ vendors: state.vendors.filter(v => v.id !== id) });
    }
  };

  const getVendorBalance = (vendorId: string) => {
    const pos = state.purchases.filter(p => p.vendorId === vendorId);
    return pos.reduce((sum, p) => {
      const paid = state.vendorPayments.filter(vp => vp.poId === p.id).reduce((s, vp) => s + vp.amount, 0);
      return sum + (p.totalAmount - paid);
    }, 0);
  };

  const filtered = state.vendors.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.city.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            🏭 Vendors
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage your vendor database</p>
        </div>
        <button 
          onClick={openNewForm} 
          className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
        >
          + Add Vendor
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h3 className="font-semibold text-lg mb-4 text-gray-800">
            {editVendor ? '✏️ Edit Vendor' : '✨ New Vendor'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Vendor Name *</label>
              <input 
                required 
                placeholder="Enter name" 
                value={form.name} 
                onChange={e => setForm({...form, name: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Contact / Phone</label>
              <input 
                placeholder="Phone number" 
                value={form.contact} 
                onChange={e => setForm({...form, contact: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">NTN Number</label>
              <input 
                placeholder="NTN" 
                value={form.ntnNumber} 
                onChange={e => setForm({...form, ntnNumber: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">GST Number</label>
              <input 
                placeholder="GST" 
                value={form.gstNumber} 
                onChange={e => setForm({...form, gstNumber: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Address</label>
              <input 
                placeholder="Street address" 
                value={form.address} 
                onChange={e => setForm({...form, address: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
              <input 
                placeholder="City name" 
                value={form.city} 
                onChange={e => setForm({...form, city: e.target.value})} 
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
              />
            </div>
            <div className="sm:col-span-2 lg:col-span-3 flex gap-3 pt-2">
              <button 
                type="submit" 
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
              >
                {editVendor ? '✓ Update Vendor' : '✓ Save Vendor'}
              </button>
              <button 
                type="button" 
                onClick={() => { setShowForm(false); setEditVendor(null); }} 
                className="bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg hover:bg-gray-200 transition-all duration-200 font-medium"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <input 
          placeholder="🔍 Search vendors by name or city..." 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="w-full sm:w-96 border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all" 
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
                    <div className="text-4xl mb-2">🏭</div>
                    <p>No vendors found</p>
                  </td>
                </tr>
              ) : filtered.map(v => (
                <tr key={v.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-medium text-gray-800">{v.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{v.contact || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{v.city || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{v.ntnNumber || '-'}</td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${getVendorBalance(v.id) > 0 ? 'text-orange-600' : 'text-green-600'}`}>
                      {formatCurrency(getVendorBalance(v.id))}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2 justify-center">
                      <button 
                        onClick={() => openEditForm(v)} 
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:bg-blue-50 px-2 py-1 rounded transition-all"
                      >
                        ✏️ Edit
                      </button>
                      <button 
                        onClick={() => handleDelete(v.id)} 
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
