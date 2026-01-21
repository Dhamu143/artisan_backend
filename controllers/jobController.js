const JobSubmission = require("../models/JobSubmission");
const User = require("../models/userModel");
const admin = require("../firebase");
const {
  getCategoryHierarchyByProfessionId,
} = require("../utils/categoryMapper");

const safeStringifyData = (data = {}) => {
  return Object.keys(data).reduce((acc, key) => {
    acc[key] = String(data[key] || "");
    return acc;
  }, {});
};

exports.createJob = async (req, res) => {
  try {
    console.log("---- CREATE JOB API HIT ----");

    const {
      userId,
      categoryId,
      subCategoryId,
      description,
      imageUrl,
      fileUrl,
    } = req.body;

    const newJob = new JobSubmission({
      userId,
      categoryId,
      subCategoryId,
      description,
      imageUrl,
      fileUrl,
    });

    const savedJob = await newJob.save();
    console.log("✅ Job saved successfully:", savedJob._id);

    try {
      console.log(`📨 Finding artisans for Category: ${categoryId}`);

      const artisans = await User.find({
        findArtisan: false,
        categoryId: categoryId,
        pushNotificationToken: { $exists: true, $ne: "" },
        _id: { $ne: userId }
      }).select("pushNotificationToken");

      const tokens = artisans.map((u) => u.pushNotificationToken).filter(Boolean);

      if (tokens.length > 0) {
        console.log(`🎯 Found ${tokens.length} artisans. Sending push...`);

        const title = "New Job Opportunity!";
        const body = `A new job matches your company recruitment`;

        const dataPayload = safeStringifyData({
          type: "JOB_ALERT",
          jobId: savedJob._id,
          categoryId: categoryId
        });

        const batchSize = 500;
        const batches = [];
        for (let i = 0; i < tokens.length; i += batchSize) {
          const batchTokens = tokens.slice(i, i + batchSize);
          batches.push(
            admin.messaging().sendEachForMulticast({
              tokens: batchTokens,
              notification: { title, body },
              data: dataPayload,
            })
          );
        }

        await Promise.all(batches);
        console.log("🚀 Notifications sent to artisans.");
      } else {
        console.log("⚠️ No matching artisans found to notify.");
      }

    } catch (notifyError) {
      console.error("❌ Notification Error:", notifyError.message);
    }

    res.status(201).json({
      message: "Job created and notifications sent",
      success: true,
      data: savedJob,
    });

  } catch (error) {
    console.error("Create Job Error:", error);
    res.status(500).json({
      message: "Error creating job",
      error: error.message,
    });
  }
};


exports.getJobsByCategory = async (req, res) => {
  try {
    const { categoryId } = req.params;

    // pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // total count
    const totalJobs = await JobSubmission.countDocuments({ categoryId });

    const jobs = await JobSubmission.find({ categoryId })
      .populate("userId", "name email phone profileImage")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const enrichedJobs = jobs.map((job) => {
      const hierarchy = getCategoryHierarchyByProfessionId(
        job.subCategoryId
      );

      return {
        ...job.toObject(),
        category: hierarchy?.category || null,
        subCategory: hierarchy?.subCategory || null,
        profession: hierarchy?.profession || null,
      };
    });

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalJobs,
        totalPages: Math.ceil(totalJobs / limit),
      },
      count: enrichedJobs.length,
      data: enrichedJobs,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllJobs = async (req, res) => {
  try {
    console.log("---- GET ALL JOBS API HIT ----");

    // pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const totalJobs = await JobSubmission.countDocuments();

    const jobs = await JobSubmission.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    console.log(`Total jobs found: ${jobs.length}`);

    res.status(200).json({
      success: true,
      pagination: {
        page,
        limit,
        totalJobs,
        totalPages: Math.ceil(totalJobs / limit),
      },
      count: jobs.length,
      data: jobs,
    });
  } catch (error) {
    console.error("Get All Jobs Error:", error);

    res.status(500).json({
      message: "Error fetching jobs",
      error: error.message,
    });
  }
};


// GET JOB BY ID
exports.getJobById = async (req, res) => {
  try {
    console.log("---- GET JOB BY ID API HIT ----");
    console.log("Job ID:", req.params.id);

    const job = await JobSubmission.findById(req.params.id);

    if (!job) {
      console.warn("Job not found:", req.params.id);
      return res.status(404).json({ message: "Job not found" });
    }

    console.log("Job found:", job._id);

    res.status(200).json(job);
  } catch (error) {
    console.error("Get Job By ID Error:", error);

    res.status(500).json({
      message: "Error fetching job",
      error: error.message,
    });
  }
};

// UPDATE JOB
exports.updateJob = async (req, res) => {
  try {
    console.log("---- UPDATE JOB API HIT ----");
    console.log("Job ID:", req.params.id);
    console.log("Update Data:", req.body);

    const updatedJob = await JobSubmission.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          userId: req.body.userId,
          categoryId: req.body.categoryId,
          subCategoryId: req.body.subCategoryId,
          description: req.body.description,
          imageUrl: req.body.imageUrl,
          fileUrl: req.body.fileUrl,
        },
      },
      { new: true }
    );

    if (!updatedJob) {
      console.warn("Job not found for update:", req.params.id);
      return res.status(404).json({ message: "Job not found" });
    }

    console.log("Job updated successfully:", updatedJob._id);

    res.status(200).json({
      message: "Job updated successfully",
      data: updatedJob,
    });
  } catch (error) {
    console.error("Update Job Error:", error);

    res.status(500).json({
      message: "Error updating job",
      error: error.message,
    });
  }
};

// DELETE JOB
exports.deleteJob = async (req, res) => {
  try {
    console.log("---- DELETE JOB API HIT ----");
    console.log("Job ID:", req.params.id);

    const deletedJob = await JobSubmission.findByIdAndDelete(req.params.id);

    if (!deletedJob) {
      console.warn("Job not found for deletion:", req.params.id);
      return res.status(404).json({ message: "Job not found" });
    }

    console.log("Job deleted successfully:", deletedJob._id);

    res.status(200).json({
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Delete Job Error:", error);

    res.status(500).json({
      message: "Error deleting job",
      error: error.message,
    });
  }
};
