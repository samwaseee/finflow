"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Mail, MapPin, FileText, Users, X, User } from "lucide-react";
import LoadingState from "@/components/ui/LoadingState";
import ErrorState from "@/components/ui/ErrorState";
import EmptyState from "@/components/ui/EmptyState";

type Client = {
  id: string;
  name: string;
  email: string;
  address: string | null;
  _count: { invoices: number };
};

type FormData = {
  name: string;
  email: string;
  address: string;
};

const empty: FormData = { name: "", email: "", address: "" };

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchClients() {
    try {
      setFetchError("");
      const res = await fetch("/api/clients");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setClients(data);
    } catch {
      setFetchError("Failed to load clients.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { fetchClients(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError("");
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({ name: client.name, email: client.email, address: client.address || "" });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const url = editing ? `/api/clients/${editing.id}` : "/api/clients";
    const method = editing ? "PATCH" : "POST";
    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) { await fetchClients(); setModalOpen(false); }
      else { const data = await res.json(); setError(data.error || "Something went wrong."); }
    } catch { setError("Failed to connect to the server."); }
    finally { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client? This cannot be undone.")) return;
    setDeletingId(id);
    try { await fetch(`/api/clients/${id}`, { method: "DELETE" }); await fetchClients(); }
    catch (err) { console.error("Failed to delete client", err); }
    finally { setDeletingId(null); }
  }

  const getInitials = (name: string) =>
    name.split(" ").map((n) => n[0]).join("").substring(0, 2).toUpperCase();

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <Users size={24} strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">
              Clients
            </h1>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 ml-12">
            Manage your client roster and track associated invoices.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center justify-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 hover:shadow-md transition-all active:scale-95 w-full sm:w-auto"
        >
          <Plus size={18} strokeWidth={2.5} />
          New Client
        </button>
      </div>

      {loading ? (
        <LoadingState message="Loading clients..." />
      ) : fetchError ? (
        <ErrorState message={fetchError} onRetry={fetchClients} />
      ) : clients.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No clients yet"
          description="Add your first client to start generating invoices and tracking your business relationships."
          action={
            <button
              onClick={openCreate}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus size={16} />
              Add first client
            </button>
          }
        />
      ) : (
        /* Table */
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm ring-1 ring-gray-900/5 dark:ring-slate-700/50 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30">
                  <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                    Client Details
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                    Address
                  </th>
                  <th className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-xs">
                    Invoices
                  </th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-slate-700/50">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50/80 dark:hover:bg-slate-700/40 transition-colors group"
                  >
                    {/* Client details */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 dark:from-indigo-900/50 dark:to-blue-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-200/50 dark:border-indigo-700/50 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {getInitials(client.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 dark:text-gray-100 text-sm">
                            {client.name}
                          </div>
                          <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-xs mt-1">
                            <Mail size={12} className="text-gray-400 dark:text-gray-500" />
                            {client.email}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Address */}
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                      {client.address ? (
                        <div className="flex items-start gap-1.5 max-w-xs">
                          <MapPin size={14} className="text-gray-400 dark:text-gray-500 shrink-0 mt-0.5" />
                          <span className="truncate" title={client.address}>
                            {client.address}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 dark:text-gray-600 italic">
                          No address provided
                        </span>
                      )}
                    </td>

                    {/* Invoice count */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-xs font-semibold">
                        <FileText size={12} className="text-slate-500 dark:text-slate-400" />
                        {client._count.invoices}{" "}
                        {client._count.invoices === 1 ? "Invoice" : "Invoices"}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(client)}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                          title="Edit client"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          disabled={deletingId === client.id}
                          className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          title="Delete client"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 dark:bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-700/30">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {editing ? "Edit Client" : "New Client"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-600 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Company / Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Acme Inc."
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="billing@acme.com"
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    Billing Address{" "}
                    <span className="text-gray-400 dark:text-gray-500 font-normal ml-1">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MapPin size={16} className="text-gray-400 dark:text-gray-500" />
                    </div>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="123 Main St, City, Country"
                      rows={3}
                      className="w-full border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm font-medium rounded-xl border border-red-100 dark:border-red-800/50 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500 dark:bg-red-400" />
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-slate-700 mt-6">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="flex-1 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 text-gray-700 dark:text-gray-300 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-blue-600 text-white rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed transition-colors shadow-sm"
                  >
                    {saving ? "Saving..." : editing ? "Save Changes" : "Create Client"}
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