const express = require("express");
const router = express.Router();
const { getSettings, updateSettings, manualOverride } = require("../controllers/dispatchController");
const { protect, authorize } = require("../middleware/auth");
const { overrideLimiter } = require("../middleware/rateLimiter");
const { overrideRules, settingsRules, handleValidation } = require("../utils/validators");

router.get("/settings", protect, getSettings);
router.patch(
  "/settings",
  protect,
  authorize("admin"),
  settingsRules,
  handleValidation,
  updateSettings
);
router.post(
  "/override",
  protect,
  authorize("admin", "operator"),
  overrideLimiter,
  overrideRules,
  handleValidation,
  manualOverride
);

module.exports = router;
