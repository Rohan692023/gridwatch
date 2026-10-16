const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    // 1 = critical (never shed automatically), 2 = medium, 3 = low
    priority: { type: Number, enum: [1, 2, 3], required: true },
    baseLoadKw: { type: Number, required: true, min: 0 },
    currentLoadKw: { type: Number, default: 0, min: 0 },
    status: {
      type: String,
      enum: ["ON", "OFF"],
      default: "ON",
    },
    // Rolling total, used by the fairness/rotation logic
    totalDowntimeMinutes: { type: Number, default: 0 },
    lastShedAt: { type: Date, default: null },
    lastRestoredAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Zone", zoneSchema);
