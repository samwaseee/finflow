// src/app/dashboard/expenses/page.tsx

"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Receipt, 
  Wallet, 
  DollarSign, 
  CalendarDays, 
  Tag, 
  AlignLeft 
} from "lucide-react";

type Expense = {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes: string | null;
};

type FormData = {
  category: string;
  amount: string;
  date: string;
  notes: string;
};

const CATEGORIES = [
  "Software & Tools",
  "Marketing",
  "Salaries",
  "Office & Rent",
  "Travel",
  "Hardware",
  "Taxes & Fees",
  "Other",
];

// Upgraded category styles with soft backgrounds and subtle borders
const CATEGORY_STYLES: Record<string, string> = {
  "Software & Tools": "bg-indigo-50 text-indigo-700 border-indigo-200",
  "Marketing":        "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200",
  "Salaries":         "bg-emerald-50 text-emerald-700 border-emerald-200",
  "Office & Rent":    "bg-amber-50 text-amber-700 border-amber-200",
  "Travel":           "bg-sky-50 text-sky-700 border-sky-200",
  "Hardware":         "bg-violet-50 text-violet-700 border-violet-200",
  "Taxes & Fees":     "bg-rose-50 text-rose-700 border-rose-200",
  "Other":            "bg-slate-50 text-slate-700 border-slate-200",
};

const empty: FormData = {
  category: CATEGORIES[0],
  amount: "",
  date: new Date().toISOString().split("T")[0],
  notes: "",
};

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState("ALL");

  async function fetchExpenses() {
    try {
      const res = await fetch("/api/expenses");
      const data = await res.json();
      setExpenses(data);
    } catch (err) {
      console.error("Failed to fetch expenses", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchExpenses();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError("");
    setModalOpen(true);
  }

  function openEdit(expense: Expense) {
    setEditing(expense);
    setForm({
      category: expense.category,
      amount: String(expense.amount),
      date: new Date(expense.date).toISOString().split("T")[0],
      notes: expense.notes || "",
    });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = editing ? `/api/expenses/${editing.id}` : "/api/expenses";
    const method = editing ? "PATCH" : "POST";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount),
        }),
      });

      if (res.ok) {
        await fetchExpenses();
        setModalOpen(false);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Failed to save expense. Please check your connection.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Are you sure you want to delete this expense? This action cannot be undone.")) return;
    setDeletingId(id);
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    await fetchExpenses();
    setDeletingId(null);
  }

  const filtered =
    filterCategory === "ALL"
      ? expenses
      : expenses.filter((e) => e.category === filterCategory);

  const total = filtered.reduce((sum, e) => sum + Number(e.amount), 0);

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm">
              <Wallet size={24} strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Expenses</h1>
          </div>
          <p className="text-gray-500 mt-1">
            Showing <strong className="text-gray-900 font-semibold">{filtered.length}</strong> record{filtered.length !== 1 ? "s" : ""} totaling{" "}
            <strong className="text-blue-600 font-semibold text-lg">${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-md transition-all active:scale-95 w-full md:w-auto"
        >
          <Plus size={18} strokeWidth={2.5} />
          New Expense
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {["ALL", ...CATEGORIES].map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-medium transition-all border ${
              filterCategory === cat
                ? "bg-gray-900 text-white border-gray-900 shadow-md"
                : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 space-y-4">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-sm font-medium">Loading expenses...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-2xl border-dashed flex flex-col items-center justify-center py-24 px-4 text-center">
          <div className="bg-gray-50 p-4 rounded-full mb-4">
            <Receipt size={32} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No expenses found</h3>
          <p className="text-gray-500 max-w-sm mb-6">
            {filterCategory === "ALL" 
              ? "You haven't tracked any expenses yet. Add your first expense to get started." 
              : `You don't have any expenses in the ${filterCategory} category.`}
          </p>
          <button 
            onClick={openCreate} 
            className="text-blue-600 font-medium hover:text-blue-700 flex items-center gap-1"
          >
            <Plus size={16} /> Add an expense
          </button>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/50">
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Category</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Date</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Notes</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs text-right">Amount</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((expense) => (
                  <tr
                    key={expense.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium border ${
                          CATEGORY_STYLES[expense.category] ?? CATEGORY_STYLES["Other"]
                        }`}
                      >
                        {expense.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-600 font-medium">
                      {new Date(expense.date).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                    <td className="px-6 py-4 text-gray-500 max-w-xs truncate">
                      {expense.notes ? (
                        <span className="truncate">{expense.notes}</span>
                      ) : (
                        <span className="text-gray-300 italic">No notes added</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-semibold text-gray-900">
                      ${Number(expense.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(expense)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit expense"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          disabled={deletingId === expense.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40"
                          title="Delete expense"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? "Edit Expense" : "Add New Expense"}
              </h2>
            </div>

            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Tag size={16} className="text-gray-400" />
                    </div>
                    <select
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none bg-white"
                      required
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Amount <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <DollarSign size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.amount}
                        onChange={(e) => setForm({ ...form, amount: e.target.value })}
                        placeholder="0.00"
                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <CalendarDays size={16} className="text-gray-400" />
                      </div>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all bg-white"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Notes <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <AlignLeft size={16} className="text-gray-400" />
                    </div>
                    <textarea
                      value={form.notes}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      placeholder="What was this expense for?"
                      rows={3}
                      className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm font-medium border border-red-100">
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 bg-white border border-gray-300 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {saving ? "Saving..." : editing ? "Save Changes" : "Add Expense"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}