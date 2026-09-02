const express = require("express");

const {
    register,
    login,
    getProfile,
    getUsers,
    getUserById,
    updateUserRole
} = require("../controllers/authController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizeRoles = require("../middleware/authorizeRoles");
const {
    registerValidation,
    loginValidation,
    userIdValidation,
    updateRoleValidation,
    listUsersValidation
} = require("../middleware/validation");
const { rateLimit } = require("express-rate-limit");

const router = express.Router();

const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many sign-in attempts. Please try again in 15 minutes." }
});

const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: 5,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many registration attempts. Please try again later." }
});

router.post("/register", registerLimiter, registerValidation, register);

router.post("/login", loginLimiter, loginValidation, login);

router.get("/profile", authMiddleware, getProfile);

router.get("/users", authMiddleware, authorizeRoles("ADMIN", "HR"), listUsersValidation, getUsers);

router.get("/users/:userId", authMiddleware, authorizeRoles("ADMIN", "HR"), userIdValidation, getUserById);

router.patch("/users/:userId/role", authMiddleware, authorizeRoles("ADMIN"), updateRoleValidation, updateUserRole);

module.exports = router;
