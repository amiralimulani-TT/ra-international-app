import { formatCurrency, formatDate } from '../utils/storage';

interface PrintData {
  type: 'delivery' | 'invoice' | 'purchase';
  number: string;
  date: string;
  partyName: string;
  partyContact?: string;
  partyAddress?: string;
  partyCity?: string;
  orderRef?: string;
  items: { description: string; quantity: number; unit: string; rate: number; amount: number }[];
  totalAmount: number;
  transportMode?: string;
  trackingNumber?: string;
  notes?: string;
  dueDate?: string;
  paidAmount?: number;
}

interface Props {
  data: PrintData;
  onClose: () => void;
  companyName?: string;
}

export default function PrintModal({ data, onClose, companyName = 'RA International' }: Props) {
  const handlePrint = () => {
    window.print();
  };

  const titles = {
    delivery: 'DELIVERY NOTE',
    invoice: 'INVOICE',
    purchase: 'PURCHASE ORDER',
  };

  const colors = {
    delivery: 'from-blue-600 to-blue-800',
    invoice: 'from-emerald-600 to-emerald-800',
    purchase: 'from-purple-600 to-purple-800',
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Controls - hidden on print */}
        <div className="flex justify-between items-center p-4 border-b print:hidden">
          <h3 className="font-bold text-lg">Print Preview</h3>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700">
              🖨️ Print
            </button>
            <button onClick={onClose} className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300">
              Close
            </button>
          </div>
        </div>

        {/* Print Content */}
        <div className="p-8 print:p-0" id="print-content">
          {/* Header */}
          <div className={`bg-gradient-to-r ${colors[data.type]} text-white p-6 rounded-t-lg print:rounded-none`}>
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold">{companyName}</h1>
                <p className="text-sm opacity-90 mt-1">Supply & Trading</p>
              </div>
              <div className="text-right">
                <h2 className="text-xl font-bold">{titles[data.type]}</h2>
                <p className="text-sm opacity-90">#{data.number}</p>
              </div>
            </div>
          </div>

          {/* Info Section */}
          <div className="border-b p-6 grid grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">
                {data.type === 'purchase' ? 'Vendor' : 'Customer'}
              </p>
              <p className="font-bold text-lg">{data.partyName}</p>
              {data.partyContact && <p className="text-sm text-gray-600">📞 {data.partyContact}</p>}
              {data.partyAddress && <p className="text-sm text-gray-600">📍 {data.partyAddress}</p>}
              {data.partyCity && <p className="text-sm text-gray-600">🏙️ {data.partyCity}</p>}
            </div>
            <div className="text-right">
              <div className="space-y-1">
                <p className="text-sm"><span className="text-gray-500">Date:</span> <strong>{formatDate(data.date)}</strong></p>
                {data.dueDate && <p className="text-sm"><span className="text-gray-500">Due Date:</span> <strong>{formatDate(data.dueDate)}</strong></p>}
                {data.orderRef && <p className="text-sm"><span className="text-gray-500">Order Ref:</span> <strong>{data.orderRef}</strong></p>}
                {data.transportMode && <p className="text-sm"><span className="text-gray-500">Transport:</span> <strong>{data.transportMode}</strong></p>}
                {data.trackingNumber && <p className="text-sm"><span className="text-gray-500">Tracking #:</span> <strong>{data.trackingNumber}</strong></p>}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100 print:bg-gray-200">
                  <th className="text-left p-3 text-sm font-semibold">#</th>
                  <th className="text-left p-3 text-sm font-semibold">Description</th>
                  <th className="text-right p-3 text-sm font-semibold">Qty</th>
                  <th className="text-left p-3 text-sm font-semibold">Unit</th>
                  <th className="text-right p-3 text-sm font-semibold">Rate</th>
                  <th className="text-right p-3 text-sm font-semibold">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.items.map((item, idx) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3 text-sm">{idx + 1}</td>
                    <td className="p-3 text-sm font-medium">{item.description}</td>
                    <td className="p-3 text-sm text-right">{item.quantity}</td>
                    <td className="p-3 text-sm">{item.unit}</td>
                    <td className="p-3 text-sm text-right">{formatCurrency(item.rate)}</td>
                    <td className="p-3 text-sm text-right font-semibold">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="px-6 pb-6">
            <div className="flex justify-end">
              <div className="w-64">
                <div className="flex justify-between py-2 border-b">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(data.totalAmount)}</span>
                </div>
                {data.paidAmount !== undefined && data.paidAmount > 0 && (
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-gray-600">Paid</span>
                    <span className="font-semibold text-emerald-600">- {formatCurrency(data.paidAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between py-3 bg-gray-100 px-3 rounded mt-2">
                  <span className="font-bold text-lg">
                    {data.paidAmount !== undefined ? 'Balance Due' : 'Total'}
                  </span>
                  <span className="font-bold text-lg">
                    {formatCurrency(data.paidAmount !== undefined ? data.totalAmount - data.paidAmount : data.totalAmount)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {data.notes && (
            <div className="px-6 pb-6">
              <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Notes</p>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{data.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="border-t p-6 flex justify-between items-end">
            <div className="text-xs text-gray-400">
              <p>Generated by RA International Business Accounts</p>
              <p>Printed on: {new Date().toLocaleDateString()}</p>
            </div>
            <div className="text-center">
              <div className="border-t border-gray-400 w-48 pt-2">
                <p className="text-xs text-gray-500">Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
