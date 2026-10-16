const express = require("express");
const router = express.Router();
const { register, login, refresh, me } = require("../controllers/authController");
const { protect } = require("../middleware/auth");
const { authLimiter } = require("../middleware/rateLimiter");
const { registerRules, loginRules, handleValidation } = require("../utils/validators");

router.post("/register", authLimiter, registerRules, handleValidation, register);
router.post("/login", authLimiter, loginRules, handleValidation, login);
router.post("/refresh", authLimiter, refresh);
router.get("/me", protect, me);

module.exports = router;
