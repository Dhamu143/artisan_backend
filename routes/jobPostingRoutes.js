const express = require("express");
const router = express.Router();
const jobPostingController = require("../controllers/jobPostingController");

router.post("/add", jobPostingController.createJobPost);
router.put("/update/:id", jobPostingController.updateJobPost);
router.delete("/delete/:id", jobPostingController.deleteJobPost);
router.get("/:id/applications", jobPostingController.getJobApplications);
router.get("/all", jobPostingController.getAllJobPosts);
router.get("/:id", jobPostingController.getJobPostById);
router.get("/search", jobPostingController.searchJobs); 

router.post("/apply", jobPostingController.applyForJob); 
module.exports = router;
