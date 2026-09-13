import { useState } from 'react';
import { AppState, Payment, VendorPayment } from '../types';
import { generateId, getToday, formatCurrency, formatDate } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Payments({ state, updateState }: Props) {
  const [activeTab, setActiveTab] = useState<'received' | 'paid'>('received');
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [receiveForm, setReceiveForm] = useState({ invoiceId: '', date: getToday(), amount: 0, method: 'cash' as const, reference: '', notes: '' });
  const [payForm, setPayForm] = useState({ poId: '', date: getToday(), amount: 0, method: 'cash' as const, reference: '', notes: '' });

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoice = state.invoices.find(inv => inv.id === receiveForm.invoiceId);
    if (!invoice) return;

    const newPayment: Payment = {
      id: generateId(),
      invoiceId: receiveForm.invoiceId,
      customerName: invoice.customerName,
      date: receiveForm.date,
      amount: receiveForm.amount,
      method: receiveForm.method,
      reference: receiveForm.reference,
      notes: receiveForm.notes,
    };

    const newPaidAmount = invoice.paidAmount + receiveForm.amount;
    const status = newPaidAmount >= invoice.totalAmount ? 'paid' : newPaidAmount > 0 ? 'partial' : 'unpaid';

    updateState({
      payments: [...state.payments, newPayment],
      invoices: state.invoices.map(inv => inv.id === receiveForm.invoiceId ? { ...inv, paidAmount: newPaidAmount, status } : inv),
    });

    setReceiveForm({ invoiceId: '', date: getToday(), amount: 0, method: 'cash', reference: '', notes: '' });
    setShowReceiveForm(false);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const po = state.purchases.find(p => p.id === payForm.poId);
    if (!po) return;

    const newPayment: VendorPayment = {
      id: generateId(),
      poId: payForm.poId,
      vendorName: po.vendorName,
      date: payForm.date,
      amount: payForm.amount,
      method: payForm.method,
      reference: payForm.reference,
      notes: payForm.notes,
    };

    updateState({ vendorPayments: [...state.vendorPayments, newPayment] });
    setPayForm({ poId: '', date: getToday(), amount: 0, method: 'cash', reference: '', notes: '' });
    setShowPayForm(false);
  };

  const getInvoiceBalance = (invId: string) => {
    const inv = state.invoices.find(i => i.id === invId);
    return inv ? inv.totalAmount - inv.paidAmount : 0;
  };

  const getPOBalance = (poId: string) => {
    const po = state.purchases.find(p => p.id === poId);
    if (!po) return 0;
    const paid = state.vendorPayments.filter(vp => vp.poId === poId).reduce((s, vp) => s + vp.amount, 0);
    return po.totalAmount - paid;
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">💰 Payments</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setActiveTab('received')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'received' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          Payments Received (From Customers)
        </button>
        <button onClick={() => setActiveTab('paid')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'paid' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          Payments Made (To Vendors)
        </button>
      </div>

      {activeTab === 'received' && (
        <>
          <button onClick={() => setShowReceiveForm(!showReceiveForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition mb-4">
            + Record Payment Received
          </button>

          {showReceiveForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h3 className="font-semibold mb-4">Record Customer Payment</h3>
              <form onSubmit={handleReceiveSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <select required value={receiveForm.invoiceId} onChange={e => setReceiveForm({...receiveForm, invoiceId: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="">Select Invoice *</option>
                  {state.invoices.filter(i => i.status !== 'paid').map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.customerName} (Balance: {formatCurrency(inv.totalAmount - inv.paidAmount)})</option>
                  ))}
                </select>
                <input type="number" min="1" max={receiveForm.invoiceId ? getInvoiceBalance(receiveForm.invoiceId) : undefined} required placeholder="Amount (Rs.) *" value={receiveForm.amount || ''} onChange={e => setReceiveForm({...receiveForm, amount: parseFloat(e.target.value) || 0})} className="border rounded-lg px-4 py-2 outline-none" />
                <select value={receiveForm.method} onChange={e => setReceiveForm({...receiveForm, method: e.target.value as any})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
                <input type="date" value={receiveForm.date} onChange={e => setReceiveForm({...receiveForm, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <input placeholder="Cheque/Ref Number" value={receiveForm.reference} onChange={e => setReceiveForm({...receiveForm, reference: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <input placeholder="Notes" value={receiveForm.notes} onChange={e => setReceiveForm({...receiveForm, notes: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Record Payment</button>
                  <button type="button" onClick={() => setShowReceiveForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Method</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {state.payments.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No payments received yet</td></tr>
                  ) : [...state.payments].reverse().map(p => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(p.date)}</td>
                      <td className="px-4 py-3">{p.customerName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-emerald-600">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-sm capitalize">{p.method.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-sm">{p.reference || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {activeTab === 'paid' && (
        <>
          <button onClick={() => setShowPayForm(!showPayForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition mb-4">
            + Record Vendor Payment
          </button>

          {showPayForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h3 className="font-semibold mb-4">Record Vendor Payment</h3>
              <form onSubmit={handlePaySubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <select required value={payForm.poId} onChange={e => setPayForm({...payForm, poId: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="">Select Purchase Order *</option>
                  {state.purchases.map(po => (
                    <option key={po.id} value={po.id}>{po.poNumber} - {po.vendorName} (Balance: {formatCurrency(getPOBalance(po.id))})</option>
                  ))}
                </select>
                <input type="number" min="1" required placeholder="Amount (Rs.) *" value={payForm.amount || ''} onChange={e => setPayForm({...payForm, amount: parseFloat(e.target.value) || 0})} className="border rounded-lg px-4 py-2 outline-none" />
                <select value={payForm.method} onChange={e => setPayForm({...payForm, method: e.target.value as any})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
                <input type="date" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <input placeholder="Cheque/Ref Number" value={payForm.reference} onChange={e => setPayForm({...payForm, reference: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <input placeholder="Notes" value={payForm.notes} onChange={e => setPayForm({...payForm, notes: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <div className="flex gap-3 sm:col-span-2 lg:col-span-3">
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Record Payment</button>
                  <button type="button" onClick={() => setShowPayForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </form>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Vendor</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Method</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {state.vendorPayments.length === 0 ? (
                    <tr><td colSpan={5} className="text-center py-8 text-gray-400">No vendor payments yet</td></tr>
                  ) : [...state.vendorPayments].reverse().map(p => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(p.date)}</td>
                      <td className="px-4 py-3">{p.vendorName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-red-600">{formatCurrency(p.amount)}</td>
                      <td className="px-4 py-3 text-sm capitalize">{p.method.replace('_', ' ')}</td>
                      <td className="px-4 py-3 text-sm">{p.reference || '-'}</td>
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
