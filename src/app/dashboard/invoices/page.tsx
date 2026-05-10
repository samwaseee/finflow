"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, Download, FileText, X, Pencil, Mail, Loader2 } from "lucide-react";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

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

const STATUS_STYLES: Record<string, string> = {
  DRAFT: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-600",
  SENT: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800/50",
  PAID: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/50",
  OVERDUE: "bg-rose-50 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-800/50",
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
  const [fetchError, setFetchError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [filter, setFilter] = useState<string>("ALL");

  const [clientId, setClientId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [sendingId, setSendingId] = useState<string | null>(null);

  async function fetchAll() {
    try {
      setFetchError("");
      const [invRes, cliRes] = await Promise.all([
        fetch("/api/invoices"),
        fetch("/api/clients"),
      ]);
      if (!invRes.ok || !cliRes.ok) throw new Error("Failed to fetch");
      setInvoices(await invRes.json());
      setClients(await cliRes.json());
    } catch {
      setFetchError("Failed to load invoices.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchAll(); }, []);

  function openEdit(inv: Invoice) {
    setEditing(inv);
    setClientId(inv.client ? clients.find(c => c.name === inv.client.name)?.id ?? "" : "");
    setDueDate(new Date(inv.dueDate).toISOString().split("T")[0]);
    setNotes(inv.notes ?? "");
    setItems(inv.items.map(item => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: Number(item.unitPrice),
    })));
    setError("");
    setModalOpen(true);
  }

  function openCreate() {
    setClientId(""); setDueDate(""); setNotes("");
    setItems([{ ...emptyItem }]); setError(""); setModalOpen(true);
  }

  function updateItem(index: number, field: keyof LineItem, value: string | number) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, [field]: value } : item)));
  }

  function addItem() { setItems((prev) => [...prev, { ...emptyItem }]); }
  function removeItem(index: number) { setItems((prev) => prev.filter((_, i) => i !== index)); }

  const total = items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = editing ? `/api/invoices/${editing.id}` : "/api/invoices";
    const method = editing ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, dueDate, notes, items }),
    });

    if (res.ok) {
      await fetchAll();
      setModalOpen(false);
      setEditing(null);
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

  async function handleSend(id: string) {
    if (!confirm("Send this invoice to the client by email?")) return;
    setSendingId(id);
    const res = await fetch(`/api/invoices/${id}/send`, { method: "POST" });
    if (res.ok) {
      await fetchAll();
    } else {
      const data = await res.json();
      alert(data.error || "Failed to send email.");
    }
    setSendingId(null);
  }

  const filtered = filter === "ALL" ? invoices : invoices.filter((inv) => inv.status === filter);

  const inputClass = `
    w-full border border-slate-200 dark:border-slate-600
    bg-white dark:bg-slate-700
    text-slate-900 dark:text-slate-100
    placeholder-slate-400 dark:placeholder-slate-500
    rounded-xl px-4 py-2.5 text-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500
    transition-all shadow-sm
  `;

  return (
    <div className="min-h-screen p-6 md:p-10 font-sans">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Invoices
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Manage and track your billing. You have{" "}
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {invoices.length}
              </span>{" "}
              total invoice{invoices.length !== 1 ? "s" : ""}.
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/20 hover:bg-blue-700 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <Plus size={18} strokeWidth={2.5} />
            New Invoice
          </button>
        </div>

        {/* Filter tabs */}
        <div className="flex p-1 mb-6 bg-slate-200/50 dark:bg-slate-700/50 rounded-xl w-fit border border-slate-200/60 dark:border-slate-700">
          {["ALL", "DRAFT", "SENT", "PAID", "OVERDUE"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all ${filter === s
                ? "bg-white dark:bg-slate-600 text-slate-900 dark:text-slate-100 shadow-sm ring-1 ring-slate-900/5 dark:ring-slate-500/20"
                : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-600/50"
                }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <LoadingState message="Loading invoices..." />
        ) : fetchError ? (
          <ErrorState message={fetchError} onRetry={fetchAll} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={filter === "ALL" ? "No invoices yet" : `No ${filter.toLowerCase()} invoices`}
            description={
              filter === "ALL"
                ? "Create your first invoice to start getting paid for your work."
                : `You don't have any invoices marked as ${filter.toLowerCase()} right now.`
            }
            action={
              filter === "ALL" ? (
                <button
                  onClick={openCreate}
                  className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
                >
                  <Plus size={16} />
                  Create first invoice
                </button>
              ) : undefined
            }
          />
        ) : (
          /* Table */
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-sm">
            <div className="w-full">
              <table className="w-full text-sm text-left whitespace-nowrap">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/30 text-slate-500 dark:text-slate-400">
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider rounded-tl-2xl">Invoice</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Client</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Due Date</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Total</th>
                    <th className="px-6 py-4 font-semibold text-xs uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 rounded-tr-2xl" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                  {filtered.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-700/40 transition-colors group">
                      <td className="px-6 py-4">
                        <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {inv.number}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{inv.client.name}</div>
                        <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{inv.client.email}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-400 font-medium">
                        {new Date(inv.dueDate).toLocaleDateString("en-US", {
                          year: "numeric", month: "short", day: "numeric",
                        })}
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          ${Number(inv.total).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="relative group/dropdown inline-block">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide border ${STATUS_STYLES[inv.status]} ${STATUS_FLOW[inv.status].length > 0 ? "cursor-pointer" : ""}`}>
                            {inv.status}
                            {STATUS_FLOW[inv.status].length > 0 && (
                              <ChevronDown size={12} strokeWidth={3} className="opacity-70" />
                            )}
                          </span>
                          {STATUS_FLOW[inv.status].length > 0 && (
                            <div className="absolute left-0 top-full mt-2 w-36 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl dark:shadow-slate-900/50 z-10 opacity-0 invisible group-hover/dropdown:opacity-100 group-hover/dropdown:visible transition-all translate-y-1 group-hover/dropdown:translate-y-0">
                              <div className="p-1">
                                {STATUS_FLOW[inv.status].map((next) => (
                                  <button
                                    key={next}
                                    onClick={() => handleStatusChange(inv.id, next)}
                                    className="block w-full text-left px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-slate-100 rounded-lg transition-colors"
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
                          <button
                            onClick={() => openEdit(inv)}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Edit Invoice"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={() => handleSend(inv.id)}
                            disabled={sendingId === inv.id || inv.status === "PAID"}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors disabled:opacity-30"
                            title="Send to client"
                          >
                            {sendingId === inv.id
                              ? <Loader2 size={16} className="animate-spin" />
                              : <Mail size={16} />
                            }
                          </button>
                          <a
                            href={`/api/invoices/${inv.id}/pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                            title="Download PDF"
                          >
                            <Download size={16} />
                          </a>
                          <button
                            onClick={() => handleDelete(inv.id)}
                            className="p-2 text-slate-400 dark:text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg transition-colors"
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

        {/* Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 dark:bg-black/60 backdrop-blur-sm">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
              {/* Modal header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700">
                <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {editing ? "Edit Invoice" : "Create New Invoice"}
                </h2>
                <button
                  onClick={() => { setModalOpen(false); setEditing(null); }}
                  className="p-2 text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-300 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal body */}
              <div className="overflow-y-auto p-6">
                <form id="invoice-form" onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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
                      <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
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

                  {/* Line items */}
                  <div className="border border-slate-200 dark:border-slate-600 rounded-2xl p-5 bg-slate-50/50 dark:bg-slate-700/30">
                    <div className="flex items-center justify-between mb-4">
                      <label className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        Line Items <span className="text-rose-500">*</span>
                      </label>
                    </div>

                    <div className="space-y-3">
                      <div className="hidden md:grid grid-cols-12 gap-3 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide px-1">
                        <div className="col-span-6">Description</div>
                        <div className="col-span-2">Qty</div>
                        <div className="col-span-3">Price</div>
                        <div className="col-span-1" />
                      </div>

                      {items.map((item, i) => (
                        <div
                          key={i}
                          className="grid grid-cols-12 gap-3 items-center bg-white dark:bg-slate-700 p-2 md:p-0 rounded-xl md:bg-transparent dark:md:bg-transparent shadow-sm md:shadow-none border border-slate-100 dark:border-slate-600 md:border-none"
                        >
                          <input
                            className={`col-span-12 md:col-span-6 ${inputClass}`}
                            placeholder="e.g. Web Design Services"
                            value={item.description}
                            onChange={(e) => updateItem(i, "description", e.target.value)}
                            required
                          />
                          <input
                            type="number" min={1}
                            className={`col-span-6 md:col-span-2 ${inputClass}`}
                            value={item.quantity}
                            onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                            required
                          />
                          <div className="col-span-4 md:col-span-3 relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-medium">$</span>
                            <input
                              type="number" min={0} step="0.01"
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
                            className="col-span-2 md:col-span-1 flex justify-center p-2 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl disabled:opacity-30 transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-600 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={addItem}
                        className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                      >
                        <Plus size={16} strokeWidth={3} /> Add another item
                      </button>
                      <div className="text-right">
                        <span className="text-sm text-slate-500 dark:text-slate-400 font-medium mr-2">Total:</span>
                        <span className="text-xl font-bold text-slate-900 dark:text-slate-100">
                          ${total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Notes{" "}
                      <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
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
                    <div className="p-3 bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/50 text-rose-600 dark:text-rose-400 rounded-xl text-sm font-medium">
                      {error}
                    </div>
                  )}
                </form>
              </div>

              {/* Modal footer */}
              <div className="px-6 py-5 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex justify-end gap-3 rounded-b-3xl">
                <button
                  type="button"
                  onClick={() => { setModalOpen(false); setEditing(null); }}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-200/50 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="invoice-form"
                  disabled={saving}
                  className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/20 hover:bg-blue-700 disabled:opacity-60 transition-all flex items-center gap-2"
                >
                  {saving && (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  )}
                  {saving ? "Saving..." : editing ? "Save Changes" : "Save Invoice"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  );
}