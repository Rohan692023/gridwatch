const mongoose = require("mongoose");

// Audit entries are append-only: nothing in this app ever calls
// updateOne/deleteOne on this collection (enforced in the controller layer,
// not just by convention).
const auditLogSchema = new mongoose.Schema(
  {
    zone: { type: mongoose.Schema.Types.ObjectId, ref: "Zone", required: true },
    zoneName: { type: String, required: true },
    action: {
      type: String,
      enum: ["AUTO_SHED", "AUTO_RESTORE", "MANUAL_SHED", "MANUAL_RESTORE"],
      required: true,
    },
    reason: { type: String, required: true, maxlength: 300 },
    triggeredBy: {
      type: String,
      enum: ["system", "operator"],
      required: true,
    },
    performedByUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    demandKwAtEvent: { type: Number },
    supplyKwAtEvent: { type: Number },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AuditLog", auditLogSchema);
