// src/app/dashboard/invoices/page.tsx

"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown } from "lucide-react";

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
  DRAFT:   "bg-gray-100 text-gray-600",
  SENT:    "bg-blue-100 text-blue-700",
  PAID:    "bg-green-100 text-green-700",
  OVERDUE: "bg-red-100 text-red-600",
};

const STATUS_FLOW: Record<string, string[]> = {
  DRAFT:   ["SENT"],
  SENT:    ["PAID", "OVERDUE"],
  PAID:    [],
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

  useEffect(() => { fetchAll(); }, []);

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

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {invoices.length} invoice{invoices.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          New invoice
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 p-1 rounded-lg w-fit">
        {["ALL", "DRAFT", "SENT", "PAID", "OVERDUE"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              filter === s
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-sm text-gray-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg font-medium text-gray-500 mb-1">
            {filter === "ALL" ? "No invoices yet" : `No ${filter.toLowerCase()} invoices`}
          </p>
          {filter === "ALL" && (
            <p className="text-sm">Create your first invoice to get started.</p>
          )}
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-5 py-3 font-medium text-gray-500">Number</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Client</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Due date</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Total</th>
                <th className="text-left px-5 py-3 font-medium text-gray-500">Status</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-4 font-mono font-medium text-gray-900">
                    {inv.number}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-medium text-gray-900">{inv.client.name}</div>
                    <div className="text-xs text-gray-400">{inv.client.email}</div>
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {new Date(inv.dueDate).toLocaleDateString("en-US", {
                      year: "numeric", month: "short", day: "numeric",
                    })}
                  </td>
                  <td className="px-5 py-4 font-medium text-gray-900">
                    ${Number(inv.total).toFixed(2)}
                  </td>
                  <td className="px-5 py-4">
                    <div className="relative group inline-block">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer ${STATUS_STYLES[inv.status]}`}
                      >
                        {inv.status}
                        {STATUS_FLOW[inv.status].length > 0 && (
                          <ChevronDown size={11} />
                        )}
                      </span>
                      {STATUS_FLOW[inv.status].length > 0 && (
                        <div className="absolute left-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 hidden group-hover:block min-w-[110px]">
                          {STATUS_FLOW[inv.status].map((next) => (
                            <button
                              key={next}
                              onClick={() => handleStatusChange(inv.id, next)}
                              className="block w-full text-left px-3 py-2 text-xs text-gray-700 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                            >
                              Mark as {next.toLowerCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(inv.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-5">New invoice</h2>

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Client + due date */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Client <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={clientId}
                    onChange={(e) => setClientId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select a client</option>
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-700">
                    Line items <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={addItem}
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                  >
                    + Add item
                  </button>
                </div>

                <div className="space-y-2">
                  {/* Column headers */}
                  <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-400 px-1">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2">Qty</div>
                    <div className="col-span-3">Unit price</div>
                    <div className="col-span-1" />
                  </div>

                  {items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input
                        className="col-span-6 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Web design services"
                        value={item.description}
                        onChange={(e) => updateItem(i, "description", e.target.value)}
                        required
                      />
                      <input
                        type="number"
                        min={1}
                        className="col-span-2 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={item.quantity}
                        onChange={(e) => updateItem(i, "quantity", Number(e.target.value))}
                        required
                      />
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        className="col-span-3 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(i, "unitPrice", Number(e.target.value))}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        disabled={items.length === 1}
                        className="col-span-1 flex justify-center p-1.5 text-gray-400 hover:text-red-500 disabled:opacity-20"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Total */}
                <div className="flex justify-end mt-3 pt-3 border-t border-gray-100">
                  <span className="text-sm font-semibold text-gray-900">
                    Total: ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Payment terms, bank details..."
                  rows={2}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-gray-300 text-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  {saving ? "Creating..." : "Create invoice"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}