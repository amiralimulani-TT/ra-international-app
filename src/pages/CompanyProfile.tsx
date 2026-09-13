import { useState } from 'react';
import { AppState } from '../types';
import { generateId } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

export default function CompanyProfile({ state, updateState }: Props) {
  const [form, setForm] = useState({
    name: state.companyProfile.name,
    address: state.companyProfile.address,
    city: state.companyProfile.city,
    phone: state.companyProfile.phone,
    email: state.companyProfile.email,
    ntnNumber: state.companyProfile.ntnNumber,
    gstNumber: state.companyProfile.gstNumber,
  });

  const [showBankForm, setShowBankForm] = useState(false);
  const [bankForm, setBankForm] = useState({
    name: '',
    bankName: '',
    accountNumber: '',
    iban: '',
    branch: '',
    type: 'bank' as 'cash' | 'bank',
  });

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateState({
      companyProfile: {
        ...state.companyProfile,
        ...form,
      }
    });
    alert('✓ Company profile updated successfully!');
  };

  const handleAddBank = (e: React.FormEvent) => {
    e.preventDefault();
    const newBank = {
      id: generateId(),
      ...bankForm,
      balance: 0,
    };
    updateState({
      companyProfile: {
        ...state.companyProfile,
        bankAccounts: [...state.companyProfile.bankAccounts, newBank],
      }
    });
    setBankForm({ name: '', bankName: '', accountNumber: '', iban: '', branch: '', type: 'bank' });
    setShowBankForm(false);
  };

  const handleDeleteBank = (id: string) => {
    if (confirm('Delete this bank account?')) {
      updateState({
        companyProfile: {
          ...state.companyProfile,
          bankAccounts: state.companyProfile.bankAccounts.filter(b => b.id !== id),
        }
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          🏢 Company Profile
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your business details - will appear on all documents</p>
      </div>

      {/* Company Info Form */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <h3 className="font-semibold text-lg mb-4 text-gray-800">📋 Business Information</h3>
        <form onSubmit={handleSaveProfile} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Company Name *</label>
            <input 
              required
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Phone</label>
            <input 
              value={form.phone} 
              onChange={e => setForm({...form, phone: e.target.value})} 
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
            <input 
              type="email"
              value={form.email} 
              onChange={e => setForm({...form, email: e.target.value})} 
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">NTN Number</label>
            <input 
              value={form.ntnNumber} 
              onChange={e => setForm({...form, ntnNumber: e.target.value})} 
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">GST Number</label>
            <input 
              value={form.gstNumber} 
              onChange={e => setForm({...form, gstNumber: e.target.value})} 
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" 
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1 block">City</label>
            <input 
              value={form.city} 
              onChange={e => setForm({...form, city: e.target.value})} 
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all" 
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-sm font-medium text-gray-700 mb-1 block">Address</label>
            <textarea 
              value={form.address} 
              onChange={e => setForm({...form, address: e.target.value})} 
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all resize-none" 
            />
          </div>
          <div className="sm:col-span-2">
            <button 
              type="submit" 
              className="bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-2.5 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
            >
              ✓ Save Company Profile
            </button>
          </div>
        </form>
      </div>

      {/* Bank Accounts */}
      <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-lg text-gray-800">🏦 Bank Accounts & Cash</h3>
          <button 
            onClick={() => setShowBankForm(!showBankForm)} 
            className="bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-4 py-2 rounded-lg hover:shadow-lg transition-all duration-200 text-sm font-medium"
          >
            + Add Account
          </button>
        </div>

        {showBankForm && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4">
            <form onSubmit={handleAddBank} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Account Name *</label>
                <input 
                  required
                  placeholder="e.g., Main Cash, HBL Account"
                  value={bankForm.name} 
                  onChange={e => setBankForm({...bankForm, name: e.target.value})} 
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Type *</label>
                <select 
                  value={bankForm.type} 
                  onChange={e => setBankForm({...bankForm, type: e.target.value as any})} 
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none"
                >
                  <option value="cash">Cash</option>
                  <option value="bank">Bank</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Bank Name</label>
                <input 
                  placeholder="e.g., HBL, Meezan"
                  value={bankForm.bankName} 
                  onChange={e => setBankForm({...bankForm, bankName: e.target.value})} 
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Account Number</label>
                <input 
                  value={bankForm.accountNumber} 
                  onChange={e => setBankForm({...bankForm, accountNumber: e.target.value})} 
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">IBAN</label>
                <input 
                  value={bankForm.iban} 
                  onChange={e => setBankForm({...bankForm, iban: e.target.value})} 
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none" 
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 mb-1 block">Branch</label>
                <input 
                  value={bankForm.branch} 
                  onChange={e => setBankForm({...bankForm, branch: e.target.value})} 
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 outline-none" 
                />
              </div>
              <div className="sm:col-span-2 flex gap-3">
                <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">
                  ✓ Add Account
                </button>
                <button type="button" onClick={() => setShowBankForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {state.companyProfile.bankAccounts.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No bank accounts added yet</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {state.companyProfile.bankAccounts.map(account => (
              <div key={account.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h4 className="font-semibold text-gray-800">{account.name}</h4>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      account.type === 'cash' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {account.type.toUpperCase()}
                    </span>
                  </div>
                  <button 
                    onClick={() => handleDeleteBank(account.id)} 
                    className="text-red-500 hover:text-red-700 text-sm"
                  >
                    🗑️
                  </button>
                </div>
                {account.type === 'bank' && (
                  <div className="text-sm text-gray-600 space-y-1 mt-2">
                    {account.bankName && <p><span className="font-medium">Bank:</span> {account.bankName}</p>}
                    {account.accountNumber && <p><span className="font-medium">A/C:</span> {account.accountNumber}</p>}
                    {account.iban && <p><span className="font-medium">IBAN:</span> {account.iban}</p>}
                    {account.branch && <p><span className="font-medium">Branch:</span> {account.branch}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Box */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
        <h3 className="font-semibold text-purple-800 mb-2">💡 How This Works</h3>
        <ul className="text-sm text-gray-700 space-y-2">
          <li>• Company profile details will appear on all invoices, delivery notes, and purchase orders</li>
          <li>• Bank accounts will be shown on invoices for payment instructions</li>
          <li>• Cash accounts track cash received/paid</li>
          <li>• Bank accounts track bank transfers and cheques</li>
          <li>• You can add multiple accounts (e.g., HBL, Meezan, Cash, Petty Cash)</li>
        </ul>
      </div>
    </div>
  );
}
