// src/app/dashboard/clients/page.tsx

"use client";

import { useEffect, useState } from "react";
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Mail, 
  MapPin, 
  FileText, 
  Users, 
  X, 
  User 
} from "lucide-react";

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
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState<FormData>(empty);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function fetchClients() {
    try {
      const res = await fetch("/api/clients");
      const data = await res.json();
      setClients(data);
    } catch (err) {
      console.error("Failed to fetch clients", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchClients();
  }, []);

  function openCreate() {
    setEditing(null);
    setForm(empty);
    setError("");
    setModalOpen(true);
  }

  function openEdit(client: Client) {
    setEditing(client);
    setForm({
      name: client.name,
      email: client.email,
      address: client.address || "",
    });
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

      if (res.ok) {
        await fetchClients();
        setModalOpen(false);
      } else {
        const data = await res.json();
        setError(data.error || "Something went wrong.");
      }
    } catch (err) {
      setError("Failed to connect to the server.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this client? This cannot be undone.")) return;
    setDeletingId(id);
    try {
      await fetch(`/api/clients/${id}`, { method: "DELETE" });
      await fetchClients();
    } catch (err) {
      console.error("Failed to delete client", err);
    } finally {
      setDeletingId(null);
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .substring(0, 2)
      .toUpperCase();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm">
              <Users size={24} strokeWidth={2} />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Clients</h1>
          </div>
          <p className="text-sm text-gray-500 ml-12">
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

      {/* Main Content Area */}
      {loading ? (
        // Premium Skeleton Loader
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
          <div className="animate-pulse flex flex-col divide-y divide-gray-100">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-5">
                <div className="h-10 w-10 bg-gray-100 rounded-full shrink-0"></div>
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-gray-100 rounded-md w-1/4"></div>
                  <div className="h-3 bg-gray-50 rounded-md w-1/3"></div>
                </div>
                <div className="hidden sm:block flex-1">
                  <div className="h-4 bg-gray-50 rounded-md w-1/2"></div>
                </div>
                <div className="h-8 w-16 bg-gray-50 rounded-full shrink-0"></div>
              </div>
            ))}
          </div>
        </div>
      ) : clients.length === 0 ? (
        // Enhanced Empty State
        <div className="text-center py-24 bg-white ring-1 ring-gray-900/5 rounded-2xl flex flex-col items-center justify-center shadow-sm">
          <div className="h-16 w-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-5 ring-8 ring-blue-50/50">
            <Users size={32} strokeWidth={1.5} />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No clients yet</h3>
          <p className="text-gray-500 mb-8 max-w-sm">
            Add your first client to start generating invoices and tracking your business relationships.
          </p>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 bg-white border-2 border-gray-200 text-gray-700 px-5 py-2.5 rounded-xl text-sm font-semibold hover:border-gray-300 hover:bg-gray-50 transition-all active:scale-95"
          >
            <Plus size={18} />
            Add First Client
          </button>
        </div>
      ) : (
        // Refined Data Table
        <div className="bg-white rounded-2xl shadow-sm ring-1 ring-gray-900/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Client Details</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Address</th>
                  <th className="px-6 py-4 font-semibold text-gray-500 uppercase tracking-wider text-xs">Invoices</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {clients.map((client) => (
                  <tr
                    key={client.id}
                    className="hover:bg-gray-50/80 transition-colors group"
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        {/* Avatar with subtle gradient */}
                        <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-indigo-100 to-blue-50 text-indigo-700 border border-indigo-200/50 flex items-center justify-center font-bold text-xs shrink-0 shadow-sm">
                          {getInitials(client.name)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900 text-sm">{client.name}</div>
                          <div className="flex items-center gap-1.5 text-gray-500 text-xs mt-1">
                            <Mail size={12} className="text-gray-400" />
                            {client.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {client.address ? (
                        <div className="flex items-start gap-1.5 max-w-xs">
                          <MapPin size={14} className="text-gray-400 shrink-0 mt-0.5" />
                          <span className="truncate" title={client.address}>
                            {client.address}
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-300 italic">No address provided</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold">
                        <FileText size={12} className="text-slate-500" />
                        {client._count.invoices} {client._count.invoices === 1 ? 'Invoice' : 'Invoices'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => openEdit(client)}
                          className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors focus:opacity-100"
                          title="Edit client"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(client.id)}
                          disabled={deletingId === client.id}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:opacity-100"
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

      {/* Enhanced Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
              <h2 className="text-xl font-bold text-gray-900">
                {editing ? "Edit Client" : "New Client"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Company / Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      placeholder="Acme Inc."
                      className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail size={16} className="text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="billing@acme.com"
                      className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all placeholder:text-gray-400"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Billing Address <span className="text-gray-400 font-normal ml-1">(Optional)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute top-3 left-3 pointer-events-none">
                      <MapPin size={16} className="text-gray-400" />
                    </div>
                    <textarea
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      placeholder="123 Main St, City, Country"
                      rows={3}
                      className="w-full border border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none placeholder:text-gray-400"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm font-medium rounded-xl border border-red-100 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-4 border-t border-gray-100 mt-6">
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