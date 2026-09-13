import { useState } from 'react';
import { AppState, DeliveryNote, DeliveryItem, TransportReceipt, Invoice, InvoiceItem } from '../types';
import { generateId, generateNumber, getToday, formatCurrency, formatDate } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Deliveries({ state, updateState }: Props) {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'transport'>('deliveries');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [convertDN, setConvertDN] = useState<DeliveryNote | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [deliveryForm, setDeliveryForm] = useState({ orderId: '', date: getToday(), transportMode: '', trackingNumber: '' });
  const [deliveryItems, setDeliveryItems] = useState<{ description: string; quantity: number; unitPrice: number; unit: string }[]>([{ description: '', quantity: 1, unitPrice: 0, unit: 'pcs' }]);
  const [transportForm, setTransportForm] = useState({ deliveryNoteId: '', carrier: '', trackingNumber: '', amount: 0, date: getToday() });

  const addDeliveryItem = () => setDeliveryItems([...deliveryItems, { description: '', quantity: 1, unitPrice: 0, unit: 'pcs' }]);
  const removeDeliveryItem = (idx: number) => setDeliveryItems(deliveryItems.filter((_, i) => i !== idx));

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = state.orders.find(o => o.id === deliveryForm.orderId);
    if (!order) return;

    const newItems: DeliveryItem[] = deliveryItems.filter(i => i.description).map(i => ({
      id: generateId(),
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      unit: i.unit,
      orderId: order.id,
    }));

    const newDelivery: DeliveryNote = {
      id: generateId(),
      deliveryNumber: generateNumber('DN', state.deliveries.length),
      orderId: deliveryForm.orderId,
      customerId: order.customerId,
      customerName: order.customerName,
      date: deliveryForm.date,
      items: newItems,
      transportMode: deliveryForm.transportMode,
      trackingNumber: deliveryForm.trackingNumber,
      status: 'dispatched',
      invoiced: false,
    };

    // Update order items delivered count
    const updatedOrders = state.orders.map(o => {
      if (o.id !== order.id) return o;
      const updatedItems = o.items.map(oi => {
        const delivered = newItems.filter(di => di.description === oi.description).reduce((s, di) => s + di.quantity, 0);
        return { ...oi, delivered: oi.delivered + delivered, pending: oi.pending - delivered };
      });
      const allDone = updatedItems.every(i => i.pending <= 0);
      return { ...o, items: updatedItems, status: (allDone ? 'completed' : 'partial') as 'completed' | 'partial' };
    });

    updateState({ deliveries: [...state.deliveries, newDelivery], orders: updatedOrders });
    setDeliveryForm({ orderId: '', date: getToday(), transportMode: '', trackingNumber: '' });
    setDeliveryItems([{ description: '', quantity: 1, unitPrice: 0, unit: 'pcs' }]);
    setShowDeliveryForm(false);
  };

  const handleTransportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const delivery = state.deliveries.find(d => d.id === transportForm.deliveryNoteId);
    if (!delivery) return;

    const newReceipt: TransportReceipt = {
      id: generateId(),
      receiptNumber: generateNumber('TR', state.transportReceipts.length),
      deliveryNoteId: transportForm.deliveryNoteId,
      carrier: transportForm.carrier,
      trackingNumber: transportForm.trackingNumber,
      amount: transportForm.amount,
      date: transportForm.date,
      customerName: delivery.customerName,
    };

    updateState({ transportReceipts: [...state.transportReceipts, newReceipt] });
    setTransportForm({ deliveryNoteId: '', carrier: '', trackingNumber: '', amount: 0, date: getToday() });
    setShowTransportForm(false);
  };

  // Convert delivery note to invoice
  const openConvertModal = (dn: DeliveryNote) => {
    setConvertDN(dn);
    const allIds = new Set(dn.items.map(i => i.id));
    setSelectedItems(allIds);
  };

  const toggleItem = (id: string) => {
    const newSet = new Set(selectedItems);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedItems(newSet);
  };

  const convertToInvoice = () => {
    if (!convertDN) return;
    const itemsToInvoice = convertDN.items.filter(i => selectedItems.has(i.id));
    
    const invoiceItems: InvoiceItem[] = itemsToInvoice.map(i => ({
      id: generateId(),
      description: i.description,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      amount: i.quantity * i.unitPrice,
      unit: i.unit,
      deliveryNoteId: convertDN.id,
    }));

    const total = invoiceItems.reduce((s, i) => s + i.amount, 0);
    const newInvoice: Invoice = {
      id: generateId(),
      invoiceNumber: generateNumber('INV', state.invoices.length),
      customerId: convertDN.customerId,
      customerName: convertDN.customerName,
      date: getToday(),
      dueDate: '',
      items: invoiceItems,
      totalAmount: total,
      paidAmount: 0,
      status: 'unpaid',
      notes: `From Delivery Note: ${convertDN.deliveryNumber}`,
      deliveryNoteIds: [convertDN.id],
      orderId: convertDN.orderId,
    };

    updateState({
      invoices: [...state.invoices, newInvoice],
      deliveries: state.deliveries.map(d => d.id === convertDN.id ? { ...d, invoiced: true, invoiceId: newInvoice.id } : d),
    });
    setConvertDN(null);
    setSelectedItems(new Set());
  };

  const markDelivered = (id: string) => {
    updateState({ deliveries: state.deliveries.map(d => d.id === id ? { ...d, status: 'delivered' as const } : d) });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🚚 Deliveries & Transport</h1>
      </div>

      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('deliveries')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'deliveries' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          Delivery Notes
        </button>
        <button onClick={() => setActiveTab('transport')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'transport' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          Transport Receipts
        </button>
      </div>

      {activeTab === 'deliveries' && (
        <>
          <button onClick={() => setShowDeliveryForm(!showDeliveryForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 mb-4">
            + New Delivery Note
          </button>

          {showDeliveryForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h3 className="font-semibold mb-4">New Delivery Note</h3>
              <form onSubmit={handleDeliverySubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <select required value={deliveryForm.orderId} onChange={e => {
                    const orderId = e.target.value;
                    setDeliveryForm({...deliveryForm, orderId});
                    // Auto-fill items from order
                    const order = state.orders.find(o => o.id === orderId);
                    if (order) {
                      setDeliveryItems(order.items.filter(i => i.pending > 0).map(i => ({
                        description: i.description, quantity: i.pending, unitPrice: i.unitPrice, unit: i.unit
                      })));
                    }
                  }} className="border rounded-lg px-4 py-2 outline-none">
                    <option value="">Select Order *</option>
                    {state.orders.filter(o => o.status !== 'completed').map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.customerName}</option>)}
                  </select>
                  <input type="date" value={deliveryForm.date} onChange={e => setDeliveryForm({...deliveryForm, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                  <select value={deliveryForm.transportMode} onChange={e => setDeliveryForm({...deliveryForm, transportMode: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
                    <option value="">Transport Mode</option>
                    <option value="TCS">TCS</option>
                    <option value="Daewoo">Daewoo</option>
                    <option value="Leo">Leo</option>
                    <option value="Truck">Truck</option>
                    <option value="Other">Other</option>
                  </select>
                  <input placeholder="Tracking / LR Number" value={deliveryForm.trackingNumber} onChange={e => setDeliveryForm({...deliveryForm, trackingNumber: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Items Being Delivered</h4>
                  {deliveryItems.map((item, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                      <input placeholder="Description" value={item.description} onChange={e => { const u = [...deliveryItems]; u[idx].description = e.target.value; setDeliveryItems(u); }} className="col-span-5 border rounded-lg px-3 py-2 text-sm outline-none" />
                      <input type="number" min="1" value={item.quantity} onChange={e => { const u = [...deliveryItems]; u[idx].quantity = parseInt(e.target.value) || 0; setDeliveryItems(u); }} className="col-span-2 border rounded-lg px-2 py-2 text-sm outline-none" />
                      <input type="number" min="0" placeholder="Rate" value={item.unitPrice} onChange={e => { const u = [...deliveryItems]; u[idx].unitPrice = parseFloat(e.target.value) || 0; setDeliveryItems(u); }} className="col-span-2 border rounded-lg px-2 py-2 text-sm outline-none" />
                      <span className="col-span-2 text-sm text-right">{formatCurrency(item.quantity * item.unitPrice)}</span>
                      <button type="button" onClick={() => removeDeliveryItem(idx)} className="col-span-1 text-red-500 text-center">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={addDeliveryItem} className="text-emerald-600 text-sm font-medium mt-2">+ Add Item</button>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Save</button>
                  <button type="button" onClick={() => setShowDeliveryForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Convert DN to Invoice Modal */}
          {convertDN && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setConvertDN(null)}>
              <div className="bg-white rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <h3 className="text-lg font-bold mb-2">🧾 Convert to Invoice</h3>
                <p className="text-sm text-gray-500 mb-4">{convertDN.deliveryNumber} - {convertDN.customerName}</p>
                
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium">Select items to invoice:</span>
                    <button onClick={() => {
                      if (selectedItems.size === convertDN.items.length) setSelectedItems(new Set());
                      else setSelectedItems(new Set(convertDN.items.map(i => i.id)));
                    }} className="text-sm text-emerald-600">
                      {selectedItems.size === convertDN.items.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>
                  <table className="w-full text-sm">
                    <thead><tr className="border-b bg-gray-50"><th className="p-2 text-left w-8"></th><th className="p-2 text-left">Item</th><th className="p-2 text-right">Qty</th><th className="p-2 text-right">Rate</th><th className="p-2 text-right">Amount</th></tr></thead>
                    <tbody>
                      {convertDN.items.map(item => (
                        <tr key={item.id} className={`border-b cursor-pointer ${selectedItems.has(item.id) ? 'bg-emerald-50' : ''}`} onClick={() => toggleItem(item.id)}>
                          <td className="p-2"><input type="checkbox" checked={selectedItems.has(item.id)} onChange={() => toggleItem(item.id)} /></td>
                          <td className="p-2">{item.description}</td>
                          <td className="p-2 text-right">{item.quantity} {item.unit}</td>
                          <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                          <td className="p-2 text-right font-semibold">{formatCurrency(item.quantity * item.unitPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="text-right mb-4 p-3 bg-emerald-50 rounded-lg">
                  <span className="font-bold text-lg">Invoice Total: {formatCurrency(
                    convertDN.items.filter(i => selectedItems.has(i.id)).reduce((s, i) => s + i.quantity * i.unitPrice, 0)
                  )}</span>
                </div>

                <div className="flex gap-3">
                  <button onClick={convertToInvoice} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Create Invoice</button>
                  <button onClick={() => setConvertDN(null)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">DN #</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Transport</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.deliveries.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No delivery notes yet</td></tr>
                  ) : [...state.deliveries].reverse().map(d => (
                    <tr key={d.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-purple-700">{d.deliveryNumber}</td>
                      <td className="px-4 py-3">{d.customerName}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(d.date)}</td>
                      <td className="px-4 py-3 text-sm">{d.transportMode || '-'} {d.trackingNumber && `(${d.trackingNumber})`}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${d.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{d.status}</span>
                        {d.invoiced && <span className="ml-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Invoiced ✓</span>}
                      </td>
                      <td className="px-4 py-3 flex gap-2 flex-wrap">
                        {d.status !== 'delivered' && (
                          <button onClick={() => markDelivered(d.id)} className="text-blue-600 text-sm">✓ Delivered</button>
                        )}
                        {!d.invoiced && (
                          <button onClick={() => openConvertModal(d)} className="text-emerald-600 text-sm font-medium">🧾 → Invoice</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'transport' && (
        <>
          <button onClick={() => setShowTransportForm(!showTransportForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 mb-4">
            + Add Transport Receipt
          </button>

          {showTransportForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h3 className="font-semibold mb-4">New Transport Receipt</h3>
              <form onSubmit={handleTransportSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select required value={transportForm.deliveryNoteId} onChange={e => setTransportForm({...transportForm, deliveryNoteId: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="">Select Delivery Note *</option>
                  {state.deliveries.map(d => <option key={d.id} value={d.id}>{d.deliveryNumber} - {d.customerName}</option>)}
                </select>
                <select required value={transportForm.carrier} onChange={e => setTransportForm({...transportForm, carrier: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="">Carrier *</option>
                  <option value="TCS">TCS</option>
                  <option value="Daewoo">Daewoo</option>
                  <option value="Leo">Leo</option>
                  <option value="Truck">Truck</option>
                  <option value="Other">Other</option>
                </select>
                <input placeholder="Tracking / LR Number" value={transportForm.trackingNumber} onChange={e => setTransportForm({...transportForm, trackingNumber: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <input type="number" min="0" placeholder="Amount (Rs.)" value={transportForm.amount || ''} onChange={e => setTransportForm({...transportForm, amount: parseFloat(e.target.value) || 0})} className="border rounded-lg px-4 py-2 outline-none" />
                <input type="date" value={transportForm.date} onChange={e => setTransportForm({...transportForm, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <div className="flex gap-3">
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Save</button>
                  <button type="button" onClick={() => setShowTransportForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Receipt #</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Carrier</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {state.transportReceipts.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No transport receipts yet</td></tr>
                  ) : [...state.transportReceipts].reverse().map(t => (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-indigo-700">{t.receiptNumber}</td>
                      <td className="px-4 py-3">{t.customerName}</td>
                      <td className="px-4 py-3">{t.carrier}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(t.amount)}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(t.date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
