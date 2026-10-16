import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useGridSocket } from "../context/SocketContext";
import Navbar from "../components/Navbar";
import ZoneCard from "../components/ZoneCard";
import DemandChart from "../components/DemandChart";
import AlertBanner from "../components/AlertBanner";
import api from "../api/axios";

export default function Dashboard() {
  const { user } = useAuth();
  const { gridState, history } = useGridSocket();
  const [supplyInput, setSupplyInput] = useState("");
  const [savingSupply, setSavingSupply] = useState(false);

  useEffect(() => {
    api.get("/dispatch/settings").then(({ data }) => {
      setSupplyInput(String(data.settings.availableSupplyKw));
    });
  }, []);

  async function saveSupply(e) {
    e.preventDefault();
    setSavingSupply(true);
    try {
      await api.patch("/dispatch/settings", { availableSupplyKw: Number(supplyInput) });
    } finally {
      setSavingSupply(false);
    }
  }

  const zones = gridState?.zones || [];
  const onCount = zones.filter((z) => z.status === "ON").length;

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="mx-auto max-w-6xl px-6 py-6 space-y-6">
        <AlertBanner gridState={gridState} />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <StatCard label="Total demand" value={`${gridState?.totalDemand ?? "—"} kW`} />
          <StatCard label="Available supply" value={`${gridState?.availableSupplyKw ?? "—"} kW`} />
          <StatCard label="Zones online" value={`${onCount} / ${zones.length}`} />
          <StatCard
            label="Status"
            value={gridState?.shortage ? "SHEDDING" : "NOMINAL"}
            accent={gridState?.shortage ? "text-amber" : "text-on"}
          />
        </div>

        <DemandChart history={history} />

        {user.role === "admin" && (
          <form onSubmit={saveSupply} className="border border-line bg-panel p-4 flex items-end gap-3">
            <div>
              <label className="mb-1 block text-xs text-muted">
                Available supply capacity (kW)
              </label>
              <input
                type="number"
                min="0"
                value={supplyInput}
                onChange={(e) => setSupplyInput(e.target.value)}
                className="w-48 border border-line bg-void px-3 py-2 text-sm data-mono outline-none focus:border-cyan"
              />
            </div>
            <button
              type="submit"
              disabled={savingSupply}
              className="border border-cyan px-4 py-2 text-sm text-cyan hover:bg-cyan/10 transition-colors disabled:opacity-50"
            >
              {savingSupply ? "Saving..." : "Update supply"}
            </button>
          </form>
        )}

        <div>
          <div className="mb-3 text-sm font-medium">Zones</div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {zones.map((zone) => (
              <ZoneCard key={zone.id} zone={zone} />
            ))}
            {zones.length === 0 && (
              <div className="text-sm text-muted">
                No live data yet — waiting for the first simulation tick, or no zones exist yet.
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, accent = "text-primary" }) {
  return (
    <div className="border border-line bg-panel p-4">
      <div className="text-xs text-muted">{label}</div>
      <div className={`data-mono mt-1 text-xl ${accent}`}>{value}</div>
    </div>
  );
}
