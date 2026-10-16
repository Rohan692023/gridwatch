const Zone = require("../models/Zone");
const AuditLog = require("../models/AuditLog");
const GridSettings = require("../models/GridSettings");

// GET /api/dispatch/settings
async function getSettings(req, res, next) {
  try {
    const settings = await GridSettings.getSingleton();
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/dispatch/settings (admin only)
async function updateSettings(req, res, next) {
  try {
    const { availableSupplyKw } = req.body;
    const settings = await GridSettings.getSingleton();
    settings.availableSupplyKw = availableSupplyKw;
    await settings.save();

    req.app.get("io").emit("settings:update", { settings });
    res.json({ settings });
  } catch (err) {
    next(err);
  }
}

// POST /api/dispatch/override (admin, operator)
// Manual override always requires a reason — this is a deliberate friction
// point for accountability, not just a validation rule.
async function manualOverride(req, res, next) {
  try {
    const { zoneId, action, reason } = req.body; // action: "ON" | "OFF"

    const zone = await Zone.findById(zoneId);
    if (!zone) return res.status(404).json({ message: "Zone not found" });

    if (zone.priority === 1 && action === "OFF") {
      return res.status(400).json({
        message: "Critical (priority 1) zones cannot be manually shed.",
      });
    }

    const previousStatus = zone.status;
    zone.status = action;

    if (action === "OFF" && previousStatus === "ON") {
      zone.lastShedAt = new Date();
    }
    if (action === "ON" && previousStatus === "OFF") {
      zone.lastRestoredAt = new Date();
      if (zone.lastShedAt) {
        const minutes = (Date.now() - zone.lastShedAt.getTime()) / 60000;
        zone.totalDowntimeMinutes += Math.max(0, minutes);
      }
    }

    await zone.save();

    const settings = await GridSettings.getSingleton();
    await AuditLog.create({
      zone: zone._id,
      zoneName: zone.name,
      action: action === "OFF" ? "MANUAL_SHED" : "MANUAL_RESTORE",
      reason: reason || "No reason provided",
      triggeredBy: "operator",
      performedByUser: req.user._id,
      demandKwAtEvent: zone.currentLoadKw,
      supplyKwAtEvent: settings.availableSupplyKw,
    });

    const io = req.app.get("io");
    io.emit("zone:update", { zone });

    res.json({ zone });
  } catch (err) {
    next(err);
  }
}

module.exports = { getSettings, updateSettings, manualOverride };
