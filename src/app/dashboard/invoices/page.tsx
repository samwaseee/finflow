// src/app/dashboard/invoices/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, Download, FileText, X } from "lucide-react";

type InvoiceItem = {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
};

type Invoice = {
  id: string;
  number: string;
  status: "DRAFT" | "SENT" | "PAID" | "OVERDUE";
  dueDate: string;
  total: number;
  notes: string | null;
  client: { name: string; email: string };
  items: InvoiceItem[];
};

type Client = {
  id: string;
  name: string;
  email: string;
};

type LineItem = {
  description: string;
  quantity: number;
  unitPrice: number;
};

const emptyItem: LineItem = { description: "", quantity: 1, unitPrice: 0 };

// Upgraded to softer pastel backgrounds with subtle borders
const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 text-slate-700 border-slate-200",
  SENT: "bg-blue-50 text-blue-700 border-blue-200",
  PAID: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OVERDUE: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_FLOW: Record<string, string[]> = {
  DRAFT: ["SENT"],
  SENT: ["PAID", "OVERDUE"],
  PAID: [],
  OVERDUE: ["PAID"],
};

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");

  // form state
  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function fetchAll() {
    const [invRes, cliRes] = await Promise.all([
      fetch("/api/invoices"),
      fetch("/api/clients"),
    ]);
    setInvoices(await invRes.json());
    setClients(await cliRes.json());
    setLoading(false);
  }

  useEffect(() => {
    fetchAll();
  }, []);

  function openCreate() {
    setClientId("");
    setDueDate("");
    setNotes("");
    setItems([{ ...emptyItem }]);
    setError("");
    setModalOpen(true);
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  const total = items.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, dueDate, notes, items }),
    });

    if (res.ok) {
      await fetchAll();
      setModalOpen(false);
    } else {
      const data = await res.json();
      setError(data.error || "Something went wrong.");
    }

    setSaving(false);
  }

  async function handleStatusChange(id: string, status: string) {
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    await fetchAll();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this invoice?")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    await fetchAll();
  }

  const filtered =
    filter === "ALL"
      ? invoices
      : invoices.filter((inv) => inv.status === filter);

  // Common input styling for consistency
  const inputClass = "w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm";

  return (
    <div className="min-h-screen bg-slate-50/50 p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Invoices</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage and track your billing. You have <span className="font-medium text-slate-700">{invoices.length}</span> total invoice{invoices.length !== 1 ? "s" : ""}.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/30 active:scale-[0.98] transition-all"
          >
            <Plus size={18} strokeWidth={2.5} />
            New Invoice
          </button>
        </div>

        {/* Filter tabs (Segmented Control Style) */}
        <div className="flex p-1 mb-6 bg-slate-200/50 rounded-xl w-fit border border-slate-200/60 shadow-inner">
          {["ALL", "DRAFT", "SENT", "PAID", "OVERDUE"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${filter === s
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5"
                  : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Content Area */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-400 space-y-4">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-blue-600 rounded-full animate-spin" />
            <p className="text-sm font-medium">Loading invoices...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center bg-white border border-slate-200 border-dashed rounded-3xl shadow-sm">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <FileText className="text-slate-400" size={28} />
            </div>
            <p className="text-lg font-semibold text-slate-900 mb-1">
              {filter === "ALL" ? "No invoices yet" : `No ${filter.toLowerCase()} invoices`}
            </p>
            <p className="text-sm text-slate-500 max-w-sm mb-6">
              {filter === "ALL"
                ? "Get paid for your hard work. Create your first invoice to get started."
                : `You don't have any invoices currently marked as ${filter.toLowerCase()}.`}
            </p>
            {filter === "ALL" && (
              <button
                onClick={openCreate}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline underline-offset-4"
              >
                Create an invoice &rarr;
              </button>
            )}
          </div>
        ) : (
          // 1. Removed `overflow-hidden` from this wrapper
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm">
            {/* 2. Removed `overflow-x-auto` to prevent vertical clipping */}
            <div className="w-full">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500">
                    {/* 3. Added rounded-tl-2xl and rounded-tr-2xl to the outer headers to maintain the curved look */}
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider rounded-tl-2xl">Invoice</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 rounded-tr-2xl" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map((inv) => (
                    <tr
                      key={inv.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-slate-900">
                          {inv.number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">{inv.client.name}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{inv.client.email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {new Date(inv.dueDate).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900">
                          ${Number(inv.total).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group/dropdown inline-block">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUS_STYLES[inv.status]} ${STATUS_FLOW[inv.status].length > 0 ? "cursor-pointer" : ""}`}
                          >
                            {inv.status}
                            {STATUS_FLOW[inv.status].length > 0 && (
                              <ChevronDown size={12} strokeWidth={3} className="opacity-70" />
                            )}
                          </span>
                          {/* Dropdown will now render fully without being clipped */}
                          {STATUS_FLOW[inv.status].length > 0 && (
                            <div className="absolute left-0 top-full mt-2 w-36 bg-white border border-slate-200 rounded-xl shadow-xl z-10 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all translate-y-1 group-hover/dropdown:translate-y-0">
                              <div className="p-1">
                                {STATUS_FLOW[inv.status].map((next) => (
                                  <button
                                    key={next}
                                    onClick={() => handleStatusChange(inv.id, next)}
                                    className="block w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 rounded-lg transition-colors"
                                  >
                                    Mark as {next.toLowerCase()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <a
                            href={`/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </a>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Delete Invoice"
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

        {/* Create Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-900">Create New Invoice</h2>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Body */}
              <div className="overflow-y-auto p-6">
                <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Client <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={clientId}
                        onChange={(e) => setClientId(e.target.value)}
                        className={inputClass}
                        required
                      >
                        <option value="" disabled>Select a client...</option>
                        {clients.map((c) => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Due Date <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className={inputClass}
                        required
                      />
                    </div>
                  </div>

                  <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-semibold text-slate-900">
                        Line Items <span className="text-rose-500">*</span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-semibold text-slate-500 uppercase tracking-wide px-1">
                        <div className="col-span-6">Description</div>
                        <div className="col-span-2">Qty</div>
                        <div className="col-span-3">Price</div>
                        <div className="col-span-1" />
                      </div>

                      {items.map((item, i) => (
                        <div key={i} className="grid grid-cols-12 gap-3 items-center bg-white p-2 md:p-0 rounded-xl md:bg-transparent shadow-sm md:shadow-none border border-slate-100 md:border-none">
                          <input
                            className={`col-span-12 md:col-span-6 ${inputClass}`}
                            placeholder="e.g. Web Design Services"
                            value={item.description}
                            onChange={(e) => updateItem(i, "description", e.target.value)}
                            required
                          />
                          <input
                            type="number"
                            min={1}
                            className={`col-span-6 md:col-span-2 ${inputClass}`}
                            value={item.quantity}
                            onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                            required
                          />
                          <div className="col-span-4 md:col-span-3 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">$</span>
                            <input
                              type="number"
                              min={0}
                              step="0.01"
                              className={`${inputClass} pl-7`}
                              placeholder="0.00"
                              value={item.unitPrice}
                              onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                              required
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(i)}
                            disabled={items.length === 1}
                            className="col-span-2 md:col-span-1 flex justify-center p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl disabled:opacity-30 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={addItem}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                      >
                        <Plus size={16} strokeWidth={3} /> Add another item
                      </button>
                      <div className="text-right">
                        <span className="text-sm text-slate-500 font-medium mr-2">Total:</span>
                        <span className="text-xl font-bold text-slate-900">${total.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                      Notes <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Payment terms, bank details, or thank you message..."
                      rows={3}
                      className={`${inputClass} resize-none`}
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl text-sm font-medium">
                      {error}
                    </div>
                  )}
                </form>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-5 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-200/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="invoice-form"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center gap-2"
                >
                  {saving && <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  {saving ? "Creating..." : "Save Invoice"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}