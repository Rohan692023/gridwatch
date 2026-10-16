import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function DemandChart({ history }) {
  return (
    <div className="border border-line bg-panel p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="text-sm font-medium">Demand vs. Supply</div>
        <div className="flex gap-4 data-mono text-xs">
          <span className="flex items-center gap-1.5 text-amber">
            <span className="inline-block h-2 w-2 bg-amber" /> demand
          </span>
          <span className="flex items-center gap-1.5 text-cyan">
            <span className="inline-block h-2 w-2 bg-cyan" /> supply
          </span>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={history} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
          <CartesianGrid stroke="#212A35" strokeDasharray="2 4" />
          <XAxis dataKey="time" stroke="#7C8A9A" fontSize={10} tickLine={false} />
          <YAxis stroke="#7C8A9A" fontSize={10} tickLine={false} />
          <Tooltip
            contentStyle={{
              background: "#10151C",
              border: "1px solid #212A35",
              fontSize: 12,
              fontFamily: "IBM Plex Mono, monospace",
            }}
          />
          <Line type="monotone" dataKey="demand" stroke="#E8A33D" dot={false} strokeWidth={2} />
          <Line type="monotone" dataKey="supply" stroke="#4FB3BF" dot={false} strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
