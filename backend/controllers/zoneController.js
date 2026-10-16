const Zone = require("../models/Zone");

// GET /api/zones
async function listZones(req, res, next) {
  try {
    const zones = await Zone.find().sort({ priority: 1, name: 1 });
    res.json({ zones });
  } catch (err) {
    next(err);
  }
}

// POST /api/zones (admin only)
async function createZone(req, res, next) {
  try {
    const { name, priority, baseLoadKw } = req.body;
    const zone = await Zone.create({
      name,
      priority,
      baseLoadKw,
      currentLoadKw: baseLoadKw,
    });
    res.status(201).json({ zone });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/zones/:id (admin only)
async function updateZone(req, res, next) {
  try {
    const { name, priority, baseLoadKw } = req.body;
    const zone = await Zone.findByIdAndUpdate(
      req.params.id,
      { ...(name && { name }), ...(priority && { priority }), ...(baseLoadKw != null && { baseLoadKw }) },
      { new: true, runValidators: true }
    );
    if (!zone) return res.status(404).json({ message: "Zone not found" });
    res.json({ zone });
  } catch (err) {
    next(err);
  }
}

// DELETE /api/zones/:id (admin only)
async function deleteZone(req, res, next) {
  try {
    const zone = await Zone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ message: "Zone not found" });
    res.json({ message: "Zone deleted" });
  } catch (err) {
    next(err);
  }
}

module.exports = { listZones, createZone, updateZone, deleteZone };
