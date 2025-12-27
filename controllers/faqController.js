const FAQ = require("../models/faqModel");

const createFAQ = async (req, res) => {
  try {
    const { question, answer } = req.body;

    if (!question || !answer) {
      return res
        .status(400)
        .json({ issuccess: false, error: "Question and answer are required" });
    }

    const faq = await FAQ.create({ question, answer });

    res.status(201).json({
      issuccess: true,
      message: "FAQ created successfully",
      data: faq,
    });
  } catch (error) {
    console.error("Create FAQ error:", error);
    res.status(500).json({ issuccess: false, error: "Internal Server Error" });
  }
};

const getAllFAQs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const query = { isActive: true };

    const [faqs, total] = await Promise.all([
      FAQ.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit),
      FAQ.countDocuments(query),
    ]);

    res.status(200).json({
      issuccess: true,
      data: faqs,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Fetch FAQs error:", error);
    res.status(500).json({ issuccess: false, error: "Internal Server Error" });
  }
};

const updateFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndUpdate(id, req.body, { new: true });

    if (!faq) {
      return res.status(404).json({ issuccess: false, error: "FAQ not found" });
    }

    res.status(200).json({
      issuccess: true,
      message: "FAQ updated successfully",
      data: faq,
    });
  } catch (error) {
    console.error("Update FAQ error:", error);
    res.status(500).json({ issuccess: false, error: "Internal Server Error" });
  }
};

const deleteFAQ = async (req, res) => {
  try {
    const { id } = req.params;
    const faq = await FAQ.findByIdAndDelete(id);

    if (!faq) {
      return res.status(404).json({ issuccess: false, error: "FAQ not found" });
    }

    res.status(200).json({
      issuccess: true,
      message: "FAQ deleted successfully",
    });
  } catch (error) {
    console.error("Delete FAQ error:", error);
    res.status(500).json({ issuccess: false, error: "Internal Server Error" });
  }
};

module.exports = {
  createFAQ,
  getAllFAQs,
  updateFAQ,
  deleteFAQ,
};
