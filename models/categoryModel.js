const mongoose = require("mongoose");

const ProfessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, 
    display_name: { type: String, required: true },
    image_url: { type: String },
    isActive: { type: Boolean, default: true },
  },
  { _id: false }
);

const SubcategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true }, 
    Subcategory_Name: { type: String, required: true },
    Professions: [ProfessionSchema],
  },
  { _id: false }
);

const CategorySchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    Category_Name: { type: String, required: true },
    image_url: { type: String },
    Subcategories: [SubcategorySchema],
    Professions: [ProfessionSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Category", CategorySchema);
