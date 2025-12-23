"use client";
import { useEffect, useState } from "react";
import { Toaster, toast } from "react-hot-toast";

export default function AdminIntegrationsPage() {
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editConfig, setEditConfig] = useState<{ [id: string]: string }>({});
  const [saving, setSaving] = useState<{ [id: string]: boolean }>({});
  const [newService, setNewService] = useState("");
  const [newScope, setNewScope] = useState("");
  const [newConfig, setNewConfig] = useState("");
  const [creating, setCreating] = useState(false);
  const [r2Config, setR2Config] = useState<string>("");
  const [r2Edit, setR2Edit] = useState<string>("");
  const [r2Loading, setR2Loading] = useState(false);
  const [r2Saving, setR2Saving] = useState(false);
  const API_BASE = typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_BASE
    ? process.env.NEXT_PUBLIC_API_BASE
    : "/api";

  useEffect(() => {
    fetch(`${API_BASE}/admin/integrations`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setIntegrations(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load integrations");
        setLoading(false);
      });
    // Fetch R2 config
    setR2Loading(true);
    fetch(`${API_BASE}/admin/r2-config`, { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        setR2Config(JSON.stringify(data, null, 2));
        setR2Edit(JSON.stringify(data, null, 2));
        setR2Loading(false);
      })
      .catch(() => {
        setR2Config("");
        setR2Edit("");
        setR2Loading(false);
      });
  }, []);
  async function handleR2Save(e: React.FormEvent) {
    e.preventDefault();
    setR2Saving(true);
    setError("");
    try {
      const parsed = JSON.parse(r2Edit);
      const res = await fetch(`${API_BASE}/admin/r2-config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update R2 config");
      setR2Config(JSON.stringify(parsed, null, 2));
      toast.success("R2 config updated successfully");
    } catch (err: any) {
      setError(err.message || "Error updating R2 config");
      toast.error(err.message || "Error updating R2 config");
    } finally {
      setR2Saving(false);
    }
  }

  async function handleEditConfig(id: string) {
    setSaving((s) => ({ ...s, [id]: true }));
    setError("");

    try {
      JSON.parse(editConfig[id]);
      const res = await fetch(`${API_BASE}/admin/integrations/${id}/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ config: editConfig[id] }),
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to update config");

      const updated = await fetch(`${API_BASE}/admin/integrations`, {
        credentials: "include",
      }).then((r) => r.json());

      setIntegrations(updated);
      setEditConfig((e) => ({ ...e, [id]: "" }));
      toast.success("Config updated successfully");
    } catch (err: any) {
      setError(err.message || "Error updating config");
      toast.error(err.message || "Error updating config");
    } finally {
      setSaving((s) => ({ ...s, [id]: false }));
    }
  }

  async function handleCreateIntegration(e: React.FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError("");

    try {
      JSON.parse(newConfig);

      const res = await fetch(`${API_BASE}/admin/integrations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          service: newService,
          scope: newScope,
          config: newConfig,
        }),
        credentials: "include",
      });

      if (!res.ok) throw new Error("Failed to create integration");

      const updated = await fetch(`${API_BASE}/admin/integrations`, {
        credentials: "include",
      }).then((r) => r.json());

      setIntegrations(updated);
      setNewService("");
      setNewScope("");
      setNewConfig("");

      toast.success("Integration created successfully");
    } catch (err: any) {
      setError(err.message || "Error creating integration");
      toast.error(err.message || "Error creating integration");
    } finally {
      setCreating(false);
    }
  }

  async function handleDeleteIntegration(id: string) {
    if (!window.confirm("Delete this integration?")) return;

    try {
      const res = await fetch(`${API_BASE}/admin/integrations/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Failed to delete integration");

      setIntegrations((ints) => ints.filter((i) => i._id !== id));
      toast.success("Integration deleted successfully");
    } catch (err: any) {
      setError(err.message || "Error deleting integration");
      toast.error(err.message || "Error deleting integration");
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617] text-white px-4 py-10">
      <Toaster position="top-right" />

      {/* PAGE HEADER */}
      <header className="text-center mb-10">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-[#ef4444] via-[#f97316] to-[#2563eb] shadow-lg mb-3">
          <span className="text-xl font-extrabold">I</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Integrations
        </h1>
        <p className="text-slate-400 mt-2">
          Manage API service connections, scopes, and encrypted configs.
        </p>
      </header>

      <div className="max-w-4xl mx-auto space-y-10">
        {/* R2 CONFIG SECTION */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl p-6 md:p-8 space-y-6">
          <h2 className="text-xl font-semibold text-white">Cloudflare R2 Storage Config</h2>
          {r2Loading ? (
            <p className="text-slate-400 text-sm mt-2">Loading R2 config…</p>
          ) : (
            <form onSubmit={handleR2Save} className="space-y-4">
              <textarea
                value={r2Edit}
                onChange={(e) => setR2Edit(e.target.value)}
                rows={8}
                className="w-full rounded-lg bg-slate-900 border border-slate-700 text-sm px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:ring-[#f97316] focus:border-transparent font-mono"
                placeholder="R2 config as JSON"
                required
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={r2Saving}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow disabled:opacity-60"
                >
                  {r2Saving ? "Saving…" : "Save R2 Config"}
                </button>
                <button
                  type="button"
                  onClick={() => setR2Edit(r2Config)}
                  className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-slate-700 hover:bg-slate-800 shadow"
                  disabled={r2Saving}
                >
                  Reset
                </button>
              </div>
            </form>
          )}
        </section>
        {/* ERROR BANNER */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        )}

        {/* CREATE NEW INTEGRATION */}
        <form
          onSubmit={handleCreateIntegration}
          className="rounded-2xl border border-slate-800 bg-slate-900/60 shadow-xl p-6 md:p-8 space-y-6"
        >
          <h2 className="text-xl font-semibold text-white">Add New Integration</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input
              type="text"
              placeholder="Service"
              value={newService}
              onChange={(e) => setNewService(e.target.value)}
              required
              className="rounded-lg bg-slate-900 border border-slate-700 text-sm px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:ring-[#f97316] focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Scope"
              value={newScope}
              onChange={(e) => setNewScope(e.target.value)}
              required
              className="rounded-lg bg-slate-900 border border-slate-700 text-sm px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:ring-[#f97316] focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Config (JSON)"
              value={newConfig}
              onChange={(e) => setNewConfig(e.target.value)}
              required
              className="rounded-lg bg-slate-900 border border-slate-700 text-sm px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:ring-[#f97316] focus:border-transparent"
            />
          </div>

          <button
            type="submit"
            disabled={creating}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 transition text-white font-semibold text-sm shadow-lg disabled:opacity-60"
          >
            {creating ? "Creating…" : "Create Integration"}
          </button>
        </form>

        {/* INTEGRATIONS LIST */}
        <section className="space-y-6">
          {loading ? (
            <p className="text-slate-400 text-sm mt-4">Loading integrations…</p>
          ) : integrations.length === 0 ? (
            <p className="text-slate-400 text-sm mt-4">
              No integrations configured yet.
            </p>
          ) : (
            integrations.map((i) => (
              <div
                key={i._id}
                className="rounded-2xl border border-slate-800 bg-slate-900/70 shadow-xl p-6 md:p-8 flex flex-col md:flex-row justify-between gap-6"
              >
                {/* LEFT */}
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-white">{i.service}</h3>
                  <p className="text-sm text-slate-400">
                    Scope: <span className="font-medium">{i.scope}</span>
                  </p>
                </div>

                {/* RIGHT - EDIT CONFIG */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleEditConfig(i._id);
                  }}
                  className="flex flex-col md:flex-row gap-3 items-start md:items-center"
                >
                  <input
                    type="text"
                    placeholder="Config (JSON)"
                    value={editConfig[i._id] ?? ""}
                    onChange={(e) =>
                      setEditConfig((c) => ({ ...c, [i._id]: e.target.value }))
                    }
                    className="rounded-lg bg-slate-900 border border-slate-700 text-sm px-3 py-2 text-slate-200 placeholder:text-slate-500 focus:ring-[#2563eb] focus:border-transparent w-60"
                  />

                  <button
                    type="submit"
                    disabled={saving[i._id]}
                    className="px-4 py-2 rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow disabled:opacity-60"
                  >
                    {saving[i._id] ? "Saving…" : "Update Config"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteIntegration(i._id)}
                    className="px-3 py-2 rounded-lg text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow"
                  >
                    Delete
                  </button>
                </form>
              </div>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
