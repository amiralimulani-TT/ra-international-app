import { useState } from 'react';
import { AppState, PurchaseOrder, OrderItem } from '../types';
import { generateId, generateNumber, getToday, formatCurrency, formatDate } from '../utils/storage';
import AutoComplete from '../components/AutoComplete';
import PrintModal from '../components/PrintModal';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Purchases({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editPO, setEditPO] = useState<PurchaseOrder | null>(null);
  const [printPO, setPrintPO] = useState<PurchaseOrder | null>(null);
  const [form, setForm] = useState({ vendorId: '', date: getToday(), notes: '' });
  const [items, setItems] = useState<OrderItem[]>([]);

  const vendorItems = state.vendors.map(v => ({ id: v.id, label: v.name, sublabel: v.city }));

  const openNewForm = () => {
    setEditPO(null);
    setForm({ vendorId: '', date: getToday(), notes: '' });
    setItems([{ id: generateId(), description: '', quantity: 1, unitPrice: 0, amount: 0, delivered: 0, pending: 1, unit: 'pcs' }]);
    setShowForm(true);
  };

  const openEditForm = (po: PurchaseOrder) => {
    setEditPO(po);
    setForm({ vendorId: po.vendorId, date: po.date, notes: po.notes });
    setItems([...po.items]);
    setShowForm(true);
  };

  const addItem = () => setItems([...items, { id: generateId(), description: '', quantity: 1, unitPrice: 0, amount: 0, delivered: 0, pending: 1, unit: 'pcs' }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      updated[idx].amount = updated[idx].quantity * updated[idx].unitPrice;
      updated[idx].pending = updated[idx].quantity - updated[idx].delivered;
    }
    setItems(updated);
  };

  const selectMasterItem = (idx: number, itemId: string) => {
    const mi = state.masterItems.find(m => m.id === itemId);
    if (mi) {
      const updated = [...items];
      updated[idx] = { ...updated[idx], itemId: mi.id, description: mi.name, unitPrice: mi.defaultRate, unit: mi.unit, amount: updated[idx].quantity * mi.defaultRate };
      setItems(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const vendor = state.vendors.find(v => v.id === form.vendorId);
    if (!vendor || items.length === 0) return;

    const validItems = items.filter(i => i.description);
    const total = validItems.reduce((s, i) => s + i.amount, 0);

    if (editPO) {
      updateState({
        purchases: state.purchases.map(po => po.id === editPO.id ? {
          ...po,
          vendorId: form.vendorId,
          vendorName: vendor.name,
          date: form.date,
          items: validItems,
          totalAmount: total,
          notes: form.notes,
        } : po)
      });
    } else {
      const newPO: PurchaseOrder = {
        id: generateId(),
        poNumber: generateNumber('PO', state.purchases.length),
        vendorId: form.vendorId,
        vendorName: vendor.name,
        date: form.date,
        items: validItems,
        totalAmount: total,
        status: 'pending',
        notes: form.notes,
      };
      updateState({ purchases: [...state.purchases, newPO] });
    }

    setShowForm(false);
    setEditPO(null);
    setForm({ vendorId: '', date: getToday(), notes: '' });
    setItems([]);
  };

  const markReceived = (id: string) => {
    updateState({ purchases: state.purchases.map(po => po.id === id ? { ...po, status: 'received' as const } : po) });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this purchase order?')) {
      updateState({ purchases: state.purchases.filter(po => po.id !== id) });
    }
  };

  const getVendorInfo = (po: PurchaseOrder) => state.vendors.find(v => v.id === po.vendorId);
  const getPOBalance = (poId: string) => {
    const po = state.purchases.find(p => p.id === poId);
    if (!po) return 0;
    const paid = state.vendorPayments.filter(vp => vp.poId === poId).reduce((s, vp) => s + vp.amount, 0);
    return po.totalAmount - paid;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🛒 Purchases</h1>
        <button onClick={openNewForm} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          + New Purchase
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">{editPO ? '✏️ Edit Purchase Order' : '📝 New Purchase Order'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <AutoComplete items={vendorItems} value={form.vendorId} onChange={id => setForm({...form, vendorId: id})} placeholder="Search & select vendor *" required />
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-600 mb-2">Items (editable)</h4>
              {items.map((item, idx) => (
                <div key={item.id || idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  {state.masterItems.length > 0 ? (
                    <select value={item.itemId || ''} onChange={e => selectMasterItem(idx, e.target.value)} className="col-span-2 border rounded-lg px-2 py-2 text-sm outline-none">
                      <option value="">-- Item --</option>
                      {state.masterItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                    </select>
                  ) : <div className="col-span-2"></div>}
                  <input placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="col-span-3 border rounded-lg px-3 py-2 text-sm outline-none" />
                  <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="col-span-1 border rounded-lg px-2 py-2 text-sm outline-none" />
                  <input type="number" min="0" placeholder="Rate" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="col-span-2 border rounded-lg px-2 py-2 text-sm outline-none" />
                  <input placeholder="Unit" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="col-span-1 border rounded-lg px-2 py-2 text-sm outline-none" />
                  <span className="col-span-2 text-sm font-medium text-right">{formatCurrency(item.amount)}</span>
                  <button type="button" onClick={() => removeItem(idx)} className="col-span-1 text-red-500 text-center">✕</button>
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-emerald-600 text-sm font-medium mt-2">+ Add Item</button>
            </div>

            <div className="text-right mb-4 p-3 bg-gray-50 rounded-lg">
              <span className="text-lg font-bold">Total: {formatCurrency(items.reduce((s, i) => s + i.amount, 0))}</span>
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
                {editPO ? 'Update' : 'Save'} Purchase
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditPO(null); }} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Print Modal */}
      {printPO && (
        <PrintModal
          data={{
            type: 'purchase',
            number: printPO.poNumber,
            date: printPO.date,
            partyName: printPO.vendorName,
            partyContact: getVendorInfo(printPO)?.contact,
            partyAddress: getVendorInfo(printPO)?.address,
            partyCity: getVendorInfo(printPO)?.city,
            items: printPO.items.map(i => ({
              description: i.description,
              quantity: i.quantity,
              unit: i.unit,
              rate: i.unitPrice,
              amount: i.amount,
            })),
            totalAmount: printPO.totalAmount,
            notes: printPO.notes,
          }}
          onClose={() => setPrintPO(null)}
        />
      )}

      {/* List */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">PO #</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Vendor</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Balance</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.purchases.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-400">No purchase orders yet</td></tr>
              ) : [...state.purchases].reverse().map(po => (
                <tr key={po.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-blue-700">{po.poNumber}</td>
                  <td className="px-4 py-3">{po.vendorName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(po.date)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(po.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-orange-600 font-semibold">{formatCurrency(getPOBalance(po.id))}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${po.status === 'received' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{po.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => setPrintPO(po)} className="text-blue-600 text-sm" title="Print">🖨️</button>
                      <button onClick={() => openEditForm(po)} className="text-amber-600 text-sm" title="Edit">✏️</button>
                      {po.status !== 'received' && (
                        <button onClick={() => markReceived(po.id)} className="text-emerald-600 text-sm" title="Mark Received">✓</button>
                      )}
                      <button onClick={() => handleDelete(po.id)} className="text-red-500 text-sm" title="Delete">🗑️</button>
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
