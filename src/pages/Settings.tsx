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
          alert('Data imported successfully!');
        } catch {
          alert('Invalid file format');
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
          customers: [], vendors: [], orders: [], purchases: [],
          deliveries: [], transportReceipts: [], invoices: [],
          payments: [], vendorPayments: [], expenses: [],
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
          <button onClick={handleExportData} className="bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition">
            📥 Export Backup (JSON)
          </button>
          <button onClick={handleImportData} className="bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 transition">
            📤 Import Data
          </button>
          <button onClick={handleClearData} className="bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition">
            🗑️ Clear All Data
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-3">Data is stored in your browser's localStorage. Export regularly for backup!</p>
      </div>

      {/* Google Sheets Integration Guide */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">📊 Google Sheets as Free Backend</h2>
        <div className="prose prose-sm max-w-none">
          <p className="text-gray-600 mb-4">Google Sheets ko FREE backend ki tarah use kar sakte hain. Steps:</p>
          <ol className="list-decimal pl-5 space-y-3 text-gray-600">
            <li>
              <strong>Google Sheet Banayein:</strong> Ek new Google Sheet banayein with tabs: Customers, Vendors, Orders, Purchases, Deliveries, Invoices, Payments, Expenses
            </li>
            <li>
              <strong>Google Apps Script:</strong> Sheet mein Tools → Script Editor kholien. Yeh code paste karein jo API endpoints banata hai:
            </li>
          </ol>
          <div className="bg-gray-900 text-green-400 p-4 rounded-lg my-4 overflow-x-auto text-xs">
            <pre>{`// Google Apps Script Code
function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(e.parameter.sheet);
  var data = sheet.getDataRange().getValues();
  return ContentService.createTextOutput(
    JSON.stringify(data)
  ).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet()
    .getSheetByName(e.parameter.sheet);
  var data = JSON.parse(e.postData.contents);
  sheet.appendRow([new Date(), JSON.stringify(data)]);
  return ContentService.createTextOutput(
    JSON.stringify({status: "success"})
  );
}`}</pre>
          </div>
          <ol className="list-decimal pl-5 space-y-3 text-gray-600" start={3}>
            <li>
              <strong>Deploy:</strong> Deploy → New Deployment → Web App → Anyone can access
            </li>
            <li>
              <strong>URL milega:</strong> Jo aap frontend mein API URL ki tarah use karenge
            </li>
            <li>
              <strong>FREE hai!</strong> Google Apps Script free hai, Google Sheets free hai
            </li>
          </ol>
        </div>
      </div>

      {/* Free Deployment Options */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">🚀 FREE Deployment Options</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-emerald-700 mb-2">Vercel (Recommended)</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ vercel.com pe jaayein</li>
              <li>✅ GitHub se connect karein</li>
              <li>✅ Auto deploy ho jayega</li>
              <li>✅ Free SSL & Domain</li>
              <li>✅ Unlimited bandwidth</li>
            </ul>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-blue-700 mb-2">Netlify</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ netlify.com pe jaayein</li>
              <li>✅ Drag & drop deploy</li>
              <li>✅ Free SSL</li>
              <li>✅ 100GB bandwidth free</li>
              <li>✅ Custom domain support</li>
            </ul>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="font-bold text-purple-700 mb-2">GitHub Pages</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>✅ GitHub repo banayein</li>
              <li>✅ Settings → Pages enable</li>
              <li>✅ Free hosting</li>
              <li>✅ github.io domain</li>
              <li>✅ Unlimited usage</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Business Process */}
      <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
        <h2 className="text-lg font-bold text-gray-700 mb-4">📋 RA International - Business Process</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-emerald-50 rounded-lg p-4">
            <h3 className="font-bold text-emerald-800 mb-2">Workflow</h3>
            <ol className="list-decimal pl-5 text-sm text-gray-700 space-y-2">
              <li>Customer se Order aata hai → <strong>Orders</strong> mein add karein</li>
              <li>Vendor se maal mangwayein → <strong>Purchases</strong> mein add karein</li>
              <li>Maal aa gaya → <strong>Delivery Note</strong> banayein</li>
              <li>TCS/Daewoo receipt → <strong>Transport Receipts</strong> mein add karein</li>
              <li>Customer ko supply → Invoice banayein (full/partial)</li>
              <li>Customer payment → <strong>Payments Received</strong> record karein</li>
              <li>Vendor ko payment → <strong>Payments Made</strong> record karein</li>
              <li>Expenses → <strong>Expenses</strong> mein add karein</li>
              <li>Reports → P&L, Balance Sheet auto generate</li>
            </ol>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-bold text-blue-800 mb-2">Key Features</h3>
            <ul className="text-sm text-gray-700 space-y-2">
              <li>📊 Real-time Dashboard</li>
              <li>💰 Customer Receivables tracking</li>
              <li>🏭 Vendor Payables tracking</li>
              <li>🧾 Full/Partial Invoicing</li>
              <li>💵 Cash/Cheque/Bank payments</li>
              <li>🚚 Transport cost tracking</li>
              <li>💸 Expense management</li>
              <li>📈 Auto P&L & Balance Sheet</li>
              <li>💾 Data Export/Import backup</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Current Data Stats */}
      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <h2 className="text-lg font-bold text-gray-700 mb-4">📊 Current Data</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-emerald-600">{state.customers.length}</p>
            <p className="text-xs text-gray-500">Customers</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">{state.vendors.length}</p>
            <p className="text-xs text-gray-500">Vendors</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-purple-600">{state.orders.length}</p>
            <p className="text-xs text-gray-500">Orders</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">{state.invoices.length}</p>
            <p className="text-xs text-gray-500">Invoices</p>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-red-600">{state.expenses.length}</p>
            <p className="text-xs text-gray-500">Expenses</p>
          </div>
        </div>
      </div>
    </div>
  );
}
