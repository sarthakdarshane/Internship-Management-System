const pool = require("../config/database");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const allowedRoles = new Set(["INTERN", "MENTOR", "ADMIN", "HR"]);

const register = async (req, res) => {
    try {
        const { full_name, password } = req.body;
        const email = req.body.email?.trim().toLowerCase();
        const role = "INTERN";

        if (!full_name?.trim() || !email || !password) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }

        if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8) {
            return res.status(400).json({
                message: "Use a valid email and an 8-character password"
            });
        }

        const existingUser = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                message: "Email already registered"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users
            (full_name, email, password, role)
            VALUES ($1, $2, $3, $4)
            RETURNING user_id, full_name, email, role`,
            [full_name.trim(), email, hashedPassword, role]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error("REGISTER ERROR:", error);

        res.status(500).json({
            message: "Server error"
        });
    }
};


const login = async (req, res) => {
    try {
        const email = req.body.email?.trim().toLowerCase();
        const { password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                user_id: user.user_id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1d"
            }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                user_id: user.user_id,
                full_name: user.full_name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
    console.error("LOGIN ERROR:", error);

    res.status(500).json({
        message: "Server error"
    });
}

};

const getProfile = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT user_id, full_name, email, role FROM users WHERE user_id = $1",
            [req.user.user_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error("PROFILE ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getUsers = async (req, res) => {
    try {
        const role = req.query.role?.toUpperCase();
        const page = req.query.page || 1;
        const limit = req.query.limit || 20;
        const offset = (page - 1) * limit;
        const filter = role ? "WHERE role = $1" : "";
        const values = role ? [role, limit, offset] : [limit, offset];
        const limitPosition = role ? 2 : 1;
        const offsetPosition = role ? 3 : 2;

        const [usersResult, totalResult] = await Promise.all([
            pool.query(
                `SELECT user_id, full_name, email, role, created_at, updated_at
                 FROM users ${filter}
                 ORDER BY user_id DESC LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
                values
            ),
            pool.query(`SELECT COUNT(*)::int AS total FROM users ${filter}`, role ? [role] : [])
        ]);

        res.json({
            users: usersResult.rows,
            pagination: { page, limit, total: totalResult.rows[0].total }
        });
    } catch (error) {
        console.error("GET USERS ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const getUserById = async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT user_id, full_name, email, role, created_at, updated_at FROM users WHERE user_id = $1",
            [req.params.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error("GET USER ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

const updateUserRole = async (req, res) => {
    try {
        const role = req.body.role.toUpperCase();

        if (!allowedRoles.has(role)) {
            return res.status(400).json({ message: "Invalid role" });
        }

        const result = await pool.query(
            `UPDATE users
             SET role = $1, updated_at = CURRENT_TIMESTAMP
             WHERE user_id = $2
             RETURNING user_id, full_name, email, role, created_at, updated_at`,
            [role, req.params.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        res.json({ message: "User role updated successfully", user: result.rows[0] });
    } catch (error) {
        console.error("UPDATE USER ROLE ERROR:", error);
        res.status(500).json({ message: "Server error" });
    }
};

module.exports = { register, login, getProfile, getUsers, getUserById, updateUserRole };
