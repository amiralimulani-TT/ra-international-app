import { AppState } from '../types';
import { useState } from 'react';

interface Props { state: AppState; }

export default function GoogleSheetsGuide({ state }: Props) {
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const appsScriptCode = `// Google Apps Script - RA International Backup
// Paste this in your Google Sheet's Script Editor

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var tab = e.parameter.tab || 'customers';
  var data = sheet.getSheetByName(tab).getDataRange().getValues();
  
  // Convert to JSON
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var tab = e.parameter.tab || 'customers';
  var data = JSON.parse(e.postData.contents);
  var sheetObj = sheet.getSheetByName(tab);
  
  // Add timestamp
  data.timestamp = new Date().toISOString();
  
  // Append row
  var headers = sheetObj.getRange(1, 1, 1, sheetObj.getLastColumn()).getValues()[0];
  var row = headers.map(function(header) {
    return data[header] || '';
  });
  
  sheetObj.appendRow(row);
  
  return ContentService
    .createTextOutput(JSON.stringify({status: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}

// Function to export all data at once
function exportAllData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var allData = {
    customers: getSheetData(sheet, 'Customers'),
    vendors: getSheetData(sheet, 'Vendors'),
    orders: getSheetData(sheet, 'Orders'),
    invoices: getSheetData(sheet, 'Invoices'),
    payments: getSheetData(sheet, 'Payments'),
    timestamp: new Date().toISOString()
  };
  
  return ContentService
    .createTextOutput(JSON.stringify(allData))
    .setMimeType(ContentService.MimeType.JSON);
}

function getSheetData(sheet, tabName) {
  var data = sheet.getSheetByName(tabName).getDataRange().getValues();
  var headers = data[0];
  var result = [];
  for (var i = 1; i < data.length; i++) {
    var obj = {};
    for (var j = 0; j < headers.length; j++) {
      obj[headers[j]] = data[i][j];
    }
    result.push(obj);
  }
  return result;
}`;

  const exportInstructions = `
# Google Sheets Backup Setup Guide

## Step 1: Create Google Sheet
1. Go to https://sheets.google.com
2. Create new spreadsheet named "RA International Backup"
3. Create these tabs (sheets):
   - Customers
   - Vendors  
   - Orders
   - Invoices
   - Payments
   - Expenses

## Step 2: Add Headers
For each tab, add headers in Row 1:

### Customers Tab:
id | name | contact | address | city | ntnNumber | gstNumber | creditLimit

### Vendors Tab:
id | name | contact | address | city | ntnNumber | gstNumber

### Orders Tab:
id | orderNumber | customerId | customerName | date | totalAmount | status

### Invoices Tab:
id | invoiceNumber | customerId | customerName | date | totalAmount | paidAmount | status | gstAmount

### Payments Tab:
id | invoiceId | customerName | date | amount | method | reference

### Expenses Tab:
id | date | category | description | amount | paymentMethod

## Step 3: Add Apps Script
1. In your Google Sheet, click Extensions → Apps Script
2. Delete any existing code
3. Paste the Apps Script code (shown below)
4. Save the project (name it "RA Backup API")

## Step 4: Deploy
1. Click Deploy → New deployment
2. Click gear icon → Select "Web app"
3. Description: "RA International API"
4. Execute as: Me
5. Who has access: Anyone
6. Click Deploy
7. Copy the Web app URL (it will look like):
   https://script.google.com/macros/s/AKfycbx.../exec

## Step 5: Use the URL
Your backup URL is now ready! You can:
- Read data: [URL]?tab=Customers
- Write data: POST to [URL]?tab=Customers with JSON data

## Step 6: Manual Export (Easiest)
For now, use the Export button in Settings to download JSON backup.
You can import this JSON into Google Sheets manually:
1. Open the JSON file
2. Copy the data
3. Paste into respective Google Sheet tabs

## Alternative: Automated Backup Script
You can set up a time-driven trigger in Apps Script to automatically
export data every day/week.
`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          📊 Google Sheets Backup Setup
        </h1>
        <p className="text-gray-500 text-sm mt-1">Complete guide to setup Google Sheets as your free backend</p>
      </div>

      {/* Quick Steps */}
      <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl p-6 border border-green-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🚀 Quick Setup Steps</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-green-700 mb-2">Step 1: Create Sheet</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Go to sheets.google.com</li>
              <li>Create "RA International Backup"</li>
              <li>Add tabs: Customers, Vendors, Orders, Invoices, Payments</li>
            </ol>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-blue-700 mb-2">Step 2: Add Headers</h3>
            <p className="text-sm text-gray-700">Add column headers in Row 1 of each tab (see details below)</p>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-purple-700 mb-2">Step 3: Add Script</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Extensions → Apps Script</li>
              <li>Paste the code below</li>
              <li>Save project</li>
            </ol>
          </div>
          <div className="bg-white rounded-xl p-4 shadow-sm">
            <h3 className="font-bold text-orange-700 mb-2">Step 4: Deploy</h3>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
              <li>Deploy → New deployment</li>
              <li>Select "Web app"</li>
              <li>Access: Anyone</li>
              <li>Copy the URL</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Apps Script Code */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">📝 Google Apps Script Code</h2>
          <button
            onClick={() => copyToClipboard(appsScriptCode, 'script')}
            className={`px-4 py-2 rounded-lg font-medium transition-all ${
              copied === 'script' 
                ? 'bg-green-600 text-white' 
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {copied === 'script' ? '✓ Copied!' : '📋 Copy Code'}
          </button>
        </div>
        <div className="bg-gray-900 rounded-xl p-4 overflow-x-auto">
          <pre className="text-green-400 text-sm font-mono whitespace-pre-wrap">{appsScriptCode}</pre>
        </div>
      </div>

      {/* Tab Headers */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Tab Headers (Add in Row 1)</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Customers Tab:</h3>
            <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono">
              id | name | contact | address | city | ntnNumber | gstNumber | creditLimit
            </code>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Vendors Tab:</h3>
            <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono">
              id | name | contact | address | city | ntnNumber | gstNumber
            </code>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Orders Tab:</h3>
            <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono">
              id | orderNumber | customerId | customerName | date | totalAmount | status
            </code>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Invoices Tab:</h3>
            <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono">
              id | invoiceNumber | customerId | customerName | date | totalAmount | paidAmount | status | gstAmount
            </code>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Payments Tab:</h3>
            <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono">
              id | invoiceId | customerName | date | amount | method | reference
            </code>
          </div>
        </div>
      </div>

      {/* Manual Export Option */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-6 border border-yellow-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">💡 Easiest Method: Manual Export</h2>
        <div className="space-y-3 text-sm text-gray-700">
          <p><strong>Option 1: JSON Export (Recommended for now)</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>Go to Settings page in your app</li>
            <li>Click "Export Backup" button</li>
            <li>JSON file download hoga</li>
            <li>Is file ko Google Drive me save karo</li>
            <li>Monthly ya weekly backup lo</li>
          </ol>
          
          <p className="mt-4"><strong>Option 2: Copy-Paste to Sheets</strong></p>
          <ol className="list-decimal list-inside space-y-1 ml-4">
            <li>JSON file open karo (Notepad++ ya VS Code me)</li>
            <li>Customers array copy karo</li>
            <li>Google Sheets me paste karo</li>
            <li>Same for Vendors, Orders, etc.</li>
          </ol>

          <p className="mt-4"><strong>Option 3: CSV Export (Future Feature)</strong></p>
          <p className="ml-4">Hum CSV export feature add kar sakte hain jo directly Google Sheets compatible hoga</p>
        </div>
      </div>

      {/* Deployment Guide */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🚀 Deployment Guide</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-lg text-blue-700 mb-2">Option 1: Vercel (Recommended - FREE)</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
              <li>
                <strong>GitHub pe code upload karo:</strong>
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>github.com pe jao</li>
                  <li>New repository banao</li>
                  <li>Code upload karo (ya VS Code se push karo)</li>
                </ul>
              </li>
              <li>
                <strong>Vercel pe deploy karo:</strong>
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>vercel.com pe jao</li>
                  <li>GitHub se sign up karo</li>
                  <li>"Add New Project" click karo</li>
                  <li>Repository select karo</li>
                  <li>Deploy click karo</li>
                  <li>2-3 minute me live!</li>
                </ul>
              </li>
              <li>
                <strong>Custom domain (optional):</strong>
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>Vercel Settings → Domains</li>
                  <li>Apna domain add karo</li>
                  <li>DNS update karo</li>
                </ul>
              </li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold text-lg text-purple-700 mb-2">Option 2: Netlify (Also FREE)</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
              <li>netlify.com pe jao</li>
              <li>GitHub se connect karo</li>
              <li>Repository select karo</li>
              <li>Build command: <code className="bg-gray-100 px-2 py-1 rounded">npm run build</code></li>
              <li>Publish directory: <code className="bg-gray-100 px-2 py-1 rounded">dist</code></li>
              <li>Deploy!</li>
            </ol>
          </div>

          <div>
            <h3 className="font-bold text-lg text-green-700 mb-2">Option 3: GitHub Pages (FREE)</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700 ml-4">
              <li>GitHub repository me jao</li>
              <li>Settings → Pages</li>
              <li>Source: GitHub Actions select karo</li>
              <li>Workflow setup karo</li>
              <li>URL: username.github.io/repo-name</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Important Notes */}
      <div className="bg-gradient-to-r from-red-50 to-pink-50 rounded-2xl p-6 border border-red-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">⚠️ Important Notes</h2>
        <ul className="space-y-2 text-sm text-gray-700">
          <li>• <strong>Data Storage:</strong> Abhi data browser localStorage me hai. Clear browser data = data loss</li>
          <li>• <strong>Regular Backup:</strong> Weekly JSON export zaroor karo</li>
          <li>• <strong>Google Sheets:</strong> Free hai but limited API calls per day (10,000)</li>
          <li>• <strong>Security:</strong> Google Sheets public nahi rakhna, sirf apne liye use karo</li>
          <li>• <strong>Multiple Devices:</strong> Agar multiple devices pe use karna hai to Google Sheets backend zaroori hai</li>
        </ul>
      </div>

      {/* Next Steps */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-200">
        <h2 className="text-xl font-bold text-gray-800 mb-4">🎯 Recommended Next Steps</h2>
        <ol className="space-y-3 text-sm text-gray-700">
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
            <span><strong>Abhi ke liye:</strong> Settings → Export Backup karo (JSON file save karo)</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
            <span><strong>Google Sheet banao:</strong> Upar diye gaye steps follow karo</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
            <span><strong>Vercel pe deploy karo:</strong> GitHub → Vercel → Deploy</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
            <span><strong>Weekly backup routine:</strong> Har Friday ko export karo</span>
          </li>
          <li className="flex gap-3">
            <span className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">5</span>
            <span><strong>Future:</strong> Hum automated Google Sheets sync feature add kar sakte hain</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
