import { useState } from 'react';
import { AppState, Invoice, InvoiceItem, DeliveryNote } from '../types';
import { generateId, generateNumber, getToday, formatCurrency, formatDate } from '../utils/storage';
import AutoComplete from '../components/AutoComplete';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Invoices({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [showFromDelivery, setShowFromDelivery] = useState(false);
  const [form, setForm] = useState({ customerId: '', date: getToday(), dueDate: '', notes: '' });
  const [items, setItems] = useState<{ itemId?: string; description: string; quantity: number; unitPrice: number; unit: string }[]>([{ description: '', quantity: 1, unitPrice: 0, unit: 'pcs' }]);
  const [selectedDNs, setSelectedDNs] = useState<Set<string>>(new Set());

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

    const invoiceItems: InvoiceItem[] = items.filter(i => i.description).map(i => ({
      id: generateId(),
      itemId: i.itemId,
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      amount: i.quantity * i.unitPrice,
      unit: i.unit,
    }));

    const total = invoiceItems.reduce((s, i) => s + i.amount, 0);
    const newInvoice: Invoice = {
      id: generateId(),
      invoiceNumber: generateNumber('INV', state.invoices.length),
      customerId: form.customerId,
      customerName: customer.name,
      date: form.date,
      dueDate: form.dueDate,
      items: invoiceItems,
      totalAmount: total,
      paidAmount: 0,
      status: 'unpaid',
      notes: form.notes,
      deliveryNoteIds: [],
    };

    updateState({ invoices: [...state.invoices, newInvoice] });
    setForm({ customerId: '', date: getToday(), dueDate: '', notes: '' });
    setItems([{ description: '', quantity: 1, unitPrice: 0, unit: 'pcs' }]);
    setShowForm(false);
  };

  // Create invoice from selected delivery notes
  const createFromDeliveries = () => {
    const dns = state.deliveries.filter(d => selectedDNs.has(d.id) && !d.invoiced);
    if (dns.length === 0) return;

    const firstDN = dns[0];
    const allItems: InvoiceItem[] = [];
    const dnIds: string[] = [];

    dns.forEach(dn => {
      dnIds.push(dn.id);
      dn.items.forEach(item => {
        allItems.push({
          id: generateId(),
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          unit: item.unit,
          deliveryNoteId: dn.id,
        });
      });
    });

    const total = allItems.reduce((s, i) => s + i.amount, 0);
    const newInvoice: Invoice = {
      id: generateId(),
      invoiceNumber: generateNumber('INV', state.invoices.length),
      customerId: firstDN.customerId,
      customerName: firstDN.customerName,
      date: getToday(),
      dueDate: '',
      items: allItems,
      totalAmount: total,
      paidAmount: 0,
      status: 'unpaid',
      notes: `From DN: ${dns.map(d => d.deliveryNumber).join(', ')}`,
      deliveryNoteIds: dnIds,
      orderId: firstDN.orderId,
    };

    updateState({
      invoices: [...state.invoices, newInvoice],
      deliveries: state.deliveries.map(d => dnIds.includes(d.id) ? { ...d, invoiced: true, invoiceId: newInvoice.id } : d),
    });
    setSelectedDNs(new Set());
    setShowFromDelivery(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this invoice?')) {
      updateState({ invoices: state.invoices.filter(inv => inv.id !== id) });
    }
  };

  const unInvoicedDNs = state.deliveries.filter(d => !d.invoiced);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🧾 Invoices</h1>
        <div className="flex gap-2">
          <button onClick={() => setShowFromDelivery(!showFromDelivery)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
            🚚 From Delivery Notes
          </button>
          <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
            + New Invoice
          </button>
        </div>
      </div>

      {/* Create from Delivery Notes */}
      {showFromDelivery && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">🚚 Select Delivery Notes to Invoice</h3>
          {unInvoicedDNs.length === 0 ? (
            <p className="text-gray-400">All delivery notes have been invoiced</p>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {unInvoicedDNs.map(dn => (
                  <label key={dn.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${selectedDNs.has(dn.id) ? 'bg-emerald-50 border-emerald-300' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selectedDNs.has(dn.id)} onChange={() => {
                      const newSet = new Set(selectedDNs);
                      if (newSet.has(dn.id)) newSet.delete(dn.id); else newSet.add(dn.id);
                      setSelectedDNs(newSet);
                    }} />
                    <div className="flex-1">
                      <span className="font-medium">{dn.deliveryNumber}</span>
                      <span className="text-gray-500 ml-2">- {dn.customerName}</span>
                    </div>
                    <span className="text-sm text-gray-500">{formatDate(dn.date)}</span>
                    <span className="font-semibold">{formatCurrency(dn.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}</span>
                  </label>
                ))}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-bold">
                  Total: {formatCurrency(
                    unInvoicedDNs.filter(d => selectedDNs.has(d.id)).reduce((s, dn) => s + dn.items.reduce((a, i) => a + i.quantity * i.unitPrice, 0), 0)
                  )}
                </span>
                <div className="flex gap-3">
                  <button onClick={createFromDeliveries} disabled={selectedDNs.size === 0} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                    Create Invoice ({selectedDNs.size} DNs)
                  </button>
                  <button onClick={() => setShowFromDelivery(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Manual Invoice Form */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">New Invoice (Manual)</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <AutoComplete items={customerItems} value={form.customerId} onChange={id => setForm({...form, customerId: id})} placeholder="Search customer *" required />
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
              <input type="date" placeholder="Due Date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
              <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-600 mb-2">Invoice Items</h4>
              {items.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  {state.masterItems.length > 0 ? (
                    <select value={item.itemId || ''} onChange={e => selectMasterItem(idx, e.target.value)} className="col-span-2 border rounded-lg px-2 py-2 text-sm outline-none">
                      <option value="">-- Item --</option>
                      {state.masterItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                    </select>
                  ) : <div className="col-span-2"></div>}
                  <input placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="col-span-4 border rounded-lg px-3 py-2 text-sm outline-none" />
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
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Create Invoice</button>
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
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Invoice #</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Total</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Paid</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Balance</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {state.invoices.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No invoices yet</td></tr>
              ) : [...state.invoices].reverse().map(inv => (
                <tr key={inv.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-emerald-700">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{inv.customerName}</td>
                  <td className="px-4 py-3 text-sm">{formatDate(inv.date)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3 text-right text-emerald-600">{formatCurrency(inv.paidAmount)}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-semibold">{formatCurrency(inv.totalAmount - inv.paidAmount)}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                      inv.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{inv.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(inv.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
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
