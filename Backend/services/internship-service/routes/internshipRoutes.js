const express = require("express");

const {
  createInternship,
  getInternships,
  getMyInternships,
  getAssignedInternships,
  getInternshipById,
  updateInternship,
  deleteInternship,
} = require("../controllers/internshipController");
const { authenticate, authorize } = require("../../../shared/auth");

const router = express.Router();

router.use(authenticate);

router.post("/", authorize("ADMIN", "HR"), createInternship);

router.get("/mine", authorize("INTERN"), getMyInternships);

router.get("/assigned", authorize("MENTOR"), getAssignedInternships);

router.get("/", authorize("ADMIN", "HR"), getInternships);

router.get("/:id", getInternshipById);

router.put("/:id", authorize("ADMIN", "HR"), updateInternship);

router.delete("/:id", authorize("ADMIN"), deleteInternship);

module.exports = router;
