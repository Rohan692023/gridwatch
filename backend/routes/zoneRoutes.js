const express = require("express");
const router = express.Router();
const { listZones, createZone, updateZone, deleteZone } = require("../controllers/zoneController");
const { protect, authorize } = require("../middleware/auth");
const { zoneRules, handleValidation } = require("../utils/validators");

router.get("/", protect, listZones);
router.post("/", protect, authorize("admin"), zoneRules, handleValidation, createZone);
router.patch("/:id", protect, authorize("admin"), updateZone);
router.delete("/:id", protect, authorize("admin"), deleteZone);

module.exports = router;
