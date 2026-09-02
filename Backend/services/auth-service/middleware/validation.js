const { body, param, query, validationResult } = require("express-validator");

const roles = ["INTERN", "MENTOR", "ADMIN", "HR"];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Invalid request data",
      errors: errors
        .array()
        .map(({ path, msg }) => ({ field: path, message: msg })),
    });
  }

  next();
};

const registerValidation = [
  body("full_name")
    .trim()
    .isLength({ min: 2, max: 120 })
    .withMessage("full_name must be between 2 and 120 characters"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("email must be valid")
    .normalizeEmail(),
  body("password")
    .isString()
    .isLength({ min: 8, max: 128 })
    .withMessage("password must be between 8 and 128 characters"),
  body("role")
    .optional()
    .isIn(["INTERN"])
    .withMessage("public registration can only create INTERN accounts"),
  handleValidationErrors,
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("email must be valid")
    .normalizeEmail(),
  body("password").isString().notEmpty().withMessage("password is required"),
  handleValidationErrors,
];

const userIdValidation = [
  param("userId")
    .isInt({ min: 1 })
    .withMessage("userId must be a positive integer")
    .toInt(),
  handleValidationErrors,
];

const updateRoleValidation = [
  param("userId")
    .isInt({ min: 1 })
    .withMessage("userId must be a positive integer")
    .toInt(),
  body("role")
    .isIn(roles)
    .withMessage("role must be INTERN, MENTOR, ADMIN, or HR"),
  handleValidationErrors,
];

const listUsersValidation = [
  query("role")
    .optional()
    .isIn(roles)
    .withMessage("role must be INTERN, MENTOR, ADMIN, or HR"),
  query("page")
    .optional()
    .isInt({ min: 1, max: 100000 })
    .withMessage("page must be a positive integer")
    .toInt(),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("limit must be between 1 and 100")
    .toInt(),
  handleValidationErrors,
];

module.exports = {
  registerValidation,
  loginValidation,
  userIdValidation,
  updateRoleValidation,
  listUsersValidation,
};
