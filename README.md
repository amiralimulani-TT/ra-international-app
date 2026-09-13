# RA International - Business Accounting System

Complete business accounting web application for RA International with modern UI/UX.

## 🚀 Features

### Core Features
- **Customer Management** - Add, edit, delete customers with NTN/GST details
- **Vendor Management** - Complete vendor database with balance tracking
- **Master Items** - Centralized item database with HS codes
- **Customer Orders** - Track customer demands/bookings
- **Purchase Orders** - Manage vendor purchases
- **Delivery Notes** - Create and print delivery notes
- **Invoices** - Generate invoices with GST (18%), print-ready
- **Payments** - Track received and made payments
- **Expenses** - Record business expenses
- **Inventory** - Real-time stock tracking
- **Company Profile** - Business details and bank accounts
- **Reports** - P&L, GST Report, Aging Analysis, Customer/Vendor ledgers

### Advanced Features
- **GST Management** - 18% GST with toggle option
- **Payment Adjustments** - WHT, Discount, Write-off handling
- **Multiple Bank Accounts** - Cash and bank account management
- **Print Layouts** - Professional invoice, delivery note, PO prints
- **Auto-complete** - Fast customer/vendor selection
- **Delivery to Invoice** - One-click conversion
- **Inventory Adjustment** - Post-audit stock corrections
- **Modern UI/UX** - Beautiful gradient design, responsive

---

## 🌐 Deployment Guide

### Option 1: Vercel (Recommended - FREE)

#### Step 1: Create GitHub Account
1. Go to https://github.com
2. Sign up for free account

#### Step 2: Upload Code to GitHub
```bash
# Install Git if not installed
# https://git-scm.com/downloads

# In your project folder
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ra-international.git
git push -u origin main
```

#### Step 3: Deploy on Vercel
1. Go to https://vercel.com
2. Click "Sign up with GitHub"
3. Authorize Vercel
4. Click "Add New Project"
5. Select your repository
6. Framework: Vite (auto-detected)
7. Click "Deploy"
8. Wait 2-3 minutes
9. Your app is live! 🎉

#### Step 4: Custom Domain (Optional)
1. Vercel Dashboard → Your Project
2. Settings → Domains
3. Add your domain (e.g., rainernational.com)
4. Update DNS records as shown
5. Wait for propagation (5 min - 48 hours)

---

### Option 2: Netlify (FREE)

1. Go to https://netlify.com
2. Sign up with GitHub
3. Click "Add new site" → "Import an existing project"
4. Select your GitHub repository
5. Build command: `npm run build`
6. Publish directory: `dist`
7. Click "Deploy site"
8. Done! Your site is live

---

### Option 3: GitHub Pages (FREE)

1. Push code to GitHub
2. Go to repository Settings → Pages
3. Source: GitHub Actions
4. Create workflow file or use existing
5. Your site will be at: `username.github.io/repo-name`

---

## 📊 Google Sheets Backup Setup

### Why Google Sheets?
- **FREE** - No cost
- **Accessible** - Anywhere, anytime
- **Backup** - Data safety
- **Multi-device** - Sync across devices

### Step-by-Step Setup

#### Step 1: Create Google Sheet
1. Go to https://sheets.google.com
2. Create new spreadsheet: "RA International Backup"
3. Create these tabs:
   - Customers
   - Vendors
   - Orders
   - Invoices
   - Payments
   - Expenses

#### Step 2: Add Headers (Row 1 of each tab)

**Customers Tab:**
```
id | name | contact | address | city | ntnNumber | gstNumber | creditLimit
```

**Vendors Tab:**
```
id | name | contact | address | city | ntnNumber | gstNumber
```

**Orders Tab:**
```
id | orderNumber | customerId | customerName | date | totalAmount | status
```

**Invoices Tab:**
```
id | invoiceNumber | customerId | customerName | date | totalAmount | paidAmount | status | gstAmount
```

**Payments Tab:**
```
id | invoiceId | customerName | date | amount | method | reference
```

**Expenses Tab:**
```
id | date | category | description | amount | paymentMethod
```

#### Step 3: Add Google Apps Script

1. In your Google Sheet: **Extensions → Apps Script**
2. Delete any existing code
3. Paste this code:

```javascript
// Google Apps Script - RA International Backup

function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet();
  var tab = e.parameter.tab || 'customers';
  var data = sheet.getSheetByName(tab).getDataRange().getValues();
  
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
  
  data.timestamp = new Date().toISOString();
  
  var headers = sheetObj.getRange(1, 1, 1, sheetObj.getLastColumn()).getValues()[0];
  var row = headers.map(function(header) {
    return data[header] || '';
  });
  
  sheetObj.appendRow(row);
  
  return ContentService
    .createTextOutput(JSON.stringify({status: 'success'}))
    .setMimeType(ContentService.MimeType.JSON);
}
```

4. Save project (name: "RA Backup API")

#### Step 4: Deploy Script

1. Click **Deploy → New deployment**
2. Click gear icon ⚙️ → Select **"Web app"**
3. Description: "RA International API"
4. Execute as: **Me**
5. Who has access: **Anyone**
6. Click **Deploy**
7. Copy the Web app URL:
   ```
   https://script.google.com/macros/s/AKfycbx.../exec
   ```

#### Step 5: Test Your API

**Read data:**
```
https://script.google.com/macros/s/YOUR_ID/exec?tab=Customers
```

**Write data:**
```javascript
fetch('https://script.google.com/macros/s/YOUR_ID/exec?tab=Customers', {
  method: 'POST',
  body: JSON.stringify({
    id: '123',
    name: 'Test Customer',
    contact: '0300-1234567'
  })
})
```

---

## 💾 Backup Strategy

### Current Method (Browser Storage)
- Data stored in browser localStorage
- **Risk:** Clear browser = data loss
- **Solution:** Regular exports

### Recommended Backup Routine

#### Daily
- Work normally in the app
- Data auto-saves to browser

#### Weekly (Every Friday)
1. Go to **Settings** page
2. Click **"Export Backup"**
3. Save JSON file to Google Drive
4. Name: `backup-YYYY-MM-DD.json`

#### Monthly (1st of every month)
1. Export JSON backup
2. Copy important data to Google Sheets
3. Verify data integrity
4. Archive old backups

### Emergency Recovery
If data is lost:
1. Go to **Settings** page
2. Click **"Import Data"**
3. Select your latest JSON backup
4. Data will be restored

---

## 🎯 Quick Start Guide

### First Time Setup

1. **Company Profile**
   - Go to 🏢 Company tab
   - Fill in your business details
   - Add bank accounts

2. **Add Master Items**
   - Go to 📦 Items tab
   - Add your products/services
   - Include HS codes if applicable

3. **Add Customers**
   - Go to 👥 Customers tab
   - Add customer details
   - Include NTN/GST numbers

4. **Add Vendors**
   - Go to 🏭 Vendors tab
   - Add vendor details

5. **Create First Order**
   - Go to 📋 Orders tab
   - Create customer order
   - Items auto-fill from master items

6. **Purchase from Vendor**
   - Go to 🛒 Purchases tab
   - Create purchase order
   - Mark as received when items arrive

7. **Create Delivery Note**
   - Go to 🚚 Deliveries tab
   - Select order
   - Items auto-fill
   - Print delivery note

8. **Generate Invoice**
   - Go to 🧾 Invoices tab
   - Click "From Delivery Notes"
   - Select delivery note
   - Items load automatically
   - GST auto-calculates
   - Print invoice

9. **Record Payment**
   - Go to 💰 Payments tab
   - Record received payment
   - Invoice status updates

10. **View Reports**
    - Go to 📈 Reports tab
    - Check P&L, GST Report
    - Review aging analysis

---

## 🔧 Troubleshooting

### Data Not Saving
- Check browser storage is enabled
- Clear cache and reload
- Export backup immediately

### Print Not Working
- Allow popups for the site
- Use Chrome/Edge browser
- Check printer settings

### GST Not Calculating
- Ensure GST toggle is ON
- Check GST rate (default 18%)
- Verify item prices

### Items Not Loading in Invoice
- Check delivery note has items
- Verify items are not already invoiced
- Try manual entry

---

## 📱 Mobile Usage

App is fully responsive:
- Works on phones and tablets
- Sidebar collapses to menu
- Touch-friendly buttons
- All features available

---

## 🔐 Security Notes

### Current Setup
- Data stored in browser (client-side)
- No server authentication
- Anyone with access can see data

### Recommendations
1. **Don't share URL publicly**
2. **Use password protection** (Vercel/Netlify offer this)
3. **Regular backups** (weekly minimum)
4. **HTTPS only** (automatic on Vercel/Netlify)

### Future Enhancements
- User authentication
- Multi-user support
- Role-based access
- Audit logs

---

## 📞 Support

### Common Questions

**Q: Can I use this on multiple devices?**
A: Currently no. Data is per-browser. Need Google Sheets backend for sync.

**Q: Is my data safe?**
A: Yes, but export regularly. Browser clear = data loss.

**Q: Can I customize the invoice format?**
A: Yes, edit PrintModal.tsx component.

**Q: How to change GST rate?**
A: It's in the invoice form. Default 18%, can change per invoice.

**Q: Can I add more bank accounts?**
A: Yes, go to Company Profile → Bank Accounts section.

---

## 🎓 Learning Resources

### For Non-Technical Users
1. Watch YouTube tutorials on:
   - "How to deploy React app on Vercel"
   - "Google Sheets as database"
   - "GitHub basics"

2. Ask for help:
   - GitHub Discussions
   - Stack Overflow
   - Local IT support

### For Developers
- React Documentation: https://react.dev
- Vite Documentation: https://vitejs.dev
- Tailwind CSS: https://tailwindcss.com
- Google Apps Script: https://developers.google.com/apps-script

---

## 📋 Checklist

### Before Going Live
- [ ] Company profile complete
- [ ] Bank accounts added
- [ ] Master items created
- [ ] Customers added
- [ ] Vendors added
- [ ] Test invoice created
- [ ] Test payment recorded
- [ ] Print layouts checked
- [ ] GST calculations verified
- [ ] Backup exported
- [ ] Deployed to Vercel/Netlify
- [ ] URL tested on mobile
- [ ] Google Sheet backup setup

### Weekly Maintenance
- [ ] Export JSON backup
- [ ] Check for errors
- [ ] Verify data integrity
- [ ] Update Google Sheets (if using)

---

## 🚀 Next Steps

1. **Deploy Now**
   - Follow Vercel guide above
   - Get your live URL

2. **Setup Backup**
   - Create Google Sheet
   - Add Apps Script
   - Deploy API

3. **Start Using**
   - Add real data
   - Create invoices
   - Track payments

4. **Regular Maintenance**
   - Weekly backups
   - Monthly reviews
   - Quarterly audits

---

## 📄 License

This is a custom-built application for RA International.
All rights reserved.

---

## 🎉 Success!

Your RA International Business Accounting System is ready!

**Key URLs:**
- App: https://your-app.vercel.app
- Google Sheet: https://docs.google.com/spreadsheets/d/YOUR_ID
- Backup: Settings → Export

**Remember:**
- Backup weekly
- Keep Google Sheet updated
- Test before major changes
- Ask for help when needed

---

**Built with ❤️ for RA International**
**Version: 2.0**
**Last Updated: 2026**
