import { useState } from 'react';
import { AppState, DeliveryNote, TransportReceipt } from '../types';
import { generateId, generateOrderNumber, getToday, formatCurrency, formatDate } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Deliveries({ state, updateState }: Props) {
  const [activeTab, setActiveTab] = useState<'deliveries' | 'transport'>('deliveries');
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [showTransportForm, setShowTransportForm] = useState(false);
  const [deliveryForm, setDeliveryForm] = useState({ orderId: '', date: getToday(), transportMode: '', trackingNumber: '' });
  const [deliveryItems, setDeliveryItems] = useState<{ description: string; quantity: number }[]>([{ description: '', quantity: 1 }]);
  const [transportForm, setTransportForm] = useState({ deliveryNoteId: '', carrier: '', trackingNumber: '', amount: 0, date: getToday() });

  const addDeliveryItem = () => setDeliveryItems([...deliveryItems, { description: '', quantity: 1 }]);
  const removeDeliveryItem = (idx: number) => setDeliveryItems(deliveryItems.filter((_, i) => i !== idx));

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const order = state.orders.find(o => o.id === deliveryForm.orderId);
    if (!order) return;

    const newDelivery: DeliveryNote = {
      id: generateId(),
      deliveryNumber: generateOrderNumber('DN', state.deliveries.length),
      orderId: deliveryForm.orderId,
      customerName: order.customerName,
      date: deliveryForm.date,
      items: deliveryItems.filter(i => i.description),
      transportMode: deliveryForm.transportMode,
      trackingNumber: deliveryForm.trackingNumber,
      status: 'dispatched',
    };

    updateState({ deliveries: [...state.deliveries, newDelivery] });
    setDeliveryForm({ orderId: '', date: getToday(), transportMode: '', trackingNumber: '' });
    setDeliveryItems([{ description: '', quantity: 1 }]);
    setShowDeliveryForm(false);
  };

  const handleTransportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const delivery = state.deliveries.find(d => d.id === transportForm.deliveryNoteId);
    if (!delivery) return;

    const newReceipt: TransportReceipt = {
      id: generateId(),
      receiptNumber: generateOrderNumber('TR', state.transportReceipts.length),
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
    updateState({
      deliveries: state.deliveries.map(d => d.id === id ? { ...d, status: 'delivered' as const } : d)
    });
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">🚚 Deliveries & Transport</h1>
      </div>

      {/* Tabs */}
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
          <button onClick={() => setShowDeliveryForm(!showDeliveryForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition mb-4">
            + New Delivery Note
          </button>

          {showDeliveryForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h3 className="font-semibold mb-4">New Delivery Note</h3>
              <form onSubmit={handleDeliverySubmit}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <select required value={deliveryForm.orderId} onChange={e => setDeliveryForm({...deliveryForm, orderId: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
                    <option value="">Select Order *</option>
                    {state.orders.map(o => <option key={o.id} value={o.id}>{o.orderNumber} - {o.customerName}</option>)}
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
                      <input placeholder="Description" value={item.description} onChange={e => { const u = [...deliveryItems]; u[idx].description = e.target.value; setDeliveryItems(u); }} className="col-span-8 border rounded-lg px-3 py-2 text-sm outline-none" />
                      <input type="number" min="1" value={item.quantity} onChange={e => { const u = [...deliveryItems]; u[idx].quantity = parseInt(e.target.value) || 0; setDeliveryItems(u); }} className="col-span-3 border rounded-lg px-3 py-2 text-sm outline-none" />
                      <button type="button" onClick={() => removeDeliveryItem(idx)} className="col-span-1 text-red-500 text-center">✕</button>
                    </div>
                  ))}
                  <button type="button" onClick={addDeliveryItem} className="text-emerald-600 text-sm font-medium mt-2">+ Add Item</button>
                </div>

                <div className="flex gap-3">
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Save Delivery Note</button>
                  <button type="button" onClick={() => setShowDeliveryForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </form>
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
                      </td>
                      <td className="px-4 py-3">
                        {d.status !== 'delivered' && (
                          <button onClick={() => markDelivered(d.id)} className="text-emerald-600 text-sm">Mark Delivered</button>
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
          <button onClick={() => setShowTransportForm(!showTransportForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition mb-4">
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
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Tracking</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {state.transportReceipts.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No transport receipts yet</td></tr>
                  ) : [...state.transportReceipts].reverse().map(t => (
                    <tr key={t.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-indigo-700">{t.receiptNumber}</td>
                      <td className="px-4 py-3">{t.customerName}</td>
                      <td className="px-4 py-3">{t.carrier}</td>
                      <td className="px-4 py-3 text-sm">{t.trackingNumber || '-'}</td>
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
