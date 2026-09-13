import { useState } from 'react';
import { AppState, DeliveryNote, DeliveryItem, TransportReceipt } from '../types';
import { generateId, generateNumber, getToday, formatCurrency, formatDate } from '../utils/storage';
import PrintModal from '../components/PrintModal';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Deliveries({ state, updateState }: Props) {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'transport'>('deliveries');
  const [showForm, setShowForm] = useState(false);
  const [editDN, setEditDN] = useState<DeliveryNote | null>(null);
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [printDN, setPrintDN] = useState<DeliveryNote | null>(null);
  const [form, setForm] = useState({ orderId: '', date: getToday(), transportMode: '', trackingNumber: '' });
  const [deliveryItems, setDeliveryItems] = useState<DeliveryItem[]>([]);
  const [transportForm, setTransportForm] = useState({ deliveryNoteId: '', carrier: '', trackingNumber: '', amount: 0, date: getToday() });

  const openNewForm = () => {
    setEditDN(null);
    setForm({ orderId: '', date: getToday(), transportMode: '', trackingNumber: '' });
    setDeliveryItems([]);
    setShowForm(true);
  };

  const openEditForm = (dn: DeliveryNote) => {
    setEditDN(dn);
    setForm({ orderId: dn.orderId, date: dn.date, transportMode: dn.transportMode, trackingNumber: dn.trackingNumber });
    setDeliveryItems([...dn.items]);
    setShowForm(true);
  };

  const selectOrder = (orderId: string) => {
    setForm({ ...form, orderId });
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
      setDeliveryItems(order.items.filter(i => i.pending > 0).map(i => ({
        id: generateId(),
        itemId: i.itemId,
        description: i.description,
        quantity: i.pending,
        unitPrice: i.unitPrice,
        unit: i.unit,
        orderId: order.id,
        orderItemId: i.id,
      })));
    }
  };

  const addItem = () => setDeliveryItems([...deliveryItems, { id: generateId(), description: '', quantity: 1, unitPrice: 0, unit: 'pcs' }]);
  const removeItem = (idx: number) => setDeliveryItems(deliveryItems.filter((_, i) => i !== idx));
  const updateItem = (idx: number, field: string, value: any) => {
    const updated = [...deliveryItems];
    (updated[idx] as any)[field] = value;
    setDeliveryItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (deliveryItems.length === 0) return;

    const order = state.orders.find(o => o.id === form.orderId);
    const customerName = order?.customerName || editDN?.customerName || '';
    const customerId = order?.customerId || editDN?.customerId || '';

    if (editDN) {
      // Update existing
      updateState({
        deliveries: state.deliveries.map(d => d.id === editDN.id ? {
          ...d,
          date: form.date,
          transportMode: form.transportMode,
          trackingNumber: form.trackingNumber,
          items: deliveryItems.filter(i => i.description),
        } : d)
      });
    } else {
      if (!order) return;
      const newDelivery: DeliveryNote = {
        id: generateId(),
        deliveryNumber: generateNumber('DN', state.deliveries.length),
        orderId: form.orderId,
        customerId,
        customerName,
        date: form.date,
        items: deliveryItems.filter(i => i.description),
        transportMode: form.transportMode,
        trackingNumber: form.trackingNumber,
        status: 'dispatched',
        invoiced: false,
      };
      updateState({ deliveries: [...state.deliveries, newDelivery] });
    }

    setShowForm(false);
    setEditDN(null);
    setForm({ orderId: '', date: getToday(), transportMode: '', trackingNumber: '' });
    setDeliveryItems([]);
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

  const markDelivered = (id: string) => {
    updateState({ deliveries: state.deliveries.map(d => d.id === id ? { ...d, status: 'delivered' as const } : d) });
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this delivery note?')) {
      updateState({ deliveries: state.deliveries.filter(d => d.id !== id) });
    }
  };

  const getCustomerInfo = (dn: DeliveryNote) => {
    const customer = state.customers.find(c => c.id === dn.customerId);
    return customer;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🚚 Deliveries & Transport</h1>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setActiveTab('deliveries')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'deliveries' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          Delivery Notes
        </button>
        <button onClick={() => setActiveTab('transport')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'transport' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          Transport Receipts
        </button>
      </div>

      {activeTab === 'deliveries' && (
        <>
          <button onClick={openNewForm} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 mb-4">
            + New Delivery Note
          </button>

          {/* Form */}
          {showForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h3 className="font-semibold mb-4">{editDN ? '✏️ Edit Delivery Note' : '📝 New Delivery Note'}</h3>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  {!editDN && (
                    <select required value={form.orderId} onChange={e => selectOrder(e.target.value)} className="border rounded-lg px-4 py-2 outline-none">
                      <option value="">Select Order (auto-fills items) *</option>
                      {state.orders.filter(o => o.status !== 'completed').map(o => (
                        <option key={o.id} value={o.id}>{o.orderNumber} - {o.customerName}</option>
                      ))}
                    </select>
                  )}
                  {editDN && (
                    <div className="border rounded-lg px-4 py-2 bg-gray-50">
                      <span className="text-sm text-gray-500">Order:</span> <strong>{state.orders.find(o => o.id === editDN.orderId)?.orderNumber || '-'}</strong>
                    </div>
                  )}
                  <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                  <select value={form.transportMode} onChange={e => setForm({...form, transportMode: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
                    <option value="">Transport Mode</option>
                    <option value="TCS">TCS</option>
                    <option value="Daewoo">Daewoo</option>
                    <option value="Leo">Leo</option>
                    <option value="Truck">Truck</option>
                    <option value="Other">Other</option>
                  </select>
                  <input placeholder="Tracking / LR Number" value={form.trackingNumber} onChange={e => setForm({...form, trackingNumber: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                </div>

                <div className="mb-4">
                  <h4 className="font-medium text-sm text-gray-600 mb-2">Items (editable quantities & rates)</h4>
                  {deliveryItems.map((item, idx) => (
                    <div key={item.id || idx} className="grid grid-cols-12 gap-2 mb-2 items-center">
                      <input placeholder="Description" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="col-span-4 border rounded-lg px-3 py-2 text-sm outline-none" />
                      <input type="number" min="1" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 0)} className="col-span-2 border rounded-lg px-2 py-2 text-sm outline-none" />
                      <input type="number" min="0" placeholder="Rate" value={item.unitPrice} onChange={e => updateItem(idx, 'unitPrice', parseFloat(e.target.value) || 0)} className="col-span-2 border rounded-lg px-2 py-2 text-sm outline-none" />
                      <input placeholder="Unit" value={item.unit} onChange={e => updateItem(idx, 'unit', e.target.value)} className="col-span-1 border rounded-lg px-2 py-2 text-sm outline-none" />
                      <span className="col-span-2 text-sm font-medium text-right">{formatCurrency(item.quantity * item.unitPrice)}</span>
                      <button type="button" onClick={() => removeItem(idx)} className="col-span-1 text-red-500 text-center">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={addItem} className="text-emerald-600 text-sm font-medium mt-2">+ Add Item</button>
                </div>

                <div className="text-right mb-4 p-3 bg-gray-50 rounded-lg">
                  <span className="text-lg font-bold">Total: {formatCurrency(deliveryItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}</span>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
                    {editDN ? 'Update' : 'Save'} Delivery Note
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditDN(null); }} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Print Modal */}
          {printDN && (
            <PrintModal
              data={{
                type: 'delivery',
                number: printDN.deliveryNumber,
                date: printDN.date,
                partyName: printDN.customerName,
                partyContact: getCustomerInfo(printDN)?.contact,
                partyAddress: getCustomerInfo(printDN)?.address,
                partyCity: getCustomerInfo(printDN)?.city,
                orderRef: state.orders.find(o => o.id === printDN.orderId)?.orderNumber,
                items: printDN.items.map(i => ({
                  description: i.description,
                  quantity: i.quantity,
                  unit: i.unit,
                  rate: i.unitPrice,
                  amount: i.quantity * i.unitPrice,
                })),
                totalAmount: printDN.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
                transportMode: printDN.transportMode,
                trackingNumber: printDN.trackingNumber,
                notes: printDN.status === 'delivered' ? 'Delivered' : 'Dispatched',
              }}
              onClose={() => setPrintDN(null)}
            />
          )}

          {/* List */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">DN #</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Transport</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {state.deliveries.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No delivery notes yet</td></tr>
                  ) : [...state.deliveries].reverse().map(d => (
                    <tr key={d.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-purple-700">{d.deliveryNumber}</td>
                      <td className="px-4 py-3">{d.customerName}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(d.date)}</td>
                      <td className="px-4 py-3 text-sm">{d.transportMode || '-'} {d.trackingNumber && `(${d.trackingNumber})`}</td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(d.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0))}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${d.status === 'delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{d.status}</span>
                        {d.invoiced && <span className="ml-1 px-2 py-1 rounded-full text-xs bg-emerald-100 text-emerald-700">Invoiced ✓</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button onClick={() => setPrintDN(d)} className="text-blue-600 text-sm hover:underline">🖨️</button>
                          <button onClick={() => openEditForm(d)} className="text-amber-600 text-sm hover:underline">✏️</button>
                          {d.status !== 'delivered' && (
                            <button onClick={() => markDelivered(d.id)} className="text-emerald-600 text-sm hover:underline">✓</button>
                          )}
                          <button onClick={() => handleDelete(d.id)} className="text-red-500 text-sm hover:underline">🗑️</button>
                        </div>
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
