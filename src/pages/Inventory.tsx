import { AppState } from '../types';
import { formatCurrency } from '../utils/storage';

interface Props { state: AppState; }

export default function Inventory({ state }: Props) {
  // Calculate stock for each item
  // Stock IN = from Purchase Orders (received)
  // Stock OUT = from Delivery Notes
  // Remaining = IN - OUT

  const stockMap: Record<string, {
    name: string;
    unit: string;
    purchased: number;
    delivered: number;
    remaining: number;
    avgCostRate: number;
    avgSaleRate: number;
    totalCostValue: number;
    totalSaleValue: number;
  }> = {};

  // Initialize from master items
  state.masterItems.forEach(item => {
    stockMap[item.id] = {
      name: item.name,
      unit: item.unit,
      purchased: 0,
      delivered: 0,
      remaining: 0,
      avgCostRate: 0,
      avgSaleRate: 0,
      totalCostValue: 0,
      totalSaleValue: 0,
    };
  });

  // Add from purchases (Stock IN)
  state.purchases.filter(po => po.status === 'received').forEach(po => {
    po.items.forEach(item => {
      const key = item.itemId || item.description;
      if (!stockMap[key]) {
        stockMap[key] = {
          name: item.description,
          unit: item.unit,
          purchased: 0, delivered: 0, remaining: 0,
          avgCostRate: 0, avgSaleRate: 0,
          totalCostValue: 0, totalSaleValue: 0,
        };
      }
      stockMap[key].purchased += item.quantity;
      stockMap[key].totalCostValue += item.amount;
    });
  });

  // Add from deliveries (Stock OUT)
  state.deliveries.forEach(dn => {
    dn.items.forEach(item => {
      const key = item.itemId || item.description;
      if (!stockMap[key]) {
        stockMap[key] = {
          name: item.description,
          unit: item.unit,
          purchased: 0, delivered: 0, remaining: 0,
          avgCostRate: 0, avgSaleRate: 0,
          totalCostValue: 0, totalSaleValue: 0,
        };
      }
      stockMap[key].delivered += item.quantity;
      stockMap[key].totalSaleValue += item.quantity * item.unitPrice;
    });
  });

  // Also add from orders (what was ordered but not yet delivered)
  const pendingOrders: Record<string, number> = {};
  state.orders.forEach(order => {
    order.items.forEach(item => {
      const key = item.itemId || item.description;
      pendingOrders[key] = (pendingOrders[key] || 0) + item.pending;
    });
  });

  // Calculate remaining and averages
  Object.keys(stockMap).forEach(key => {
    const s = stockMap[key];
    s.remaining = s.purchased - s.delivered;
    s.avgCostRate = s.purchased > 0 ? s.totalCostValue / s.purchased : 0;
    s.avgSaleRate = s.delivered > 0 ? s.totalSaleValue / s.delivered : 0;
  });

  const stockList = Object.entries(stockMap).map(([id, data]) => ({
    id,
    ...data,
    pendingSale: pendingOrders[id] || 0,
  }));

  const totalStockValue = stockList.reduce((s, item) => s + (item.remaining * item.avgCostRate), 0);
  const lowStock = stockList.filter(s => s.remaining <= 5 && s.remaining > 0);
  const outOfStock = stockList.filter(s => s.remaining <= 0 && s.purchased > 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">📊 Inventory / Stock</h1>
          <p className="text-sm text-gray-500">Purchase (IN) → Delivery (OUT) → Remaining Stock</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <p className="text-2xl font-bold text-emerald-600">{stockList.length}</p>
          <p className="text-sm text-gray-500">Total Items</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <p className="text-2xl font-bold text-blue-600">{stockList.filter(s => s.remaining > 0).length}</p>
          <p className="text-sm text-gray-500">In Stock</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <p className="text-2xl font-bold text-yellow-600">{lowStock.length}</p>
          <p className="text-sm text-gray-500">Low Stock</p>
        </div>
        <div className="bg-white rounded-xl p-4 shadow-sm border text-center">
          <p className="text-2xl font-bold text-red-600">{outOfStock.length}</p>
          <p className="text-sm text-gray-500">Out of Stock</p>
        </div>
      </div>

      {/* Stock Value */}
      <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200 mb-6">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-emerald-800">Total Stock Value (at Cost)</span>
          <span className="text-2xl font-bold text-emerald-700">{formatCurrency(totalStockValue)}</span>
        </div>
      </div>

      {/* Low Stock Alert */}
      {lowStock.length > 0 && (
        <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200 mb-6">
          <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Low Stock Alert</h3>
          <div className="flex flex-wrap gap-2">
            {lowStock.map(item => (
              <span key={item.id} className="bg-yellow-200 text-yellow-800 px-3 py-1 rounded-full text-sm">
                {item.name}: {item.remaining} {item.unit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Stock Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Item</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Purchased (IN)</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Delivered (OUT)</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Pending Orders</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">In Stock</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Avg Cost</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Stock Value</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Status</th>
              </tr>
            </thead>
            <tbody>
              {stockList.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8 text-gray-400">No stock data. Add items and create purchase orders to start tracking inventory.</td></tr>
              ) : stockList.map(item => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.unit}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-emerald-600 font-semibold">{item.purchased}</td>
                  <td className="px-4 py-3 text-right text-red-600 font-semibold">{item.delivered}</td>
                  <td className="px-4 py-3 text-right text-orange-600">{item.pendingSale}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-bold text-lg ${item.remaining > 10 ? 'text-emerald-600' : item.remaining > 0 ? 'text-yellow-600' : 'text-red-600'}`}>
                      {item.remaining}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">{formatCurrency(item.avgCostRate)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatCurrency(item.remaining * item.avgCostRate)}</td>
                  <td className="px-4 py-3">
                    {item.remaining <= 0 && item.purchased > 0 ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-red-100 text-red-700">Out of Stock</span>
                    ) : item.remaining <= 5 ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">Low Stock</span>
                    ) : item.remaining > 0 ? (
                      <span className="px-2 py-1 rounded-full text-xs bg-green-100 text-green-700">In Stock</span>
                    ) : (
                      <span className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">No Data</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200 mt-6">
        <h3 className="font-semibold text-blue-800 mb-2">📋 How Inventory Works</h3>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• <strong>Purchased (IN):</strong> Jab Purchase Order "Received" mark hota hai, stock add hota hai</li>
          <li>• <strong>Delivered (OUT):</strong> Jab Delivery Note banta hai, stock reduce hota hai</li>
          <li>• <strong>Pending Orders:</strong> Customer ne order diya hai but abhi deliver nahi hua</li>
          <li>• <strong>In Stock:</strong> Purchased - Delivered = Available quantity</li>
          <li>• <strong>Stock Value:</strong> Remaining × Average Cost Rate</li>
        </ul>
      </div>
    </div>
  );
}
