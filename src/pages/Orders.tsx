import { useState } from 'react';
import { AppState, CustomerOrder, OrderItem } from '../types';
import { generateId, generateNumber, getToday, formatCurrency, formatDate } from '../utils/storage';
import AutoComplete from '../components/AutoComplete';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Orders({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<CustomerOrder | null>(null);
  const [form, setForm] = useState({ customerId: '', date: getToday(), notes: '' });
  const [items, setItems] = useState<{ itemId?: string; description: string; quantity: number; unitPrice: number; unit: string }[]>([{ description: '', quantity: 1, unitPrice: 0, unit: 'pcs' }]);

  const customerItems = state.customers.map(c => ({ id: c.id, label: c.name, sublabel: c.city }));

  const addItem = () => setItems([...items, { description: '', quantity: 1, unitPrice: 0, unit: 'pcs' }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    setItems(updated);
  };

  const selectMasterItem = (idx: number, itemId: string) => {
    const mi = state.masterItems.find(m => m.id === itemId);
    if (mi) {
      const updated = [...items];
      updated[idx] = { ...updated[idx], itemId: mi.id, description: mi.name, unitPrice: mi.defaultRate, unit: mi.unit };
      setItems(updated);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = state.customers.find(c => c.id === form.customerId);
    if (!customer) return;

    const orderItems: OrderItem[] = items.filter(i => i.description).map(i => ({
      id: generateId(),
      itemId: i.itemId,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      amount: i.quantity * i.unitPrice,
      delivered: 0,
      pending: i.quantity,
      unit: i.unit,
    }));

    const newOrder: CustomerOrder = {
      id: generateId(),
      orderNumber: generateNumber('ORD', state.orders.length),
      customerId: form.customerId,
      customerName: customer.name,
      date: form.date,
      items: orderItems,
      totalAmount: orderItems.reduce((s, i) => s + i.amount, 0),
      status: 'pending',
      notes: form.notes,
    };

    updateState({ orders: [...state.orders, newOrder] });
    setForm({ customerId: '', date: getToday(), notes: '' });
    setItems([{ description: '', quantity: 1, unitPrice: 0, unit: 'pcs' }]);
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this order?')) {
      updateState({ orders: state.orders.filter(o => o.id !== id) });
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">📋 Customer Orders</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
          + New Order
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">New Customer Order</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <AutoComplete items={customerItems} value={form.customerId} onChange={id => setForm({...form, customerId: id})} placeholder="Search & select customer *" required />
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-600 mb-2">Items</h4>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  {state.masterItems.length > 0 ? (
                    <select value={item.itemId || ''} onChange={e => selectMasterItem(idx, e.target.value)} className="col-span-3 border rounded-lg px-2 py-2 text-sm outline-none">
                      <option value="">-- Item --</option>
                      {state.masterItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                    </select>
                  ) : (
                    <div className="col-span-3"></div>
                  )}
                  <input placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="col-span-3 border rounded-lg px-3 py-2 text-sm outline-none" />
                  <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="col-span-1 border rounded-lg px-2 py-2 text-sm outline-none" />
                  <input type="number" min="0" placeholder="Rate" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="col-span-2 border rounded-lg px-2 py-2 text-sm outline-none" />
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
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Save Order</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">{selectedOrder.orderNumber}</h3>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <p className="text-sm text-gray-500 mb-1">Customer: {selectedOrder.customerName}</p>
            <p className="text-sm text-gray-500 mb-4">Date: {formatDate(selectedOrder.date)}</p>
            <table className="w-full text-sm mb-4">
              <thead><tr className="border-b"><th className="text-left py-2">Item</th><th className="text-right py-2">Qty</th><th className="text-right py-2">Delivered</th><th className="text-right py-2">Pending</th><th className="text-right py-2">Amount</th></tr></thead>
              <tbody>
                {selectedOrder.items.map(item => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">{item.description}</td>
                    <td className="text-right py-2">{item.quantity}</td>
                    <td className="text-right py-2 text-green-600">{item.delivered}</td>
                    <td className="text-right py-2 text-red-600">{item.pending}</td>
                    <td className="text-right py-2">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-right font-bold text-lg">Total: {formatCurrency(selectedOrder.totalAmount)}</div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Order #</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {state.orders.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No orders yet</td></tr>
              ) : [...state.orders].reverse().map(order => (
                <tr key={order.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-emerald-700 cursor-pointer" onClick={() => setSelectedOrder(order)}>{order.orderNumber}</td>
                  <td className="px-4 py-3">{order.customerName}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.date)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(order.totalAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{order.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(order.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
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
