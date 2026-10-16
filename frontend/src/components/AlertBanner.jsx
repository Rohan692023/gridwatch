import React from "react";

export default function AlertBanner({ gridState }) {
  if (!gridState) return null;

  if (gridState.criticalOverload) {
    return (
      <div className="border border-off bg-off/10 px-4 py-3 text-sm text-off">
        CRITICAL OVERLOAD — available supply cannot cover critical-priority zones.
        Increase supply capacity immediately.
      </div>
    );
  }

  if (gridState.shortage) {
    return (
      <div className="border border-amber bg-amber/10 px-4 py-3 text-sm text-amber">
        SUPPLY SHORTAGE — demand ({gridState.totalDemand} kW) exceeds available supply (
        {gridState.availableSupplyKw} kW). Load shedding active on lower-priority zones.
      </div>
    );
  }

  return (
    <div className="border border-on bg-on/10 px-4 py-3 text-sm text-on">
      All zones nominal — supply covers demand.
    </div>
  );
}
