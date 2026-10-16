const express = require("express");
const router = express.Router();
const { listAuditLogs } = require("../controllers/auditController");
const { protect } = require("../middleware/auth");

// All authenticated roles can read the audit log (transparency), but only
// the system/admin actions ever write to it — see auditController.
router.get("/", protect, listAuditLogs);

module.exports = router;
