import { AppState } from '../types';
import { formatCurrency, formatDate } from '../utils/storage';

interface Props { state: AppState; }

export default function Reports({ state }: Props) {
  const totalRevenue = state.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
  const totalCost = state.purchases.reduce((sum, po) => sum + po.totalAmount, 0);
  const totalExpenses = state.expenses.reduce((sum, e) => sum + e.amount, 0);
  const transportCost = state.transportReceipts.reduce((sum, t) => sum + t.amount, 0);
  const grossProfit = totalRevenue - totalCost;
  const netProfit = grossProfit - totalExpenses - transportCost;

  const totalReceivable = state.invoices.reduce((sum, inv) => sum + (inv.totalAmount - inv.paidAmount), 0);
  const totalPaidByCustomers = state.payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPayable = state.purchases.reduce((sum, po) => {
    const paid = state.vendorPayments.filter(vp => vp.poId === po.id).reduce((s, vp) => s + vp.amount, 0);
    return sum + (po.totalAmount - paid);
  }, 0);
  const totalPaidToVendors = state.vendorPayments.reduce((sum, p) => sum + p.amount, 0);

  // Customer-wise receivable
  const customerReceivables = state.invoices.reduce((acc, inv) => {
    const balance = inv.totalAmount - inv.paidAmount;
    if (balance > 0) {
      acc[inv.customerName] = (acc[inv.customerName] || 0) + balance;
    }
    return acc;
  }, {} as Record<string, number>);

  // Vendor-wise payable
  const vendorPayables = state.purchases.reduce((acc, po) => {
    const paid = state.vendorPayments.filter(vp => vp.poId === po.id).reduce((s, vp) => s + vp.amount, 0);
    const balance = po.totalAmount - paid;
    if (balance > 0) {
      acc[po.vendorName] = (acc[po.vendorName] || 0) + balance;
    }
    return acc;
  }, {} as Record<string, number>);

  // Expense breakdown
  const expenseByCategory = state.expenses.reduce((acc, e) => {
    acc[e.category] = (acc[e.category] || 0) + e.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">📈 Reports</h1>

      {/* P&L Statement */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">📊 Profit & Loss Statement</h2>
        <div className="space-y-3">
          <div className="border-b pb-3">
            <p className="font-semibold text-emerald-700 text-sm uppercase mb-2">Revenue</p>
            <div className="flex justify-between py-1">
              <span className="text-gray-600 pl-4">Sales / Invoiced Amount</span>
              <span className="font-semibold">{formatCurrency(totalRevenue)}</span>
            </div>
            <div className="flex justify-between py-2 bg-emerald-50 rounded px-3 mt-2">
              <span className="font-bold">Total Revenue</span>
              <span className="font-bold text-emerald-700">{formatCurrency(totalRevenue)}</span>
            </div>
          </div>

          <div className="border-b pb-3">
            <p className="font-semibold text-red-700 text-sm uppercase mb-2">Cost of Goods Sold</p>
            <div className="flex justify-between py-1">
              <span className="text-gray-600 pl-4">Purchase Cost</span>
              <span className="font-semibold">- {formatCurrency(totalCost)}</span>
            </div>
            <div className="flex justify-between py-2 bg-yellow-50 rounded px-3 mt-2">
              <span className="font-bold">Gross Profit</span>
              <span className={`font-bold ${grossProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(grossProfit)}</span>
            </div>
          </div>

          <div className="border-b pb-3">
            <p className="font-semibold text-purple-700 text-sm uppercase mb-2">Operating Expenses</p>
            <div className="flex justify-between py-1">
              <span className="text-gray-600 pl-4">Transport Charges</span>
              <span className="font-semibold">- {formatCurrency(transportCost)}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-gray-600 pl-4">Other Expenses</span>
              <span className="font-semibold">- {formatCurrency(totalExpenses)}</span>
            </div>
            <div className="flex justify-between py-2 bg-purple-50 rounded px-3 mt-2">
              <span className="font-bold">Total Expenses</span>
              <span className="font-bold text-purple-700">- {formatCurrency(totalExpenses + transportCost)}</span>
            </div>
          </div>

          <div className="flex justify-between py-3 bg-emerald-100 rounded-lg px-4 mt-4">
            <span className="font-bold text-lg">NET PROFIT / (LOSS)</span>
            <span className={`font-bold text-xl ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(netProfit)}</span>
          </div>
        </div>
      </div>

      {/* Balance Sheet */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">⚖️ Balance Sheet</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <p className="font-semibold text-blue-700 uppercase text-sm mb-3">ASSETS</p>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Cash / Bank (Payments Received)</span>
                <span className="font-semibold">{formatCurrency(totalPaidByCustomers)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Accounts Receivable</span>
                <span className="font-semibold">{formatCurrency(totalReceivable)}</span>
              </div>
              <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-3 mt-2">
                <span className="font-bold">Total Assets</span>
                <span className="font-bold text-blue-700">{formatCurrency(totalPaidByCustomers + totalReceivable)}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="font-semibold text-red-700 uppercase text-sm mb-3">LIABILITIES & EQUITY</p>
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Accounts Payable (Vendors)</span>
                <span className="font-semibold">{formatCurrency(totalPayable)}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-gray-600">Less: Paid to Vendors</span>
                <span className="font-semibold text-emerald-600">- {formatCurrency(totalPaidToVendors)}</span>
              </div>
              <div className="flex justify-between py-2 bg-red-50 rounded-lg px-3">
                <span className="font-bold">Total Liabilities</span>
                <span className="font-bold text-red-700">{formatCurrency(totalPayable)}</span>
              </div>
              <div className="flex justify-between py-3 bg-emerald-50 rounded-lg px-3 mt-2">
                <span className="font-bold">Owner's Equity (Net Profit)</span>
                <span className={`font-bold ${netProfit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{formatCurrency(netProfit)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Receivables */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">👥 Customer Receivables (Kitna Lena Hai)</h2>
        {Object.keys(customerReceivables).length === 0 ? (
          <p className="text-gray-400">No pending receivables</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(customerReceivables).map(([name, amount]) => (
              <div key={name} className="flex justify-between py-2 border-b">
                <span className="font-medium">{name}</span>
                <span className="font-semibold text-red-600">{formatCurrency(amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 bg-red-50 rounded-lg px-3 mt-2">
              <span className="font-bold">Total Receivable</span>
              <span className="font-bold text-red-700">{formatCurrency(totalReceivable)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Vendor Payables */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">🏭 Vendor Payables (Kitna Dena Hai)</h2>
        {Object.keys(vendorPayables).length === 0 ? (
          <p className="text-gray-400">No pending payables</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(vendorPayables).map(([name, amount]) => (
              <div key={name} className="flex justify-between py-2 border-b">
                <span className="font-medium">{name}</span>
                <span className="font-semibold text-orange-600">{formatCurrency(amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 bg-orange-50 rounded-lg px-3 mt-2">
              <span className="font-bold">Total Payable</span>
              <span className="font-bold text-orange-700">{formatCurrency(totalPayable)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Expense Breakdown */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">💸 Expense Breakdown</h2>
        {Object.keys(expenseByCategory).length === 0 ? (
          <p className="text-gray-400">No expenses recorded</p>
        ) : (
          <div className="space-y-2">
            {Object.entries(expenseByCategory).sort((a, b) => b[1] - a[1]).map(([cat, amount]) => (
              <div key={cat} className="flex justify-between py-2 border-b">
                <span className="font-medium">{cat}</span>
                <span className="font-semibold text-purple-600">{formatCurrency(amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 bg-purple-50 rounded-lg px-3 mt-2">
              <span className="font-bold">Total Expenses</span>
              <span className="font-bold text-purple-700">{formatCurrency(totalExpenses)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Transport Summary */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-bold text-gray-700 mb-4">🚚 Transport Summary</h2>
        {state.transportReceipts.length === 0 ? (
          <p className="text-gray-400">No transport receipts</p>
        ) : (
          <div className="space-y-2">
            {state.transportReceipts.map(t => (
              <div key={t.id} className="flex justify-between py-2 border-b text-sm">
                <span>{t.carrier} - {t.customerName} ({formatDate(t.date)})</span>
                <span className="font-semibold">{formatCurrency(t.amount)}</span>
              </div>
            ))}
            <div className="flex justify-between py-3 bg-blue-50 rounded-lg px-3 mt-2">
              <span className="font-bold">Total Transport Cost</span>
              <span className="font-bold text-blue-700">{formatCurrency(transportCost)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
