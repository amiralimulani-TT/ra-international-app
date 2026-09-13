import { useState } from 'react';
import { AppState, Expense } from '../types';
import { generateId, getToday, formatCurrency, formatDate } from '../utils/storage';

interface Props { state: AppState; updateState: (u: Partial<AppState>) => void; }

const categories = ['Office Rent', 'Utilities', 'Salary', 'Transport/Fuel', 'Office Supplies', 'Phone/Internet', 'Marketing', 'Miscellaneous'];

export default function Expenses({ state, updateState }: Props) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: getToday(), category: '', description: '', amount: 0, paymentMethod: 'cash' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newExpense: Expense = {
      id: generateId(),
      date: form.date,
      category: form.category,
      description: form.description,
      amount: form.amount,
      paymentMethod: form.paymentMethod,
    };
    updateState({ expenses: [...state.expenses, newExpense] });
    setForm({ date: getToday(), category: '', description: '', amount: 0, paymentMethod: 'cash' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Delete this expense?')) {
      updateState({ expenses: state.expenses.filter(e => e.id !== id) });
    }
  };

  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">💸 Expenses</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition">
          + Add Expense
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl p-5 shadow-sm border mb-6">
        <div className="flex justify-between items-center">
          <span className="text-gray-600">Total Expenses</span>
          <span className="text-2xl font-bold text-purple-600">{formatCurrency(totalExpenses)}</span>
        </div>
      </div>

      {showForm && (
        <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
          <h3 className="font-semibold mb-4">New Expense</h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <input type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            <select required value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
              <option value="">Select Category *</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <input placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="border rounded-lg px-4 py-2 outline-none" />
            <input type="number" min="1" required placeholder="Amount (Rs.) *" value={form.amount || ''} onChange={e => setForm({...form, amount: parseFloat(e.target.value) || 0})} className="border rounded-lg px-4 py-2 outline-none" />
            <select value={form.paymentMethod} onChange={e => setForm({...form, paymentMethod: e.target.value})} className="border rounded-lg px-4 py-2 outline-none">
              <option value="cash">Cash</option>
              <option value="bank">Bank</option>
              <option value="cheque">Cheque</option>
            </select>
            <div className="flex gap-3">
              <button type="submit" className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700">Save</button>
              <button type="button" onClick={() => setShowForm(false)} className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300">Cancel</button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Date</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Category</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Description</th>
                <th className="text-right px-4 py-3 text-sm font-semibold text-gray-600">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Paid Via</th>
                <th className="text-left px-4 py-3 text-sm font-semibold text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody>
              {state.expenses.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-400">No expenses recorded yet</td></tr>
              ) : [...state.expenses].reverse().map(exp => (
                <tr key={exp.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{formatDate(exp.date)}</td>
                  <td className="px-4 py-3"><span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs">{exp.category}</span></td>
                  <td className="px-4 py-3 text-sm">{exp.description || '-'}</td>
                  <td className="px-4 py-3 text-right font-semibold text-purple-600">{formatCurrency(exp.amount)}</td>
                  <td className="px-4 py-3 text-sm capitalize">{exp.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:text-red-700 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
