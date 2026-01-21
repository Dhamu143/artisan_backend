const JobPosting = require("../models/JobPosting");
const JobApplication = require("../models/JobApplication");

exports.createJobPost = async (req, res) => {
  try {
    console.log("====================================");
    console.log("🏢 Creating Company Job Post");
    console.log("====================================");
    console.log("📥 Data Received:", req.body);

    const {
      categoryId,
      subCategoryId,
      opening,
      role,
      experience,
      description,
      salary,
      companyName,
      companyAddress,
      jobType,
      skills,
      contactEmail,
      contactPhone,
    } = req.body;

    if (!categoryId || !subCategoryId) {
      return res.status(400).json({
        success: false,
        message: "categoryId and subCategoryId are required",
      });
    }

    const newJobPost = new JobPosting({
      categoryId,
      subCategoryId,
      opening,
      role,
      experience,
      description,
      salary,
      companyName,
      companyAddress,
      jobType,
      skills,
      contactEmail,
      contactPhone,
    });

    const savedJobPost = await newJobPost.save();

    console.log("✅ Job Post Created Successfully");
    console.log("🆔 Job ID:", savedJobPost._id);

    res.status(201).json({
      success: true,
      message: "Job posted successfully",
      data: savedJobPost,
    });
  } catch (error) {
    console.error("❌ Error creating job post");
    console.error("🔥 Message:", error.message);

    res.status(500).json({
      success: false,
      message: "Error posting job",
      error: error.message,
    });
  }
};

exports.getAllJobPosts = async (req, res) => {
  try {
    console.log("====================================");
    console.log("📦 GET ALL JOB POSTS API HIT");
    console.log("====================================");

    console.log("➡️ req.query:", req.query);
    console.log("➡️ req.params:", req.params);
    console.log("➡️ req.headers:", req.headers);

    const {
      page = 1,
      limit = 10,
      categoryId,
      subCategoryId,
    } = req.query;

    console.log("📄 Pagination Params:");
    console.log("page:", page);
    console.log("limit:", limit);

    console.log("📂 Filter Params:");
    console.log("categoryId:", categoryId);
    console.log("subCategoryId:", subCategoryId);

    const skip = (page - 1) * limit;
    console.log("⏭️ Skip:", skip);

    // 🔍 build filter object dynamically
    const filter = {};

    if (categoryId) {
      filter.categoryId = categoryId;
    }

    if (subCategoryId) {
      filter.subCategoryId = subCategoryId;
    }

    console.log("🔎 MongoDB Filter Object:", filter);

    // total count (with filters)
    const totalJobs = await JobPosting.countDocuments(filter);
    console.log("📊 Total Jobs Found:", totalJobs);

    // paginated filtered jobs
    const jobs = await JobPosting.find(filter)
      .populate("categoryId", "name")
      .populate("subCategoryId", "name")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    console.log("📑 Returned Jobs Count:", jobs.length);

    return res.status(200).json({
      success: true,
      filters: {
        categoryId: categoryId || null,
        subCategoryId: subCategoryId || null,
      },
      pagination: {
        page: Number(page),
        limit: Number(limit),
        totalJobs,
        totalPages: Math.ceil(totalJobs / limit),
      },
      count: jobs.length,
      data: jobs,
    });

  } catch (error) {
    console.error("❌ Error fetching job posts");
    console.error("🔥 Message:", error.message);
    console.error("🔥 Full Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch job posts",
      issue: {
        type: "SERVER_ERROR",
        source: "getAllJobPosts",
        details: error.message,
      },
    });
  }
};

exports.getJobPostById = async (req, res) => {
  try {
    console.log("--- Fetching Single Job Post ---");
    console.log("Requested ID:", req.params.id);

    const job = await JobPosting.findById(req.params.id);

    if (!job) {
      console.log("Job post not found in DB");
      return res.status(404).json({ message: "Job post not found" });
    }

    console.log("Job Found:", job.role);
    res.status(200).json(job);
  } catch (error) {
    console.error("Error fetching job details:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching job details", error: error.message });
  }
};

exports.updateJobPost = async (req, res) => {
  try {
    console.log("--- Updating Job Post ---");
    console.log("Target ID:", req.params.id);
    console.log("Update Data:", req.body);

    const updatedJob = await JobPosting.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    if (!updatedJob) {
      console.log("Update failed: Job not found");
      return res.status(404).json({ message: "Job post not found" });
    }

    console.log("Job Updated Successfully");
    res.status(200).json({ message: "Job updated", data: updatedJob });
  } catch (error) {
    console.error("Error updating job:", error.message);
    res
      .status(500)
      .json({ message: "Error updating job", error: error.message });
  }
};

exports.deleteJobPost = async (req, res) => {
  try {
    console.log("--- Deleting Job Post ---");
    console.log("Target ID:", req.params.id);

    const deletedJob = await JobPosting.findByIdAndDelete(req.params.id);

    if (!deletedJob) {
      console.log("Delete failed: Job not found");
      return res.status(404).json({ message: "Job post not found" });
    }

    console.log("Job Post Deleted Successfully");
    res.status(200).json({ message: "Job post deleted successfully" });
  } catch (error) {
    console.error("Error deleting job:", error.message);
    res
      .status(500)
      .json({ message: "Error deleting job", error: error.message });
  }
};

exports.searchJobs = async (req, res) => {
  try {
    const { keyword } = req.query;
    console.log("--- Searching Jobs ---");
    console.log("Search Keyword:", keyword);

    if (!keyword) {
      return res
        .status(400)
        .json({ message: "Please provide a keyword to search" });
    }

    const searchRegex = new RegExp(keyword, "i");

    const jobs = await JobPosting.find({
      $or: [
        { role: searchRegex },
        { companyName: searchRegex },
        { location: searchRegex },
        { skills: searchRegex },
      ],
    }).sort({ createdAt: -1 });

    console.log(`Found ${jobs.length} matches for "${keyword}"`);
    res.status(200).json(jobs);
  } catch (error) {
    console.error("Error searching jobs:", error.message);
    res
      .status(500)
      .json({ message: "Error searching jobs", error: error.message });
  }
};

exports.applyForJob = async (req, res) => {
  try {
    console.log("--- New Job Application ---");
    console.log("Application Data:", req.body);

    const { jobId, userId, resumeUrl } = req.body;

    // A. Check if the job actually exists
    const jobExists = await JobPosting.findById(jobId);
    if (!jobExists) {
      console.log("Application Failed: Job ID invalid");
      return res.status(404).json({ message: "Job not found" });
    }

    const newApplication = new JobApplication({
      jobId,
      userId,
      resumeUrl,
    });

    const savedApplication = await newApplication.save();

    console.log(`User ${userId} applied for Job ${jobId} successfully.`);

    res.status(201).json({
      message: "Application submitted successfully!",
      data: savedApplication,
    });
  } catch (error) {
    console.error("Error submitting application:", error.message);
    res.status(500).json({
      message: "Error submitting application",
      error: error.message,
    });
  }
};


exports.getJobApplications = async (req, res) => {
  try {
    const { jobId } = req.params;
    console.log(`--- Fetching Applications for Job ID: ${jobId} ---`);

    const applications = await JobApplication.find({ jobId: jobId }).sort({
      createdAt: -1,
    });

    console.log(`Found ${applications.length} applications.`);
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error fetching applications:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching applications", error: error.message });
  }
};
