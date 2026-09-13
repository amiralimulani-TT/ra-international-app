import { AppState } from '../types';
import { formatCurrency, getToday, daysBetween } from '../utils/storage';

interface Props { state: AppState; }

export default function Dashboard({ state }: Props) {
  const totalReceivable = state.invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
  const totalPayable = state.purchases.reduce((sum, po) => {
    const paid = state.vendorPayments.filter(vp => vp.poId === po.id).reduce((s, vp) => s + vp.amount, 0);
    return sum + (po.totalAmount - paid);
  }, 0);
  const totalRevenue = state.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCost = state.purchases.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const transportCost = state.transportReceipts.reduce((sum, t) => sum + t.amount, 0);
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpenses - transportCost;
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '0';

  // Aging buckets
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

  // Monthly revenue (current month)
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = state.invoices
    .filter(inv => { const d = new Date(inv.date); return d.getMonth() === currentMonth && d.getFullYear() === currentYear; })
    .reduce((s, inv) => s + inv.totalAmount, 0);

  const recentOrders = [...state.orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const unpaidInvoices = state.invoices.filter(i => i.status !== 'paid').sort((a, b) => (b.totalAmount - b.paidAmount) - (a.totalAmount - a.paidAmount)).slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Dashboard</h1>
      
      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Receivable</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalReceivable)}</p>
          <p className="text-xs text-gray-400 mt-1">From {state.invoices.filter(i => i.status !== 'paid').length} invoices</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Payable</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPayable)}</p>
          <p className="text-xs text-gray-400 mt-1">To vendors</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Net Profit</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</p>
          <p className="text-xs text-gray-400 mt-1">Margin: {profitMargin}%</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">This Month Revenue</p>
          <p className="text-2xl font-bold text-blue-600">{formatCurrency(monthlyRevenue)}</p>
          <p className="text-xs text-gray-400 mt-1">{new Date().toLocaleString('default', { month: 'long' })}</p>
        </div>
      </div>

      {/* Aging Report */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">📅 Receivables Aging</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-green-50 rounded-lg p-3 text-center">
            <p className="text-xs text-green-600">Current</p>
            <p className="font-bold text-green-700">{formatCurrency(aging.current)}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-3 text-center">
            <p className="text-xs text-blue-600">1-30 Days</p>
            <p className="font-bold text-blue-700">{formatCurrency(aging.days30)}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-3 text-center">
            <p className="text-xs text-yellow-600">31-60 Days</p>
            <p className="font-bold text-yellow-700">{formatCurrency(aging.days60)}</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-3 text-center">
            <p className="text-xs text-orange-600">61-90 Days</p>
            <p className="font-bold text-orange-700">{formatCurrency(aging.days90)}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-3 text-center">
            <p className="text-xs text-red-600">90+ Days</p>
            <p className="font-bold text-red-700">{formatCurrency(aging.over90)}</p>
          </div>
        </div>
      </div>

      {/* P&L Quick View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-700 mb-4">💹 P&L Summary</h3>
          <div className="space-y-2">
            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Revenue</span><span className="font-semibold text-emerald-600">{formatCurrency(totalRevenue)}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Cost of Goods</span><span className="font-semibold text-red-600">- {formatCurrency(totalCost)}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Gross Profit</span><span className={`font-semibold ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(grossProfit)}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Transport</span><span className="font-semibold text-orange-600">- {formatCurrency(transportCost)}</span></div>
            <div className="flex justify-between py-2 border-b"><span className="text-gray-600">Expenses</span><span className="font-semibold text-purple-600">- {formatCurrency(totalExpenses)}</span></div>
            <div className="flex justify-between py-3 bg-emerald-50 rounded-lg px-3 mt-2">
              <span className="font-bold">Net Profit</span>
              <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-700 mb-4">⚡ Quick Stats</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-emerald-600">{state.customers.length}</p>
              <p className="text-xs text-gray-500">Customers</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-blue-600">{state.vendors.length}</p>
              <p className="text-xs text-gray-500">Vendors</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-purple-600">{state.masterItems.length}</p>
              <p className="text-xs text-gray-500">Items</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-orange-600">{state.orders.length}</p>
              <p className="text-xs text-gray-500">Orders</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-indigo-600">{state.deliveries.length}</p>
              <p className="text-xs text-gray-500">Deliveries</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-pink-600">{state.invoices.length}</p>
              <p className="text-xs text-gray-500">Invoices</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-700 mb-4">📋 Recent Orders</h3>
          {recentOrders.length === 0 ? <p className="text-gray-400 text-sm">No orders yet</p> : (
            <div className="space-y-2">
              {recentOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div><p className="font-medium text-sm">{order.orderNumber}</p><p className="text-xs text-gray-500">{order.customerName}</p></div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'completed' ? 'bg-green-100 text-green-700' : order.status === 'partial' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{order.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border">
          <h3 className="font-semibold text-gray-700 mb-4">⏳ Top Unpaid Invoices</h3>
          {unpaidInvoices.length === 0 ? <p className="text-gray-400 text-sm">All paid! 🎉</p> : (
            <div className="space-y-2">
              {unpaidInvoices.map(inv => (
                <div key={inv.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div><p className="font-medium text-sm">{inv.invoiceNumber}</p><p className="text-xs text-gray-500">{inv.customerName}</p></div>
                  <span className="font-semibold text-sm text-red-600">{formatCurrency(inv.totalAmount - inv.paidAmount)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
