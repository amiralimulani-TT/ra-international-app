import { AppState } from '../types';
import { formatCurrency } from '../utils/storage';

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
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpenses;
  const transportCost = state.transportReceipts.reduce((sum, t) => sum + t.amount, 0);

  const recentOrders = [...state.orders].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);
  const recentInvoices = [...state.invoices].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📊 Dashboard</h1>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Receivable</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalReceivable)}</p>
          <p className="text-xs text-gray-400 mt-1">From Customers</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Payable</p>
          <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalPayable)}</p>
          <p className="text-xs text-gray-400 mt-1">To Vendors</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Net Profit</p>
          <p className={`text-2xl font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</p>
          <p className="text-xs text-gray-400 mt-1">Revenue - Cost - Expenses</p>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(totalExpenses + transportCost)}</p>
          <p className="text-xs text-gray-400 mt-1">Including Transport</p>
        </div>
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">💹 P&L Summary</h3>
          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Total Revenue (Invoiced)</span>
              <span className="font-semibold text-emerald-600">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Total Cost (Purchases)</span>
              <span className="font-semibold text-red-600">- {formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Gross Profit</span>
              <span className={`font-semibold ${grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(grossProfit)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Transport Charges</span>
              <span className="font-semibold text-orange-600">- {formatCurrency(transportCost)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Other Expenses</span>
              <span className="font-semibold text-purple-600">- {formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between py-3 bg-emerald-50 rounded-lg px-3 mt-2">
              <span className="font-bold text-gray-700">Net Profit</span>
              <span className={`font-bold text-lg ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">⚖️ Balance Sheet</h3>
          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-500 uppercase">Assets</p>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Accounts Receivable</span>
              <span className="font-semibold">{formatCurrency(totalReceivable)}</span>
            </div>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Cash/Bank (Payments Received)</span>
              <span className="font-semibold">{formatCurrency(state.payments.reduce((s, p) => s + p.amount, 0))}</span>
            </div>
            <div className="flex justify-between py-2 bg-blue-50 rounded-lg px-3">
              <span className="font-bold">Total Assets</span>
              <span className="font-bold">{formatCurrency(totalReceivable + state.payments.reduce((s, p) => s + p.amount, 0))}</span>
            </div>

            <p className="text-sm font-semibold text-gray-500 uppercase mt-4">Liabilities</p>
            <div className="flex justify-between py-2 border-b">
              <span className="text-gray-600">Accounts Payable (Vendors)</span>
              <span className="font-semibold">{formatCurrency(totalPayable)}</span>
            </div>
            <div className="flex justify-between py-2 bg-red-50 rounded-lg px-3">
              <span className="font-bold">Total Liabilities</span>
              <span className="font-bold">{formatCurrency(totalPayable)}</span>
            </div>

            <div className="flex justify-between py-3 bg-emerald-50 rounded-lg px-3 mt-2">
              <span className="font-bold">Owner's Equity (Capital)</span>
              <span className={`font-bold ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatCurrency(netProfit)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <p className="text-3xl font-bold text-emerald-600">{state.customers.length}</p>
          <p className="text-sm text-gray-500">Customers</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <p className="text-3xl font-bold text-blue-600">{state.vendors.length}</p>
          <p className="text-sm text-gray-500">Vendors</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <p className="text-3xl font-bold text-purple-600">{state.orders.length}</p>
          <p className="text-sm text-gray-500">Orders</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <p className="text-3xl font-bold text-orange-600">{state.invoices.length}</p>
          <p className="text-sm text-gray-500">Invoices</p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">📋 Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="text-gray-400 text-sm">No orders yet</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-gray-500">{order.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(order.totalAmount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      order.status === 'completed' ? 'bg-green-100 text-green-700' :
                      order.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{order.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-700 mb-4">🧾 Recent Invoices</h3>
          {recentInvoices.length === 0 ? (
            <p className="text-gray-400 text-sm">No invoices yet</p>
          ) : (
            <div className="space-y-3">
              {recentInvoices.map(inv => (
                <div key={inv.id} className="flex justify-between items-center py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium text-sm">{inv.invoiceNumber}</p>
                    <p className="text-xs text-gray-500">{inv.customerName}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(inv.totalAmount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      inv.status === 'paid' ? 'bg-green-100 text-green-700' :
                      inv.status === 'partial' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>{inv.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
