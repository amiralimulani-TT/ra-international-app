import { AppState } from '../types';
import { formatCurrency, formatDate, getToday, daysBetween } from '../utils/storage';

interface Props { state: AppState; }

export default function Reports({ state }: Props) {
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

  // Customer-wise analysis
  const customerAnalysis = state.customers.map(c => {
    const invoices = state.invoices.filter(i => i.customerId === c.id);
    const revenue = invoices.reduce((s, i) => s + i.totalAmount, 0);
    const received = invoices.reduce((s, i) => s + i.paidAmount, 0);
    const balance = revenue - received;
    return { ...c, revenue, received, balance, invoiceCount: invoices.length };
  }).filter(c => c.revenue > 0).sort((a, b) => b.revenue - a.revenue);

  // Vendor-wise analysis
  const vendorAnalysis = state.vendors.map(v => {
    const pos = state.purchases.filter(p => p.vendorId === v.id);
    const cost = pos.reduce((s, p) => s + p.totalAmount, 0);
    const paid = state.vendorPayments.filter(vp => vp.poId && pos.some(p => p.id === vp.poId)).reduce((s, vp) => s + vp.amount, 0);
    const balance = cost - paid;
    return { ...v, cost, paid, balance, poCount: pos.length };
  }).filter(v => v.cost > 0).sort((a, b) => b.cost - a.cost);

  // Monthly breakdown
  const monthlyData: Record<string, { revenue: number; cost: number; expenses: number }> = {};
  state.invoices.forEach(inv => {
    const key = inv.date.substring(0, 7); // YYYY-MM
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, cost: 0, expenses: 0 };
    monthlyData[key].revenue += inv.totalAmount;
  });
  state.purchases.forEach(po => {
    const key = po.date.substring(0, 7);
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, cost: 0, expenses: 0 };
    monthlyData[key].cost += po.totalAmount;
  });
  state.expenses.forEach(exp => {
    const key = exp.date.substring(0, 7);
    if (!monthlyData[key]) monthlyData[key] = { revenue: 0, cost: 0, expenses: 0 };
    monthlyData[key].expenses += exp.amount;
  });

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

  // Expense by category
  const expenseByCategory = state.expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📈 Reports & Analysis</h1>

      {/* P&L */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">📊 Profit & Loss Statement</h2>
        <div className="space-y-2">
          <div className="flex justify-between py-2 border-b"><span className="text-gray-600 pl-4">Sales Revenue</span><span className="font-semibold text-emerald-600">{formatCurrency(totalRevenue)}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-600 pl-4">Cost of Goods Sold</span><span className="font-semibold text-red-600">- {formatCurrency(totalCost)}</span></div>
          <div className="flex justify-between py-2 bg-yellow-50 rounded px-3"><span className="font-bold">Gross Profit ({totalRevenue > 0 ? ((grossProfit/totalRevenue)*100).toFixed(1) : 0}%)</span><span className={`font-bold ${grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(grossProfit)}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-600 pl-4">Transport Charges</span><span className="font-semibold">- {formatCurrency(transportCost)}</span></div>
          <div className="flex justify-between py-2 border-b"><span className="text-gray-600 pl-4">Operating Expenses</span><span className="font-semibold">- {formatCurrency(totalExpenses)}</span></div>
          <div className="flex justify-between py-3 bg-emerald-100 rounded-lg px-4 mt-2">
            <span className="font-bold text-lg">NET PROFIT (Margin: {profitMargin}%)</span>
            <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Aging Report */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">📅 Aging Analysis (Receivables)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-4">
          <div className="bg-green-50 rounded-lg p-3 text-center border border-green-200">
            <p className="text-xs text-green-600 font-medium">Current</p>
            <p className="font-bold text-green-700 text-lg">{formatCurrency(aging.current)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center border border-blue-200">
            <p className="text-xs text-blue-600 font-medium">1-30 Days</p>
            <p className="font-bold text-blue-700 text-lg">{formatCurrency(aging.days30)}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-200">
            <p className="text-xs text-yellow-600 font-medium">31-60 Days</p>
            <p className="font-bold text-yellow-700 text-lg">{formatCurrency(aging.days60)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center border border-orange-200">
            <p className="text-xs text-orange-600 font-medium">61-90 Days</p>
            <p className="font-bold text-orange-700 text-lg">{formatCurrency(aging.days90)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center border border-red-200">
            <p className="text-xs text-red-600 font-medium">90+ Days</p>
            <p className="font-bold text-red-700 text-lg">{formatCurrency(aging.over90)}</p>
          </div>
        </div>
        <div className="flex justify-between py-2 bg-red-50 rounded-lg px-3">
          <span className="font-bold">Total Outstanding</span>
          <span className="font-bold text-red-700">{formatCurrency(totalReceivable)}</span>
        </div>
      </div>

      {/* Customer P&L */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">👥 Customer-wise Revenue & Balance</h2>
        {customerAnalysis.length === 0 ? <p className="text-gray-400">No data yet</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50"><th className="text-left p-2">Customer</th><th className="text-right p-2">Invoices</th><th className="text-right p-2">Revenue</th><th className="text-right p-2">Received</th><th className="text-right p-2">Balance</th></tr></thead>
              <tbody>
                {customerAnalysis.map(c => (
                  <tr key={c.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{c.name}</td>
                    <td className="p-2 text-right">{c.invoiceCount}</td>
                    <td className="p-2 text-right text-emerald-600">{formatCurrency(c.revenue)}</td>
                    <td className="p-2 text-right">{formatCurrency(c.received)}</td>
                    <td className="p-2 text-right font-semibold text-red-600">{formatCurrency(c.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Vendor Cost Analysis */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">🏭 Vendor-wise Cost & Payable</h2>
        {vendorAnalysis.length === 0 ? <p className="text-gray-400">No data yet</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50"><th className="text-left p-2">Vendor</th><th className="text-right p-2">POs</th><th className="text-right p-2">Total Cost</th><th className="text-right p-2">Paid</th><th className="text-right p-2">Payable</th></tr></thead>
              <tbody>
                {vendorAnalysis.map(v => (
                  <tr key={v.id} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{v.name}</td>
                    <td className="p-2 text-right">{v.poCount}</td>
                    <td className="p-2 text-right">{formatCurrency(v.cost)}</td>
                    <td className="p-2 text-right text-emerald-600">{formatCurrency(v.paid)}</td>
                    <td className="p-2 text-right font-semibold text-orange-600">{formatCurrency(v.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Monthly Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">📆 Monthly Summary</h2>
        {Object.keys(monthlyData).length === 0 ? <p className="text-gray-400">No data yet</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-gray-50"><th className="text-left p-2">Month</th><th className="text-right p-2">Revenue</th><th className="text-right p-2">Cost</th><th className="text-right p-2">Expenses</th><th className="text-right p-2">Profit</th></tr></thead>
              <tbody>
                {Object.entries(monthlyData).sort((a, b) => b[0].localeCompare(a[0])).map(([month, data]) => {
                  const profit = data.revenue - data.cost - data.expenses;
                  return (
                    <tr key={month} className="border-b hover:bg-gray-50">
                      <td className="p-2 font-medium">{month}</td>
                      <td className="p-2 text-right text-emerald-600">{formatCurrency(data.revenue)}</td>
                      <td className="p-2 text-right text-red-600">{formatCurrency(data.cost)}</td>
                      <td className="p-2 text-right text-purple-600">{formatCurrency(data.expenses)}</td>
                      <td className={`p-2 text-right font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(profit)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Balance Sheet */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">⚖️ Balance Sheet</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="font-semibold text-blue-700 uppercase text-sm mb-3">ASSETS</p>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b"><span>Cash/Bank</span><span className="font-semibold">{formatCurrency(totalPaidByCustomers)}</span></div>
              <div className="flex justify-between py-2 border-b"><span>Accounts Receivable</span><span className="font-semibold">{formatCurrency(totalReceivable)}</span></div>
              <div className="flex justify-between py-2 bg-blue-50 rounded px-3"><span className="font-bold">Total Assets</span><span className="font-bold">{formatCurrency(totalPaidByCustomers + totalReceivable)}</span></div>
            </div>
          </div>
          <div>
            <p className="font-semibold text-red-700 uppercase text-sm mb-3">LIABILITIES & EQUITY</p>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b"><span>Accounts Payable</span><span className="font-semibold">{formatCurrency(totalPayable)}</span></div>
              <div className="flex justify-between py-2 bg-red-50 rounded px-3"><span className="font-bold">Total Liabilities</span><span className="font-bold">{formatCurrency(totalPayable)}</span></div>
              <div className="flex justify-between py-2 bg-emerald-50 rounded px-3"><span className="font-bold">Owner's Equity</span><span className={`font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(netProfit)}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-bold text-gray-700 mb-4">💸 Expense Breakdown</h2>
        {Object.keys(expenseByCategory).length === 0 ? <p className="text-gray-400">No expenses</p> : (
          <div className="space-y-2">
            {Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
              <div key={cat} className="flex justify-between py-2 border-b">
                <span className="font-medium">{cat}</span>
                <span className="font-semibold text-purple-600">{formatCurrency(amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 bg-purple-50 rounded-lg px-3 mt-2">
              <span className="font-bold">Total</span>
              <span className="font-bold text-purple-700">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
