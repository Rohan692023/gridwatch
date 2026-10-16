import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import api from "../api/axios";

const priorityLabel = { 1: "CRITICAL", 2: "MEDIUM", 3: "LOW" };
const priorityColor = { 1: "text-cyan", 2: "text-amber", 3: "text-muted" };

export default function ZoneCard({ zone }) {
  const { user } = useAuth();
  const [showOverride, setShowOverride] = useState(false);
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isOn = zone.status === "ON";
  const canOverride = (user.role === "admin" || user.role === "operator") && zone.priority !== 1;

  async function submitOverride(action) {
    setSubmitting(true);
    setError("");
    try {
      await api.post("/dispatch/override", { zoneId: zone.id, action, reason });
      setShowOverride(false);
      setReason("");
    } catch (err) {
      setError(err.response?.data?.message || "Override failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className={`border bg-panel p-4 transition-colors ${
        isOn ? "border-line" : "border-off/50"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-medium">{zone.name}</div>
          <div className={`data-mono text-xs mt-0.5 ${priorityColor[zone.priority]}`}>
            {priorityLabel[zone.priority]}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`h-2 w-2 ${isOn ? "bg-on" : "bg-off"}`} aria-hidden="true" />
          <span className={`data-mono text-xs ${isOn ? "text-on" : "text-off"}`}>{zone.status}</span>
        </div>
      </div>

      <div className="mt-3 data-mono text-2xl">
        {zone.currentLoadKw?.toFixed(1)} <span className="text-sm text-muted">kW</span>
      </div>

      <div className="mt-1 data-mono text-xs text-muted">
        Downtime: {Math.round(zone.totalDowntimeMinutes || 0)} min
      </div>

      {canOverride && (
        <div className="mt-3">
          {!showOverride ? (
            <button
              onClick={() => setShowOverride(true)}
              className="w-full border border-line py-1.5 text-xs text-muted hover:text-primary hover:border-cyan transition-colors"
            >
              Manual override
            </button>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (required)"
                className="w-full border border-line bg-void px-2 py-1.5 text-xs text-primary placeholder:text-muted focus:border-cyan outline-none"
              />
              {error && <div className="text-xs text-off">{error}</div>}
              <div className="flex gap-2">
                <button
                  disabled={!reason.trim() || submitting}
                  onClick={() => submitOverride(isOn ? "OFF" : "ON")}
                  className="flex-1 border border-line py-1.5 text-xs hover:border-cyan disabled:opacity-40 transition-colors"
                >
                  {isOn ? "Shed zone" : "Restore zone"}
                </button>
                <button
                  onClick={() => {
                    setShowOverride(false);
                    setError("");
                  }}
                  className="flex-1 border border-line py-1.5 text-xs text-muted hover:text-primary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
