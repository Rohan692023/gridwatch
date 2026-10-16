const mongoose = require("mongoose");

// Singleton document (there should only ever be one). Holds the
// admin-configured total generation capacity for the simulated grid.
const gridSettingsSchema = new mongoose.Schema(
  {
    availableSupplyKw: { type: Number, required: true, default: 500 },
  },
  { timestamps: true }
);

gridSettingsSchema.statics.getSingleton = async function () {
  let doc = await this.findOne();
  if (!doc) {
    doc = await this.create({ availableSupplyKw: 500 });
  }
  return doc;
};

module.exports = mongoose.model("GridSettings", gridSettingsSchema);
