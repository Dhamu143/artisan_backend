const express = require("express");
const router = express.Router();
const jobController = require("../controllers/jobController");

router.get("/category/:categoryId", jobController.getJobsByCategory);
router.post("/add", jobController.createJob);
router.get("/all", jobController.getAllJobs);
router.get("/:id", jobController.getJobById);
router.put("/update/:id", jobController.updateJob);
router.delete("/delete/:id", jobController.deleteJob);
module.exports = router;
