const pool = require("../config/database");
const isManager = (role) => ["ADMIN", "HR"].includes(role);

// Create internship
const createInternship = async (req, res) => {
  try {
    const {
      intern_id,
      mentor_id,
      company_name,
      internship_title,
      start_date,
      end_date,
      description,
    } = req.body;

    if (
      !intern_id ||
      !mentor_id ||
      !company_name?.trim() ||
      !internship_title?.trim() ||
      !start_date ||
      !end_date
    ) {
      return res.status(400).json({
        message:
          "intern_id, mentor_id, company_name, internship_title, start_date and end_date are required",
      });
    }

    if (new Date(end_date) < new Date(start_date)) {
      return res
        .status(400)
        .json({ message: "end_date must be after start_date" });
    }

    const result = await pool.query(
      `INSERT INTO internships
            (intern_id, mentor_id, company_name, internship_title,
             start_date, end_date, description)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *`,
      [
        intern_id,
        mentor_id,
        company_name,
        internship_title,
        start_date,
        end_date,
        description,
      ],
    );

    res.status(201).json({
      message: "Internship created successfully",
      internship: result.rows[0],
    });
  } catch (error) {
    console.error("CREATE INTERNSHIP ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Get all internships
const getInternships = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM internships ORDER BY internship_id DESC",
    );

    res.json({
      internships: result.rows,
    });
  } catch (error) {
    console.error("GET INTERNSHIPS ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

const getMyInternships = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM internships WHERE intern_id = $1 ORDER BY start_date DESC",
      [req.user.user_id],
    );
    res.json({ internships: result.rows });
  } catch (error) {
    console.error("GET MY INTERNSHIPS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const getAssignedInternships = async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM internships WHERE mentor_id = $1 ORDER BY start_date DESC",
      [req.user.user_id],
    );
    res.json({ internships: result.rows });
  } catch (error) {
    console.error("GET ASSIGNED INTERNSHIPS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get internship by ID
const getInternshipById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM internships WHERE internship_id = $1",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Internship not found",
      });
    }

    const internship = result.rows[0];
    if (
      !isManager(req.user.role) &&
      internship.intern_id !== req.user.user_id &&
      internship.mentor_id !== req.user.user_id
    ) {
      return res
        .status(403)
        .json({ message: "You do not have access to this internship" });
    }

    res.json({
      internship,
    });
  } catch (error) {
    console.error("GET INTERNSHIP ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Update internship
const updateInternship = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      mentor_id,
      company_name,
      internship_title,
      start_date,
      end_date,
      status,
      description,
    } = req.body;

    const result = await pool.query(
      `UPDATE internships
             SET mentor_id = $1,
                 company_name = $2,
                 internship_title = $3,
                 start_date = $4,
                 end_date = $5,
                 status = $6,
                 description = $7
             WHERE internship_id = $8
             RETURNING *`,
      [
        mentor_id,
        company_name,
        internship_title,
        start_date,
        end_date,
        status,
        description,
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Internship not found",
      });
    }

    res.json({
      message: "Internship updated successfully",
      internship: result.rows[0],
    });
  } catch (error) {
    console.error("UPDATE INTERNSHIP ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

// Delete internship
const deleteInternship = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM internships WHERE internship_id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        message: "Internship not found",
      });
    }

    res.json({
      message: "Internship deleted successfully",
    });
  } catch (error) {
    console.error("DELETE INTERNSHIP ERROR:", error);

    res.status(500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

module.exports = {
  createInternship,
  getInternships,
  getMyInternships,
  getAssignedInternships,
  getInternshipById,
  updateInternship,
  deleteInternship,
};
