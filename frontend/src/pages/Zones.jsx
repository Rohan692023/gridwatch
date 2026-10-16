import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import api from "../api/axios";

const priorityLabel = { 1: "Critical", 2: "Medium", 3: "Low" };

export default function Zones() {
  const { user } = useAuth();
  const [zones, setZones] = useState([]);
  const [form, setForm] = useState({ name: "", priority: 2, baseLoadKw: "" });
  const [error, setError] = useState("");

  async function load() {
    const { data } = await api.get("/zones");
    setZones(data.zones);
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    try {
      await api.post("/zones", {
        name: form.name,
        priority: Number(form.priority),
        baseLoadKw: Number(form.baseLoadKw),
      });
      setForm({ name: "", priority: 2, baseLoadKw: "" });
      load();
    } catch (err) {
      setError(err.response?.data?.message || "Could not create zone");
    }
  }

  async function handleDelete(id) {
    if (!confirm("Delete this zone? This cannot be undone.")) return;
    await api.delete(`/zones/${id}`);
    load();
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        <div className="text-sm font-medium">Zone management</div>

        {user.role === "admin" && (
          <form onSubmit={handleCreate} className="border border-line bg-panel p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            <div>
              <label className="mb-1 block text-xs text-muted">Name</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-cyan"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Priority</label>
              <select
                value={form.priority}
                onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                className="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-cyan"
              >
                <option value={1}>1 — Critical</option>
                <option value={2}>2 — Medium</option>
                <option value={3}>3 — Low</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs text-muted">Base load (kW)</label>
              <input
                required
                type="number"
                min="0"
                value={form.baseLoadKw}
                onChange={(e) => setForm((f) => ({ ...f, baseLoadKw: e.target.value }))}
                className="w-full border border-line bg-void px-3 py-2 text-sm data-mono outline-none focus:border-cyan"
              />
            </div>
            <button className="border border-cyan py-2 text-sm text-cyan hover:bg-cyan/10 transition-colors">
              Add zone
            </button>
          </form>
        )}
        {error && <div className="text-xs text-off">{error}</div>}

        <div className="border border-line bg-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2 font-normal">Name</th>
                <th className="px-4 py-2 font-normal">Priority</th>
                <th className="px-4 py-2 font-normal">Base load</th>
                <th className="px-4 py-2 font-normal">Status</th>
                {user.role === "admin" && <th className="px-4 py-2 font-normal"></th>}
              </tr>
            </thead>
            <tbody>
              {zones.map((z) => (
                <tr key={z._id} className="border-b border-line last:border-0">
                  <td className="px-4 py-2">{z.name}</td>
                  <td className="px-4 py-2 data-mono text-xs">{priorityLabel[z.priority]}</td>
                  <td className="px-4 py-2 data-mono">{z.baseLoadKw} kW</td>
                  <td className="px-4 py-2 data-mono text-xs">
                    <span className={z.status === "ON" ? "text-on" : "text-off"}>{z.status}</span>
                  </td>
                  {user.role === "admin" && (
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => handleDelete(z._id)}
                        className="text-xs text-muted hover:text-off transition-colors"
                      >
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
