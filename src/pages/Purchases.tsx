import { useState } from 'react';
import { AppState, PurchaseOrder, OrderItem } from '../types';
import { generateId, generateOrderNumber, getToday, formatCurrency, formatDate } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Purchases({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ vendorId: '', date: getToday(), notes: '' });
  const [items, setItems] = useState<{ description: string; quantity: number; unitPrice: number }[]>([{ description: '', quantity: 1, unitPrice: 0 }]);

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: string | number) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = state.vendors.find(v => v.id === form.vendorId);
    if (!vendor) return;

    const orderItems: OrderItem[] = items.filter(i => i.description).map(i => ({
      id: generateId(),
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      amount: i.quantity * i.unitPrice,
      delivered: 0,
      pending: i.quantity,
    }));

    const newPO: PurchaseOrder = {
      id: generateId(),
      poNumber: generateOrderNumber('PO', state.purchases.length),
      vendorId: form.vendorId,
      vendorName: vendor.name,
      date: form.date,
      items: orderItems,
      totalAmount: orderItems.reduce((s, i) => s + i.amount, 0),
      status: 'pending',
      notes: form.notes,
    };

    updateState({ purchases: [...state.purchases, newPO] });
    setForm({ vendorId: '', date: getToday(), notes: '' });
    setItems([{ description: '', quantity: 1, unitPrice: 0 }]);
    setShowForm(false);
  };

  const markReceived = (id: string) => {
    updateState({
      purchases: state.purchases.map(po => po.id === id ? { ...po, status: 'received' as const } : po)
    });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this purchase order?')) {
      updateState({ purchases: state.purchases.filter(po => po.id !== id) });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🛒 Purchases (Vendor Orders)</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
          + New Purchase
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">New Purchase Order</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <select required value={form.vendorId} onChange={e => setForm({...form, vendorId: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none">
                <option value="">Select Vendor *</option>
                {state.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
              </select>
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
              <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border rounded-lg px-4 py-2 focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-600 mb-2">Items</h4>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  <input placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="col-span-5 border rounded-lg px-3 py-2 text-sm outline-none" />
                  <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="col-span-2 border rounded-lg px-3 py-2 text-sm outline-none" />
                  <input type="number" min="0" placeholder="Rate" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="col-span-2 border rounded-lg px-3 py-2 text-sm outline-none" />
                  <span className="col-span-2 text-sm font-medium text-right">{formatCurrency(item.quantity * item.unitPrice)}</span>
                  <button type="button" onClick={() => removeItem(idx)} className="col-span-1 text-red-500 text-center">✕</button>
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-emerald-600 text-sm font-medium mt-2">+ Add Item</button>
            </div>

            <div className="text-right mb-4">
              <span className="text-lg font-bold">Total: {formatCurrency(items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}</span>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Save Purchase</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">PO #</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Vendor</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.purchases.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No purchase orders yet</td></tr>
              ) : [...state.purchases].reverse().map(po => (
                <tr key={po.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-700">{po.poNumber}</td>
                  <td className="px-4 py-3">{po.vendorName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(po.date)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(po.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      po.status === 'received' ? 'bg-green-100 text-green-700' :
                      po.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{po.status}</span>
                  </td>
                  <td className="px-4 py-3 flex gap-2">
                    {po.status !== 'received' && (
                      <button onClick={() => markReceived(po.id)} className="text-emerald-600 hover:text-emerald-800 text-sm">Mark Received</button>
                    )}
                    <button onClick={() => handleDelete(po.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
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
