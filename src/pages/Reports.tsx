import { useState } from 'react';
import { AppState } from '../types';
import { formatCurrency, formatDate, getToday, daysBetween } from '../utils/storage';

interface Props { state: AppState; }

export default function Reports({ state }: Props) {
  const [activeTab, setActiveTab] = useState<'pl' | 'gst' | 'aging' | 'customer' | 'vendor' | 'monthly' | 'balance'>('pl');

  const totalRevenue = state.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCost = state.purchases.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const transportCost = state.transportReceipts.reduce((sum, t) => sum + t.amount, 0);
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpenses - transportCost;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  const totalReceivable = state.invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
  const totalPaidByCustomers = state.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPayable = state.purchases.reduce((sum, po) => {
    const paid = state.vendorPayments.filter(vp => vp.poId === po.id).reduce((s, vp) => s + vp.amount, 0);
    return sum + (po.totalAmount - paid);
  }, 0);

  // GST Report
  const gstCollected = state.invoices.reduce((sum, inv) => sum + (inv.gstAmount || 0), 0);
  const gstApplicableInvoices = state.invoices.filter(inv => inv.gstApplicable);

  // Aging
  const aging = { current: 0, days30: 0, days60: 0, days90: 0, over90: 0 };
  state.invoices.filter(i => i.status !== 'paid').forEach(inv => {
    const balance = inv.totalAmount - inv.paidAmount;
    const days = inv.dueDate ? daysBetween(inv.dueDate, getToday()) : 0;
    if (days <= 0) aging.current += balance;
    else if (days <= 30) aging.days30 += balance;
    else if (days <= 60) aging.days60 += balance;
    else if (days <= 90) aging.days90 += balance;
    else aging.over90 += balance;
  });

  // Customer analysis
  const customerAnalysis = state.customers.map(c => {
    const invoices = state.invoices.filter(i => i.customerId === c.id);
    const revenue = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const received = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const balance = revenue - received;
    return { ...c, revenue, received, balance, invoiceCount: invoices.length };
  }).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  // Vendor analysis
  const vendorAnalysis = state.vendors.map(v => {
    const pos = state.purchases.filter(p => p.vendorId === v.id);
    const cost = pos.reduce((s, p) => s + p.totalAmount, 0);
    const paid = state.vendorPayments.filter(vp => vp.poId && pos.some(p => p.id === vp.poId)).reduce((s, vp) => s + vp.amount, 0);
    const balance = cost - paid;
    return { ...v, cost, paid, balance, poCount: pos.length };
  }).filter(v => v.cost > 0).sort((a, b) => b.cost - a.cost);

  // Monthly data
  const monthlyData: Record<string, { revenue: number; cost: number; expenses: number; gst: number }> = {};
  state.invoices.forEach(inv => {
    const key = inv.date.substring(0, 7);
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, cost: 0, expenses: 0, gst: 0 };
    monthlyData[key].revenue += inv.subtotal || inv.totalAmount;
    monthlyData[key].gst += inv.gstAmount || 0;
  });
  state.purchases.forEach(po => {
    const key = po.date.substring(0, 7);
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, cost: 0, expenses: 0, gst: 0 };
    monthlyData[key].cost += po.totalAmount;
  });
  state.expenses.forEach(exp => {
    const key = exp.date.substring(0, 7);
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, cost: 0, expenses: 0, gst: 0 };
    monthlyData[key].expenses += exp.amount;
  });

  const tabs = [
    { id: 'pl', label: '📊 P&L', color: 'emerald' },
    { id: 'gst', label: '🧾 GST Report', color: 'orange' },
    { id: 'aging', label: '📅 Aging', color: 'red' },
    { id: 'customer', label: '👥 Customers', color: 'blue' },
    { id: 'vendor', label: '🏭 Vendors', color: 'purple' },
    { id: 'monthly', label: '📆 Monthly', color: 'indigo' },
    { id: 'balance', label: '⚖️ Balance Sheet', color: 'teal' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
          📈 Reports & Analysis
        </h1>
        <p className="text-gray-500 text-sm mt-1">Complete financial overview of your business</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-all ${
              activeTab === tab.id 
                ? `bg-${tab.color}-600 text-white shadow-lg` 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* P&L Statement */}
      {activeTab === 'pl' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">📊 Profit & Loss Statement</h2>
          <div className="space-y-3">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Sales Revenue</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Cost of Goods Sold</span>
              <span className="font-semibold text-red-600">- {formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between py-3 bg-yellow-50 rounded-lg px-4">
              <span className="font-bold">Gross Profit ({totalRevenue > 0 ? ((grossProfit/totalRevenue)*100).toFixed(1) : 0}%)</span>
              <span className={`font-bold ${grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(grossProfit)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Transport Charges</span>
              <span className="font-semibold">- {formatCurrency(transportCost)}</span>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <span className="text-gray-600">Operating Expenses</span>
              <span className="font-semibold">- {formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between py-4 bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg px-4 border border-emerald-200">
              <span className="font-bold text-lg">NET PROFIT (Margin: {profitMargin}%)</span>
              <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(netProfit)}</span>
            </div>
          </div>
        </div>
      )}

      {/* GST Report */}
      {activeTab === 'gst' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl p-6 border border-orange-200">
            <h2 className="text-xl font-bold text-gray-800 mb-4">🧾 GST Tax Report</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">Total GST Collected</p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(gstCollected)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">GST Invoices</p>
                <p className="text-2xl font-bold text-blue-600">{gstApplicableInvoices.length}</p>
              </div>
              <div className="bg-white rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">Total Taxable Sales</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(gstApplicableInvoices.reduce((s, i) => s + (i.subtotal || 0), 0))}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
            <h3 className="font-semibold text-lg mb-4">Invoice-wise GST Breakdown</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Invoice #</th>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-left p-3">Date</th>
                    <th className="text-right p-3">Subtotal</th>
                    <th className="text-right p-3">GST Rate</th>
                    <th className="text-right p-3">GST Amount</th>
                    <th className="text-right p-3">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {gstApplicableInvoices.length === 0 ? (
                    <tr><td colSpan={7} className="text-center py-8 text-gray-400">No GST invoices yet</td></tr>
                  ) : [...gstApplicableInvoices].reverse().map(inv => (
                    <tr key={inv.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium text-emerald-700">{inv.invoiceNumber}</td>
                      <td className="p-3">{inv.customerName}</td>
                      <td className="p-3">{formatDate(inv.date)}</td>
                      <td className="p-3 text-right">{formatCurrency(inv.subtotal || 0)}</td>
                      <td className="p-3 text-right">{inv.gstRate}%</td>
                      <td className="p-3 text-right font-semibold text-orange-600">{formatCurrency(inv.gstAmount || 0)}</td>
                      <td className="p-3 text-right font-bold">{formatCurrency(inv.totalAmount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-orange-50 font-bold">
                  <tr>
                    <td colSpan={3} className="p-3">TOTAL</td>
                    <td className="p-3 text-right">{formatCurrency(gstApplicableInvoices.reduce((s, i) => s + (i.subtotal || 0), 0))}</td>
                    <td className="p-3"></td>
                    <td className="p-3 text-right text-orange-600">{formatCurrency(gstCollected)}</td>
                    <td className="p-3 text-right">{formatCurrency(gstApplicableInvoices.reduce((s, i) => s + i.totalAmount, 0))}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Aging Report */}
      {activeTab === 'aging' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">📅 Receivables Aging Analysis</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
            <div className="bg-green-50 rounded-xl p-4 text-center border border-green-200">
              <p className="text-xs text-green-600 font-medium">Current</p>
              <p className="font-bold text-green-700 text-lg">{formatCurrency(aging.current)}</p>
            </div>
            <div className="bg-blue-50 rounded-xl p-4 text-center border border-blue-200">
              <p className="text-xs text-blue-600 font-medium">1-30 Days</p>
              <p className="font-bold text-blue-700 text-lg">{formatCurrency(aging.days30)}</p>
            </div>
            <div className="bg-yellow-50 rounded-xl p-4 text-center border border-yellow-200">
              <p className="text-xs text-yellow-600 font-medium">31-60 Days</p>
              <p className="font-bold text-yellow-700 text-lg">{formatCurrency(aging.days60)}</p>
            </div>
            <div className="bg-orange-50 rounded-xl p-4 text-center border border-orange-200">
              <p className="text-xs text-orange-600 font-medium">61-90 Days</p>
              <p className="font-bold text-orange-700 text-lg">{formatCurrency(aging.days90)}</p>
            </div>
            <div className="bg-red-50 rounded-xl p-4 text-center border border-red-200">
              <p className="text-xs text-red-600 font-medium">90+ Days</p>
              <p className="font-bold text-red-700 text-lg">{formatCurrency(aging.over90)}</p>
            </div>
          </div>
          <div className="flex justify-between py-3 bg-red-50 rounded-lg px-4 border border-red-200">
            <span className="font-bold">Total Outstanding</span>
            <span className="font-bold text-red-700 text-lg">{formatCurrency(totalReceivable)}</span>
          </div>
        </div>
      )}

      {/* Customer Analysis */}
      {activeTab === 'customer' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">👥 Customer-wise Ledger</h2>
          {customerAnalysis.length === 0 ? <p className="text-gray-400 text-center py-8">No data yet</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Customer</th>
                    <th className="text-right p-3">Invoices</th>
                    <th className="text-right p-3">Revenue</th>
                    <th className="text-right p-3">Received</th>
                    <th className="text-right p-3">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {customerAnalysis.map(c => (
                    <tr key={c.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3 text-right">{c.invoiceCount}</td>
                      <td className="p-3 text-right text-emerald-600">{formatCurrency(c.revenue)}</td>
                      <td className="p-3 text-right">{formatCurrency(c.received)}</td>
                      <td className="p-3 text-right font-semibold text-red-600">{formatCurrency(c.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Vendor Analysis */}
      {activeTab === 'vendor' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">🏭 Vendor-wise Ledger</h2>
          {vendorAnalysis.length === 0 ? <p className="text-gray-400 text-center py-8">No data yet</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Vendor</th>
                    <th className="text-right p-3">POs</th>
                    <th className="text-right p-3">Total Cost</th>
                    <th className="text-right p-3">Paid</th>
                    <th className="text-right p-3">Payable</th>
                  </tr>
                </thead>
                <tbody>
                  {vendorAnalysis.map(v => (
                    <tr key={v.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-medium">{v.name}</td>
                      <td className="p-3 text-right">{v.poCount}</td>
                      <td className="p-3 text-right">{formatCurrency(v.cost)}</td>
                      <td className="p-3 text-right text-emerald-600">{formatCurrency(v.paid)}</td>
                      <td className="p-3 text-right font-semibold text-orange-600">{formatCurrency(v.balance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Monthly Summary */}
      {activeTab === 'monthly' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">📆 Monthly Summary</h2>
          {Object.keys(monthlyData).length === 0 ? <p className="text-gray-400 text-center py-8">No data yet</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left p-3">Month</th>
                    <th className="text-right p-3">Revenue</th>
                    <th className="text-right p-3">GST</th>
                    <th className="text-right p-3">Cost</th>
                    <th className="text-right p-3">Expenses</th>
                    <th className="text-right p-3">Profit</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(monthlyData).sort((a, b) => b[0].localeCompare(a[0])).map(([month, data]) => {
                    const profit = data.revenue - data.cost - data.expenses;
                    return (
                      <tr key={month} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">{month}</td>
                        <td className="p-3 text-right text-emerald-600">{formatCurrency(data.revenue)}</td>
                        <td className="p-3 text-right text-orange-600">{formatCurrency(data.gst)}</td>
                        <td className="p-3 text-right text-red-600">{formatCurrency(data.cost)}</td>
                        <td className="p-3 text-right text-purple-600">{formatCurrency(data.expenses)}</td>
                        <td className={`p-3 text-right font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(profit)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Balance Sheet */}
      {activeTab === 'balance' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
          <h2 className="text-xl font-bold text-gray-800 mb-6">⚖️ Balance Sheet</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <p className="font-semibold text-blue-700 uppercase text-sm mb-3">ASSETS</p>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b"><span>Cash/Bank</span><span className="font-semibold">{formatCurrency(totalPaidByCustomers)}</span></div>
                <div className="flex justify-between py-2 border-b"><span>Accounts Receivable</span><span className="font-semibold">{formatCurrency(totalReceivable)}</span></div>
                <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-3"><span className="font-bold">Total Assets</span><span className="font-bold">{formatCurrency(totalPaidByCustomers + totalReceivable)}</span></div>
              </div>
            </div>
            <div>
              <p className="font-semibold text-red-700 uppercase text-sm mb-3">LIABILITIES & EQUITY</p>
              <div className="space-y-2">
                <div className="flex justify-between py-2 border-b"><span>Accounts Payable</span><span className="font-semibold">{formatCurrency(totalPayable)}</span></div>
                <div className="flex justify-between py-2 bg-red-50 rounded-lg px-3"><span className="font-bold">Total Liabilities</span><span className="font-bold">{formatCurrency(totalPayable)}</span></div>
                <div className="flex justify-between py-2 bg-emerald-50 rounded-lg px-3"><span className="font-bold">Owner's Equity</span><span className={`font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(netProfit)}</span></div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
