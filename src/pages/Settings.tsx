import { AppState } from '../types';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function Settings({ state, updateState }: Props) {
  const handleExportData = () => {
    const dataStr = JSON.stringify(state, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ra-international-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          updateState(data);
          alert('✅ Data imported successfully!');
        } catch {
          alert('❌ Invalid file format');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  const handleClearData = () => {
    if (confirm('⚠️ Are you sure? This will delete ALL data permanently!')) {
      if (confirm('This action CANNOT be undone. Are you really sure?')) {
        updateState({
          masterItems: [], customers: [], vendors: [], orders: [], purchases: [],
          deliveries: [], transportReceipts: [], invoices: [],
          payments: [], vendorPayments: [], expenses: [], creditNotes: [],
        });
      }
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">⚙️ Settings & Info</h1>

      {/* Data Management */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">💾 Data Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <button onClick={handleExportData} className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700">📥 Export Backup</button>
          <button onClick={handleImportData} className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700">📤 Import Data</button>
          <button onClick={handleClearData} className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700">🗑️ Clear All Data</button>
        </div>
        <p className="text-sm text-gray-500 mt-3">Data stored in browser localStorage. Export regularly!</p>
      </div>

      {/* Features Guide */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">🚀 App Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 rounded-lg p-4">
            <h3 className="font-bold text-emerald-800 mb-2">📦 Master Items</h3>
            <p className="text-sm text-gray-700">Create items once, use them everywhere - Orders, Purchases, Deliveries, Invoices. Auto-fills rate and unit.</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-2">🔍 Auto-Complete</h3>
            <p className="text-sm text-gray-700">Search customers and vendors with auto-complete. Type to filter, click to select.</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <h3 className="font-bold text-purple-800 mb-2">🚚→🧾 Delivery to Invoice</h3>
            <p className="text-sm text-gray-700">Select items from delivery note and convert to invoice in one click. Full or partial invoicing.</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <h3 className="font-bold text-orange-800 mb-2">💰 Outstanding Payments</h3>
            <p className="text-sm text-gray-700">See all pending invoices with aging. Select multiple and record bulk payments.</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <h3 className="font-bold text-red-800 mb-2">📅 Aging Report</h3>
            <p className="text-sm text-gray-700">Track overdue payments by 30/60/90+ days. Know who needs follow-up.</p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-4">
            <h3 className="font-bold text-indigo-800 mb-2">📊 Customer P&L</h3>
            <p className="text-sm text-gray-700">See revenue, received, and balance for each customer. Know your best customers.</p>
          </div>
        </div>
      </div>

      {/* Workflow */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">📋 Business Workflow</h2>
        <div className="bg-emerald-50 rounded-lg p-4">
          <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
            <li><strong>📦 Items:</strong> Add master items first (optional but recommended)</li>
            <li><strong>👥 Customers:</strong> Add customers with contact details</li>
            <li><strong>🏭 Vendors:</strong> Add vendors</li>
            <li><strong>📋 Order:</strong> Customer order aata hai → Create order</li>
            <li><strong>🛒 Purchase:</strong> Vendor se maal mangwayein → Create PO</li>
            <li><strong>🚚 Delivery:</strong> Maal deliver karein → Create Delivery Note (auto-fills from order)</li>
            <li><strong>🧾 Invoice:</strong> Delivery Note se directly Invoice banayein (select items)</li>
            <li><strong>💰 Payment:</strong> Customer se payment receive karein / Vendor ko pay karein</li>
            <li><strong>💸 Expenses:</strong> Office/transport expenses add karein</li>
            <li><strong>📈 Reports:</strong> P&L, Balance Sheet, Aging, Customer analysis - sab auto!</li>
          </ol>
        </div>
      </div>

      {/* Deployment */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">🚀 FREE Deployment</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-emerald-700 mb-2">Vercel</h3>
            <p className="text-sm text-gray-600">vercel.com → Connect GitHub → Auto deploy. Free SSL & domain.</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-blue-700 mb-2">Netlify</h3>
            <p className="text-sm text-gray-600">netlify.com → Drag & drop deploy. 100GB free bandwidth.</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-purple-700 mb-2">GitHub Pages</h3>
            <p className="text-sm text-gray-600">Free hosting on github.io. Unlimited usage.</p>
          </div>
        </div>
      </div>

      {/* Google Sheets Backend */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">📊 Google Sheets as Backend (FREE)</h2>
        <div className="text-sm text-gray-600 space-y-3">
          <p>Google Sheets ko free backend ki tarah use karein:</p>
          <ol className="list-decimal pl-5 space-y-2">
            <li>Google Sheet banayein with tabs for each data type</li>
            <li>Tools → Script Editor mein Apps Script code paste karein</li>
            <li>Deploy as Web App → URL milega</li>
            <li>Frontend mein fetch() se data read/write karein</li>
          </ol>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-x-auto text-xs">
            <pre>{`function doGet(e) {
  var sheet = SpreadsheetApp.getActive()
    .getSheetByName(e.parameter.sheet);
  return ContentService
    .createTextOutput(JSON.stringify(
      sheet.getDataRange().getValues()
    )).setMimeType(ContentService.MimeType.JSON);
}`}</pre>
          </div>
        </div>
      </div>

      {/* Current Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-bold text-gray-700 mb-4">📊 Current Data</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {[
            { label: 'Items', count: state.masterItems.length, color: 'text-purple-600' },
            { label: 'Customers', count: state.customers.length, color: 'text-emerald-600' },
            { label: 'Vendors', count: state.vendors.length, color: 'text-blue-600' },
            { label: 'Orders', count: state.orders.length, color: 'text-orange-600' },
            { label: 'Invoices', count: state.invoices.length, color: 'text-pink-600' },
            { label: 'Deliveries', count: state.deliveries.length, color: 'text-indigo-600' },
          ].map(item => (
            <div key={item.label} className="text-center p-3 bg-gray-50 rounded-lg">
              <p className={`text-2xl font-bold ${item.color}`}>{item.count}</p>
              <p className="text-xs text-gray-500">{item.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
