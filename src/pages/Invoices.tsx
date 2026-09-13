import { useState } from 'react';
import { AppState, Invoice, InvoiceItem, DeliveryNote } from '../types';
import { generateId, generateNumber, getToday, formatCurrency, formatDate } from '../utils/storage';
import AutoComplete from '../components/AutoComplete';
import PrintModal from '../components/PrintModal';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Invoices({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [editInvoice, setEditInvoice] = useState<Invoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);
  const [showFromDelivery, setShowFromDelivery] = useState(false);
  const [form, setForm] = useState({ customerId: '', date: getToday(), dueDate: '', notes: '' });
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [selectedDNs, setSelectedDNs] = useState<Set<string>>(new Set());

  const customerItems = state.customers.map(c => ({ id: c.id, label: c.name, sublabel: c.city }));

  const openNewForm = () => {
    setEditInvoice(null);
    setForm({ customerId: '', date: getToday(), dueDate: '', notes: '' });
    setItems([{ id: generateId(), description: '', quantity: 1, unitPrice: 0, amount: 0, unit: 'pcs' }]);
    setShowForm(true);
  };

  const openEditForm = (inv: Invoice) => {
    setEditInvoice(inv);
    setForm({ customerId: inv.customerId, date: inv.date, dueDate: inv.dueDate, notes: inv.notes });
    setItems([...inv.items]);
    setShowForm(true);
  };

  const addItem = () => setItems([...items, { id: generateId(), description: '', quantity: 1, unitPrice: 0, amount: 0, unit: 'pcs' }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...items];
    (updated[idx] as any)[field] = value;
    if (field === 'quantity' || field === 'unitPrice') {
      updated[idx].amount = updated[idx].quantity * updated[idx].unitPrice;
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

  // Load items from selected delivery notes
  const loadFromDeliveryNotes = () => {
    const dns = state.deliveries.filter(d => selectedDNs.has(d.id));
    const newItems: InvoiceItem[] = [];
    dns.forEach(dn => {
      dn.items.forEach(item => {
        newItems.push({
          id: generateId(),
          itemId: item.itemId,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          unit: item.unit,
          deliveryNoteId: dn.id,
        });
      });
    });
    if (newItems.length > 0) {
      setItems(newItems);
      if (dns.length > 0) {
        setForm({ ...form, customerId: dns[0].customerId });
      }
    }
    setShowFromDelivery(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customer = state.customers.find(c => c.id === form.customerId);
    if (!customer || items.length === 0) return;

    const validItems = items.filter(i => i.description);
    const total = validItems.reduce((s, i) => s + i.amount, 0);
    const dnIds = [...new Set(validItems.map(i => i.deliveryNoteId).filter(Boolean))] as string[];

    if (editInvoice) {
      // Update existing
      const newPaidAmount = Math.min(editInvoice.paidAmount, total);
      const status = newPaidAmount >= total ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';
      updateState({
        invoices: state.invoices.map(inv => inv.id === editInvoice.id ? {
          ...inv,
          customerId: form.customerId,
          customerName: customer.name,
          date: form.date,
          dueDate: form.dueDate,
          items: validItems,
          totalAmount: total,
          paidAmount: newPaidAmount,
          status,
          notes: form.notes,
          deliveryNoteIds: dnIds,
        } : inv)
      });
    } else {
      const newInvoice: Invoice = {
        id: generateId(),
        invoiceNumber: generateNumber('INV', state.invoices.length),
        customerId: form.customerId,
        customerName: customer.name,
        date: form.date,
        dueDate: form.dueDate,
        items: validItems,
        totalAmount: total,
        paidAmount: 0,
        status: 'unpaid',
        notes: form.notes,
        deliveryNoteIds: dnIds,
      };
      updateState({
        invoices: [...state.invoices, newInvoice],
        deliveries: state.deliveries.map(d => dnIds.includes(d.id) ? { ...d, invoiced: true, invoiceId: newInvoice.id } : d),
      });
    }

    setShowForm(false);
    setEditInvoice(null);
    setForm({ customerId: '', date: getToday(), dueDate: '', notes: '' });
    setItems([]);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this invoice?')) {
      const inv = state.invoices.find(i => i.id === id);
      if (inv) {
        updateState({
          invoices: state.invoices.filter(i => i.id !== id),
          deliveries: state.deliveries.map(d => inv.deliveryNoteIds.includes(d.id) ? { ...d, invoiced: false, invoiceId: undefined } : d),
        });
      }
    }
  };

  const getCustomerInfo = (inv: Invoice) => state.customers.find(c => c.id === inv.customerId);
  const unInvoicedDNs = state.deliveries.filter(d => !d.invoiced);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🧾 Invoices</h1>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setShowFromDelivery(!showFromDelivery); setShowForm(false); }} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700">
            🚚 From Delivery Notes
          </button>
          <button onClick={openNewForm} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
            + New Invoice
          </button>
        </div>
      </div>

      {/* Select Delivery Notes */}
      {showFromDelivery && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">🚚 Select Delivery Notes → Items will auto-populate (editable)</h3>
          {unInvoicedDNs.length === 0 ? (
            <p className="text-gray-400">All delivery notes have been invoiced</p>
          ) : (
            <>
              <div className="space-y-2 mb-4 max-h-64 overflow-y-auto">
                {unInvoicedDNs.map(dn => (
                  <label key={dn.id} className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer ${selectedDNs.has(dn.id) ? 'bg-purple-50 border-purple-300' : 'hover:bg-gray-50'}`}>
                    <input type="checkbox" checked={selectedDNs.has(dn.id)} onChange={() => {
                      const newSet = new Set(selectedDNs);
                      if (newSet.has(dn.id)) newSet.delete(dn.id); else newSet.add(dn.id);
                      setSelectedDNs(newSet);
                    }} />
                    <div className="flex-1">
                      <span className="font-medium">{dn.deliveryNumber}</span>
                      <span className="text-gray-500 ml-2">- {dn.customerName}</span>
                      <span className="text-xs text-gray-400 ml-2">({dn.items.length} items)</span>
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
                  <button onClick={loadFromDeliveryNotes} disabled={selectedDNs.size === 0} className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50">
                    Load Items → Edit & Create Invoice
                  </button>
                  <button onClick={() => setShowFromDelivery(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Invoice Form (new or edit) */}
      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">{editInvoice ? '✏️ Edit Invoice' : '📝 New Invoice'}</h3>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <AutoComplete items={customerItems} value={form.customerId} onChange={id => setForm({...form, customerId: id})} placeholder="Search customer *" required />
              <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
              <input type="date" placeholder="Due Date" value={form.dueDate} onChange={e => setForm({...form, dueDate: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
              <input placeholder="Notes" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-sm text-gray-600 mb-2">Items (editable qty, rate, description)</h4>
              {items.map((item, idx) => (
                <div key={item.id || idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                  {state.masterItems.length > 0 ? (
                    <select value={item.itemId || ''} onChange={e => selectMasterItem(idx, e.target.value)} className="col-span-2 border rounded-lg px-2 py-2 text-sm outline-none">
                      <option value="">-- Item --</option>
                      {state.masterItems.map(mi => <option key={mi.id} value={mi.id}>{mi.name}</option>)}
                    </select>
                  ) : <div className="col-span-2"></div>}
                  <input placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="col-span-3 border rounded-lg px-3 py-2 text-sm outline-none" />
                  <input type="number" min="0.01" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)} className="col-span-1 border rounded-lg px-2 py-2 text-sm outline-none" />
                  <input type="number" min="0" placeholder="Rate" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="col-span-2 border rounded-lg px-2 py-2 text-sm outline-none" />
                  <input placeholder="Unit" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="col-span-1 border rounded-lg px-2 py-2 text-sm outline-none" />
                  <span className="col-span-2 text-sm font-medium text-right">{formatCurrency(item.amount)}</span>
                  <button type="button" onClick={() => removeItem(idx)} className="col-span-1 text-red-500 text-center">✕</button>
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-emerald-600 text-sm font-medium mt-2">+ Add Item</button>
            </div>

            <div className="text-right mb-4 p-3 bg-emerald-50 rounded-lg">
              <span className="text-lg font-bold">Total: {formatCurrency(items.reduce((s, i) => s + i.amount, 0))}</span>
              {editInvoice && <span className="text-sm text-gray-500 ml-4">Already Paid: {formatCurrency(editInvoice.paidAmount)}</span>}
            </div>

            <div className="flex gap-3">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
                {editInvoice ? 'Update Invoice' : 'Create Invoice'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditInvoice(null); }} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Print Modal */}
      {printInvoice && (
        <PrintModal
          data={{
            type: 'invoice',
            number: printInvoice.invoiceNumber,
            date: printInvoice.date,
            dueDate: printInvoice.dueDate,
            partyName: printInvoice.customerName,
            partyContact: getCustomerInfo(printInvoice)?.contact,
            partyAddress: getCustomerInfo(printInvoice)?.address,
            partyCity: getCustomerInfo(printInvoice)?.city,
            orderRef: printInvoice.deliveryNoteIds.map(id => state.deliveries.find(d => d.id === id)?.deliveryNumber).filter(Boolean).join(', '),
            items: printInvoice.items.map(i => ({
              description: i.description,
              quantity: i.quantity,
              unit: i.unit,
              rate: i.unitPrice,
              amount: i.amount,
            })),
            totalAmount: printInvoice.totalAmount,
            paidAmount: printInvoice.paidAmount,
            notes: printInvoice.notes,
          }}
          onClose={() => setPrintInvoice(null)}
        />
      )}

      {/* Invoice List */}
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
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
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
                    <div className="flex gap-2">
                      <button onClick={() => setPrintInvoice(inv)} className="text-blue-600 text-sm" title="Print">🖨️</button>
                      <button onClick={() => openEditForm(inv)} className="text-amber-600 text-sm" title="Edit">✏️</button>
                      <button onClick={() => handleDelete(inv.id)} className="text-red-500 text-sm" title="Delete">🗑️</button>
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
