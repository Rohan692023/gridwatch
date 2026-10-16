const { body, validationResult } = require("express-validator");

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: "Validation failed", errors: errors.array() });
  }
  next();
}

const registerRules = [
  body("name").trim().isLength({ min: 2, max: 60 }).withMessage("Name must be 2-60 characters"),
  body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters")
    .matches(/\d/)
    .withMessage("Password must contain a number"),
];

const loginRules = [
  body("email").isEmail().withMessage("Valid email required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
];

const zoneRules = [
  body("name").trim().isLength({ min: 2, max: 80 }).withMessage("Name must be 2-80 characters"),
  body("priority").isInt({ min: 1, max: 3 }).withMessage("Priority must be 1, 2, or 3"),
  body("baseLoadKw").isFloat({ min: 0, max: 100000 }).withMessage("baseLoadKw must be a positive number"),
];

const overrideRules = [
  body("zoneId").isMongoId().withMessage("Valid zoneId required"),
  body("action").isIn(["ON", "OFF"]).withMessage("action must be ON or OFF"),
  body("reason").trim().isLength({ min: 3, max: 300 }).withMessage("A reason (3-300 chars) is required"),
];

const settingsRules = [
  body("availableSupplyKw")
    .isFloat({ min: 0, max: 100000 })
    .withMessage("availableSupplyKw must be a positive number"),
];

module.exports = {
  handleValidation,
  registerRules,
  loginRules,
  zoneRules,
  overrideRules,
  settingsRules,
};
