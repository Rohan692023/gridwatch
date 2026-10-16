import React, { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";

const actionColor = {
  AUTO_SHED: "text-off",
  MANUAL_SHED: "text-off",
  AUTO_RESTORE: "text-on",
  MANUAL_RESTORE: "text-on",
};

export default function AuditLog() {
  const [logs, setLogs] = useState([]);
  const [filters, setFilters] = useState({ action: "", from: "", to: "" });
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  async function load() {
    const params = { page, limit: 20, ...filters };
    Object.keys(params).forEach((k) => !params[k] && delete params[k]);
    const { data } = await api.get("/audit", { params });
    setLogs(data.logs);
    setPages(data.pages);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  function applyFilters(e) {
    e.preventDefault();
    setPage(1);
    load();
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        <div className="text-sm font-medium">Audit log</div>
        <div className="text-xs text-muted -mt-4">
          Every shed/restore event, automatic or manual. Entries are append-only.
        </div>

        <form onSubmit={applyFilters} className="border border-line bg-panel p-4 flex flex-wrap gap-3 items-end">
          <div>
            <label className="mb-1 block text-xs text-muted">Action</label>
            <select
              value={filters.action}
              onChange={(e) => setFilters((f) => ({ ...f, action: e.target.value }))}
              className="border border-line bg-void px-3 py-2 text-sm outline-none focus:border-cyan"
            >
              <option value="">All</option>
              <option value="AUTO_SHED">Auto shed</option>
              <option value="AUTO_RESTORE">Auto restore</option>
              <option value="MANUAL_SHED">Manual shed</option>
              <option value="MANUAL_RESTORE">Manual restore</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">From</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
              className="border border-line bg-void px-3 py-2 text-sm outline-none focus:border-cyan"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">To</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
              className="border border-line bg-void px-3 py-2 text-sm outline-none focus:border-cyan"
            />
          </div>
          <button className="border border-cyan px-4 py-2 text-sm text-cyan hover:bg-cyan/10 transition-colors">
            Apply
          </button>
        </form>

        <div className="border border-line bg-panel">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line text-left text-xs text-muted">
                <th className="px-4 py-2 font-normal">Time</th>
                <th className="px-4 py-2 font-normal">Zone</th>
                <th className="px-4 py-2 font-normal">Action</th>
                <th className="px-4 py-2 font-normal">Reason</th>
                <th className="px-4 py-2 font-normal">By</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log._id} className="border-b border-line last:border-0 align-top">
                  <td className="px-4 py-2 data-mono text-xs text-muted whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-2">{log.zoneName}</td>
                  <td className={`px-4 py-2 data-mono text-xs ${actionColor[log.action]}`}>
                    {log.action}
                  </td>
                  <td className="px-4 py-2 text-xs text-muted max-w-xs">{log.reason}</td>
                  <td className="px-4 py-2 text-xs">
                    {log.performedByUser?.name || (log.triggeredBy === "system" ? "System" : "—")}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-xs text-muted">
                    No log entries match these filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between text-xs text-muted">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="border border-line px-3 py-1.5 disabled:opacity-30"
          >
            Previous
          </button>
          <span>
            Page {page} of {pages || 1}
          </span>
          <button
            disabled={page >= pages}
            onClick={() => setPage((p) => p + 1)}
            className="border border-line px-3 py-1.5 disabled:opacity-30"
          >
            Next
          </button>
        </div>
      </main>
    </div>
  );
}
