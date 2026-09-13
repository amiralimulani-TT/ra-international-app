import { useState } from 'react';
import { AppState, Payment, VendorPayment } from '../types';
import { generateId, getToday, formatCurrency, formatDate, daysBetween } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Payments({ state, updateState }: Props) {
  const [activeTab, setActiveTab] = useState<'outstanding' | 'received' | 'paid' | 'adjustments'>('outstanding');
  const [showReceiveForm, setShowReceiveForm] = useState(false);
  const [showPayForm, setShowPayForm] = useState(false);
  const [showAdjustForm, setShowAdjustForm] = useState(false);
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [bulkAmount, setBulkAmount] = useState(0);
  const [receiveForm, setReceiveForm] = useState({ invoiceId: '', date: getToday(), amount: 0, method: 'cash' as const, accountId: '', reference: '', notes: '' });
  const [payForm, setPayForm] = useState({ poId: '', date: getToday(), amount: 0, method: 'cash' as const, accountId: '', reference: '', notes: '' });
  const [adjustForm, setAdjustForm] = useState({ invoiceId: '', type: 'wht' as 'wht' | 'discount' | 'writeoff', amount: 0, date: getToday(), notes: '' });

  // Outstanding invoices
  const outstandingInvoices = state.invoices
    .filter(inv => inv.status !== 'paid')
    .map(inv => ({
      ...inv,
      balance: inv.totalAmount - inv.paidAmount,
      daysOverdue: inv.dueDate ? daysBetween(inv.dueDate, getToday()) : 0,
    }))
    .sort((a, b) => a.daysOverdue - b.daysOverdue);

  // Outstanding POs
  const outstandingPOs = state.purchases.map(po => {
    const paid = state.vendorPayments.filter(vp => vp.poId === po.id).reduce((s, vp) => s + vp.amount, 0);
    return { ...po, balance: po.totalAmount - paid };
  }).filter(po => po.balance > 0);

  const totalReceivable = outstandingInvoices.reduce((s, i) => s + i.balance, 0);
  const totalPayable = outstandingPOs.reduce((s, p) => s + p.balance, 0);

  const handleReceiveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const invoice = state.invoices.find(inv => inv.id === receiveForm.invoiceId);
    if (!invoice) return;

    const newPayment: Payment = {
      id: generateId(),
      invoiceId: receiveForm.invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      customerId: invoice.customerId,
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

    setReceiveForm({ invoiceId: '', date: getToday(), amount: 0, method: 'cash', accountId: '', reference: '', notes: '' });
    setShowReceiveForm(false);
  };

  // Bulk payment for selected invoices
  const handleBulkPayment = () => {
    if (selectedInvoices.size === 0 || bulkAmount <= 0) return;

    let remaining = bulkAmount;
    const newPayments: Payment[] = [];
    const updatedInvoices = [...state.invoices];

    for (const invId of selectedInvoices) {
      if (remaining <= 0) break;
      const invIdx = updatedInvoices.findIndex(i => i.id === invId);
      if (invIdx === -1) continue;
      
      const inv = updatedInvoices[invIdx];
      const balance = inv.totalAmount - inv.paidAmount;
      const paymentAmount = Math.min(remaining, balance);

      newPayments.push({
        id: generateId(),
        invoiceId: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customerId: inv.customerId,
        customerName: inv.customerName,
        date: getToday(),
        amount: paymentAmount,
        method: 'cash',
        reference: 'Bulk Payment',
        notes: '',
      });

      updatedInvoices[invIdx] = {
        ...inv,
        paidAmount: inv.paidAmount + paymentAmount,
        status: (inv.paidAmount + paymentAmount >= inv.totalAmount ? 'paid' : 'partial') as any,
      };

      remaining -= paymentAmount;
    }

    updateState({ payments: [...state.payments, ...newPayments], invoices: updatedInvoices });
    setSelectedInvoices(new Set());
    setBulkAmount(0);
  };

  const handlePaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const po = state.purchases.find(p => p.id === payForm.poId);
    if (!po) return;

    const newPayment: VendorPayment = {
      id: generateId(),
      poId: payForm.poId,
      poNumber: po.poNumber,
      vendorId: po.vendorId,
      vendorName: po.vendorName,
      date: payForm.date,
      amount: payForm.amount,
      method: payForm.method,
      reference: payForm.reference,
      notes: payForm.notes,
    };

    updateState({ vendorPayments: [...state.vendorPayments, newPayment] });
    setPayForm({ poId: '', date: getToday(), amount: 0, method: 'cash', accountId: '', reference: '', notes: '' });
    setShowPayForm(false);
  };

  const toggleInvoice = (id: string) => {
    const newSet = new Set(selectedInvoices);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedInvoices(newSet);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">💰 Payments</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-red-50 rounded-xl p-4 border border-red-100">
          <p className="text-sm text-red-600">Total Receivable</p>
          <p className="text-2xl font-bold text-red-700">{formatCurrency(totalReceivable)}</p>
          <p className="text-xs text-red-500">{outstandingInvoices.length} invoices pending</p>
        </div>
        <div className="bg-orange-50 rounded-xl p-4 border border-orange-100">
          <p className="text-sm text-orange-600">Total Payable</p>
          <p className="text-2xl font-bold text-orange-700">{formatCurrency(totalPayable)}</p>
          <p className="text-xs text-orange-500">{outstandingPOs.length} POs pending</p>
        </div>
        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
          <p className="text-sm text-emerald-600">Total Received</p>
          <p className="text-2xl font-bold text-emerald-700">{formatCurrency(state.payments.reduce((s, p) => s + p.amount, 0))}</p>
          <p className="text-xs text-emerald-500">{state.payments.length} payments recorded</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <button onClick={() => setActiveTab('outstanding')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'outstanding' ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          ⏳ Outstanding ({outstandingInvoices.length})
        </button>
        <button onClick={() => setActiveTab('received')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'received' ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          ✅ Received
        </button>
        <button onClick={() => setActiveTab('paid')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'paid' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          💸 Paid to Vendors
        </button>
        <button onClick={() => setActiveTab('adjustments')} className={`px-4 py-2 rounded-lg font-medium ${activeTab === 'adjustments' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700'}`}>
          ⚖️ Adjustments
        </button>
      </div>

      {/* Outstanding Tab */}
      {activeTab === 'outstanding' && (
        <>
          {/* Bulk Payment Section */}
          {selectedInvoices.size > 0 && (
            <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 mb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div>
                  <p className="font-semibold text-emerald-800">{selectedInvoices.size} invoice(s) selected</p>
                  <p className="text-sm text-emerald-600">
                    Total outstanding: {formatCurrency(
                      outstandingInvoices.filter(i => selectedInvoices.has(i.id)).reduce((s, i) => s + i.balance, 0)
                    )}
                  </p>
                </div>
                <input type="number" min="1" placeholder="Payment amount" value={bulkAmount || ''} onChange={e => setBulkAmount(parseFloat(e.target.value) || 0)} className="border rounded-lg px-4 py-2 outline-none w-40" />
                <button onClick={handleBulkPayment} disabled={bulkAmount <= 0} className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 disabled:opacity-50">
                  Record Bulk Payment
                </button>
                <button onClick={() => { setSelectedInvoices(new Set()); setBulkAmount(0); }} className="text-gray-500 hover:text-gray-700">Clear</button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600 w-8"></th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Invoice</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Total</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Balance</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Aging</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {outstandingInvoices.length === 0 ? (
                    <tr><td colSpan={8} className="text-center py-8 text-gray-400">🎉 All invoices are paid!</td></tr>
                  ) : outstandingInvoices.map(inv => (
                    <tr key={inv.id} className={`border-t hover:bg-gray-50 ${selectedInvoices.has(inv.id) ? 'bg-emerald-50' : ''}`}>
                      <td className="px-4 py-3">
                        <input type="checkbox" checked={selectedInvoices.has(inv.id)} onChange={() => toggleInvoice(inv.id)} />
                      </td>
                      <td className="px-4 py-3 font-medium text-emerald-700">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3">{inv.customerName}</td>
                      <td className="px-4 py-3 text-sm">{formatDate(inv.date)}</td>
                      <td className="px-4 py-3 text-right">{formatCurrency(inv.totalAmount)}</td>
                      <td className="px-4 py-3 text-right font-bold text-red-600">{formatCurrency(inv.balance)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          inv.daysOverdue > 90 ? 'bg-red-200 text-red-800' :
                          inv.daysOverdue > 60 ? 'bg-orange-200 text-orange-800' :
                          inv.daysOverdue > 30 ? 'bg-yellow-200 text-yellow-800' :
                          inv.daysOverdue > 0 ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-600'
                        }`}>
                          {inv.daysOverdue > 0 ? `${inv.daysOverdue}d overdue` : 'Not due'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button onClick={() => { setReceiveForm({ invoiceId: inv.id, date: getToday(), amount: inv.balance, method: 'cash', accountId: '', reference: '', notes: '' }); setShowReceiveForm(true); setActiveTab('received'); }} className="text-emerald-600 text-sm font-medium hover:text-emerald-800">
                          💵 Receive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Received Tab */}
      {activeTab === 'received' && (
        <>
          <button onClick={() => setShowReceiveForm(!showReceiveForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 mb-4">
            + Record Payment
          </button>

          {showReceiveForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h3 className="font-semibold mb-4">Record Customer Payment</h3>
              <form onSubmit={handleReceiveSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <select required value={receiveForm.invoiceId} onChange={e => setReceiveForm({...receiveForm, invoiceId: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="">Select Invoice *</option>
                  {state.invoices.filter(i => i.status !== 'paid').map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.customerName} (Bal: {formatCurrency(inv.totalAmount - inv.paidAmount)})</option>
                  ))}
                </select>
                <input type="number" min="1" required placeholder="Amount *" value={receiveForm.amount || ''} onChange={e => setReceiveForm({...receiveForm, amount: parseFloat(e.target.value) || 0})} className="border rounded-lg px-4 py-2 outline-none" />
                <select value={receiveForm.method} onChange={e => setReceiveForm({...receiveForm, method: e.target.value as any})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
                <input type="date" value={receiveForm.date} onChange={e => setReceiveForm({...receiveForm, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <input placeholder="Cheque/Ref Number" value={receiveForm.reference} onChange={e => setReceiveForm({...receiveForm, reference: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <div className="flex gap-3">
                  <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Record</button>
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
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Invoice</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Customer</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Method</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {state.payments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No payments received yet</td></tr>
                  ) : [...state.payments].reverse().map(p => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(p.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-emerald-700">{p.invoiceNumber}</td>
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

      {/* Paid to Vendors Tab */}
      {activeTab === 'paid' && (
        <>
          <button onClick={() => setShowPayForm(!showPayForm)} className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 mb-4">
            + Pay Vendor
          </button>

          {showPayForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h3 className="font-semibold mb-4">Record Vendor Payment</h3>
              <form onSubmit={handlePaySubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <select required value={payForm.poId} onChange={e => setPayForm({...payForm, poId: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="">Select PO *</option>
                  {outstandingPOs.map(po => (
                    <option key={po.id} value={po.id}>{po.poNumber} - {po.vendorName} (Bal: {formatCurrency(po.balance)})</option>
                  ))}
                </select>
                <input type="number" min="1" required placeholder="Amount *" value={payForm.amount || ''} onChange={e => setPayForm({...payForm, amount: parseFloat(e.target.value) || 0})} className="border rounded-lg px-4 py-2 outline-none" />
                <select value={payForm.method} onChange={e => setPayForm({...payForm, method: e.target.value as any})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="cash">Cash</option>
                  <option value="cheque">Cheque</option>
                  <option value="bank_transfer">Bank Transfer</option>
                </select>
                <input type="date" value={payForm.date} onChange={e => setPayForm({...payForm, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <input placeholder="Reference" value={payForm.reference} onChange={e => setPayForm({...payForm, reference: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <div className="flex gap-3">
                  <button type="submit" className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700">Record</button>
                  <button type="button" onClick={() => setShowPayForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Outstanding POs */}
          <div className="bg-orange-50 rounded-xl p-4 border border-orange-100 mb-4">
            <h3 className="font-semibold text-orange-800 mb-2">Outstanding to Vendors</h3>
            {outstandingPOs.map(po => (
              <div key={po.id} className="flex justify-between py-1 text-sm">
                <span>{po.poNumber} - {po.vendorName}</span>
                <span className="font-semibold text-orange-700">{formatCurrency(po.balance)}</span>
              </div>
            ))}
            <div className="flex justify-between pt-2 mt-2 border-t border-orange-200">
              <span className="font-bold">Total Payable</span>
              <span className="font-bold text-orange-700">{formatCurrency(totalPayable)}</span>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">PO #</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Vendor</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Method</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {state.vendorPayments.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-8 text-gray-400">No vendor payments yet</td></tr>
                  ) : [...state.vendorPayments].reverse().map(p => (
                    <tr key={p.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(p.date)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-blue-700">{p.poNumber}</td>
                      <td className="px-4 py-3">{p.vendorName}</td>
                      <td className="px-4 py-3 text-right font-semibold text-orange-600">{formatCurrency(p.amount)}</td>
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

      {/* Adjustments Tab */}
      {activeTab === 'adjustments' && (
        <>
          <div className="bg-purple-50 rounded-xl p-4 border border-purple-200 mb-4">
            <h3 className="font-semibold text-purple-800 mb-2">⚖️ Payment Adjustments</h3>
            <p className="text-sm text-gray-700">
              Jab customer short payment kare ya deduction ho (WHT, discount, write-off), yahan adjust karein. 
              Ye amount invoice se deduct hoga aur balance zero ho jayega.
            </p>
          </div>

          <button onClick={() => setShowAdjustForm(!showAdjustForm)} className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 mb-4">
            + Record Adjustment
          </button>

          {showAdjustForm && (
            <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
              <h3 className="font-semibold mb-4">Adjust Invoice Balance</h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const invoice = state.invoices.find(inv => inv.id === adjustForm.invoiceId);
                if (!invoice) return;

                // Update invoice paid amount to include adjustment
                const newPaidAmount = invoice.paidAmount + adjustForm.amount;
                const status = newPaidAmount >= invoice.totalAmount ? 'paid' : 'partial';

                // Add to expenses if it's a writeoff or discount
                if (adjustForm.type === 'writeoff' || adjustForm.type === 'discount' || adjustForm.type === 'wht') {
                  const categoryMap = { wht: 'Tax - WHT', discount: 'Discount Given', writeoff: 'Write-off' };
                  const expense = {
                    id: generateId(),
                    date: adjustForm.date,
                    category: categoryMap[adjustForm.type],
                    description: `${adjustForm.type.toUpperCase()} - ${invoice.customerName} - ${invoice.invoiceNumber}`,
                    amount: adjustForm.amount,
                    paymentMethod: 'adjustment',
                    accountId: '',
                  };
                  updateState({
                    invoices: state.invoices.map(inv => inv.id === invoice.id ? { ...inv, paidAmount: newPaidAmount, status: status as any } : inv),
                    expenses: [...state.expenses, expense],
                  });
                } else {
                  updateState({
                    invoices: state.invoices.map(inv => inv.id === invoice.id ? { ...inv, paidAmount: newPaidAmount, status: status as any } : inv),
                  });
                }

                setAdjustForm({ invoiceId: '', type: 'wht', amount: 0, date: getToday(), notes: '' });
                setShowAdjustForm(false);
              }} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <select required value={adjustForm.invoiceId} onChange={e => setAdjustForm({...adjustForm, invoiceId: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="">Select Invoice *</option>
                  {state.invoices.filter(i => i.status !== 'paid').map(inv => (
                    <option key={inv.id} value={inv.id}>{inv.invoiceNumber} - {inv.customerName} (Bal: {formatCurrency(inv.totalAmount - inv.paidAmount)})</option>
                  ))}
                </select>
                <select value={adjustForm.type} onChange={e => setAdjustForm({...adjustForm, type: e.target.value as any})} className="border rounded-lg px-4 py-2 outline-none">
                  <option value="wht">WHT (Withholding Tax)</option>
                  <option value="discount">Discount</option>
                  <option value="writeoff">Write-off</option>
                </select>
                <input type="number" min="1" required placeholder="Amount *" value={adjustForm.amount || ''} onChange={e => setAdjustForm({...adjustForm, amount: parseFloat(e.target.value) || 0})} className="border rounded-lg px-4 py-2 outline-none" />
                <input type="date" value={adjustForm.date} onChange={e => setAdjustForm({...adjustForm, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
                <input placeholder="Notes/Reason" value={adjustForm.notes} onChange={e => setAdjustForm({...adjustForm, notes: e.target.value})} className="border rounded-lg px-4 py-2 outline-none sm:col-span-2" />
                <div className="flex gap-3 sm:col-span-2">
                  <button type="submit" className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700">Record Adjustment</button>
                  <button type="button" onClick={() => setShowAdjustForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
                </div>
              </form>
            </div>
          )}

          {/* Show recent adjustments from expenses */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 bg-gray-50 border-b">
              <h3 className="font-semibold text-gray-700">Recent Adjustments</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Type</th>
                    <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Description</th>
                    <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {state.expenses.filter(e => e.category === 'Tax - WHT' || e.category === 'Discount Given' || e.category === 'Write-off').length === 0 ? (
                    <tr><td colSpan={4} className="text-center py-8 text-gray-400">No adjustments recorded yet</td></tr>
                  ) : [...state.expenses].filter(e => e.category === 'Tax - WHT' || e.category === 'Discount Given' || e.category === 'Write-off').reverse().map(exp => (
                    <tr key={exp.id} className="border-t hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm">{formatDate(exp.date)}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          exp.category === 'Tax - WHT' ? 'bg-blue-100 text-blue-700' :
                          exp.category === 'Discount Given' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>{exp.category}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">{exp.description}</td>
                      <td className="px-4 py-3 text-right font-semibold text-purple-600">{formatCurrency(exp.amount)}</td>
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
