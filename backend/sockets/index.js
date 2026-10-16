const jwt = require("jsonwebtoken");
const Zone = require("../models/Zone");
const AuditLog = require("../models/AuditLog");
const GridSettings = require("../models/GridSettings");
const { simulateDemand } = require("../services/demandSimulator");
const { optimizeLoadShedding, greedyFallback, MAX_DP_CAPACITY } = require("../services/optimizationEngine");

function initSockets(io) {
  // Require a valid JWT to open a socket connection at all — the live feed
  // includes operational grid data, not something to expose anonymously.
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Authentication required"));
      jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch (err) {
      next(new Error("Invalid or expired token"));
    }
  });

  io.on("connection", (socket) => {
    socket.on("disconnect", () => {});
  });

  const tickMs = parseInt(process.env.DEMAND_TICK_MS, 10) || 4000;
  setInterval(() => runDispatchTick(io).catch((err) => console.error("Dispatch tick error:", err)), tickMs);
}

async function runDispatchTick(io) {
  const zones = await Zone.find();
  if (zones.length === 0) return;

  const settings = await GridSettings.getSingleton();
  const simulatedLoads = simulateDemand(zones);

  // Apply simulated demand to each zone in memory first
  for (const zone of zones) {
    zone.currentLoadKw = simulatedLoads.get(String(zone._id)) ?? zone.currentLoadKw;
  }

  const totalDemand = zones.reduce((sum, z) => sum + z.currentLoadKw, 0);
  const shortage = totalDemand > settings.availableSupplyKw;

  let decision;
  if (shortage) {
    decision =
      settings.availableSupplyKw <= MAX_DP_CAPACITY
        ? optimizeLoadShedding(zones, settings.availableSupplyKw)
        : greedyFallback(zones, settings.availableSupplyKw);
  } else {
    // Enough supply for everyone — restore all zones
    decision = { keepOnIds: zones.map((z) => String(z._id)), shedIds: [] };
  }

  const keepOnSet = new Set(decision.keepOnIds);
  const changedZones = [];
  const newAuditEntries = [];

  for (const zone of zones) {
    const shouldBeOn = keepOnSet.has(String(zone._id));
    const newStatus = shouldBeOn ? "ON" : "OFF";
    const statusChanged = newStatus !== zone.status;

    if (statusChanged) {
      if (newStatus === "OFF") {
        zone.lastShedAt = new Date();
        newAuditEntries.push({
          zone: zone._id,
          zoneName: zone.name,
          action: "AUTO_SHED",
          reason: `Automatic load shed: demand (${totalDemand.toFixed(1)} kW) exceeded supply (${settings.availableSupplyKw} kW)`,
          triggeredBy: "system",
          demandKwAtEvent: zone.currentLoadKw,
          supplyKwAtEvent: settings.availableSupplyKw,
        });
      } else {
        if (zone.lastShedAt) {
          const minutes = (Date.now() - zone.lastShedAt.getTime()) / 60000;
          zone.totalDowntimeMinutes += Math.max(0, minutes);
        }
        zone.lastRestoredAt = new Date();
        newAuditEntries.push({
          zone: zone._id,
          zoneName: zone.name,
          action: "AUTO_RESTORE",
          reason: "Automatic restore: sufficient supply available",
          triggeredBy: "system",
          demandKwAtEvent: zone.currentLoadKw,
          supplyKwAtEvent: settings.availableSupplyKw,
        });
      }
    }

    zone.status = newStatus;
    changedZones.push(zone);
  }

  await Promise.all(changedZones.map((z) => z.save()));
  if (newAuditEntries.length > 0) {
    await AuditLog.insertMany(newAuditEntries);
  }

  io.emit("grid:tick", {
    zones: zones.map((z) => ({
      id: z._id,
      name: z.name,
      priority: z.priority,
      status: z.status,
      currentLoadKw: z.currentLoadKw,
      totalDowntimeMinutes: z.totalDowntimeMinutes,
    })),
    totalDemand: Math.round(totalDemand * 10) / 10,
    availableSupplyKw: settings.availableSupplyKw,
    shortage,
    criticalOverload: decision.criticalOverload || false,
    timestamp: new Date().toISOString(),
  });
}

module.exports = { initSockets };
