const User = require("../models/userModel");

const categoriesData = require("../data.json");

const restrictedFields = [
  "_id",
  "mobile_number",
  "isVerified",
  "createdAt",
  "updatedAt",
  "__v",
  "otp",
];

const deepMerge = (target, source) => {
  for (const key in source) {
    if (restrictedFields.includes(key)) continue;

    if (
      source[key] &&
      typeof source[key] === "object" &&
      !Array.isArray(source[key])
    ) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      target[key] = source[key];
    }
  }
};

const enrichUserWithCategoryData = (user) => {
  const enrichedUser = user.toObject ? user.toObject() : { ...user };

  const { categoryId, subCategoryId } = enrichedUser;

  if (!categoryId) return enrichedUser;

  const category = categoriesData.Categories.find((c) => c.id === categoryId);

  if (!category) return enrichedUser;

  enrichedUser.category = {
    id: category.id,
    Category_Name: category.Category_Name,
    image_url: category.image_url,
  };

  delete enrichedUser.categoryId;

  if (!subCategoryId || !category.Subcategories) return enrichedUser;

  let foundProfession = null;

  for (const sub of category.Subcategories) {
    if (!sub.Professions) continue;

    const prof = sub.Professions.find((p) => p.id === subCategoryId);

    if (prof) {
      foundProfession = {
        id: prof.id,
        display_name: prof.display_name,
        image_url: prof.image_url,
        parentSubcategory: sub.Subcategory_Name,
      };
      break;
    }
  }

  if (foundProfession) {
    enrichedUser.subcategory = foundProfession;
  }

  delete enrichedUser.subCategoryId;

  return enrichedUser;
};

//   UPDATE USER BY ID
// const updateUserById = async (req, res) => {
//   const targetUserId = req.params.userId;
//   const loggedInUserId = req.user?.userId;

//   if (!targetUserId) {
//     return res.status(400).json({ error: "User ID is required in URL." });
//   }

//   if (targetUserId !== loggedInUserId) {
//     return res
//       .status(403)
//       .json({ error: "Forbidden: You can only update your own profile." });
//   }
//   const updates = req.body;
//   console.log("updates", updates);
//   try {
//     const user = await User.findById(targetUserId);

//     if (!user) {
//       return res.status(404).json({ error: "User not found." });
//     }

//     deepMerge(user, updates);

//     await user.save();

//     let updatedUser = user.toObject();
//     delete updatedUser.otp;
//     delete updatedUser.__v;

//     updatedUser = enrichUserWithCategoryData(updatedUser);

//     return res.status(200).json({
//       message: "User data updated successfully.",
//       issuccess: true,
//       user: updatedUser,
//     });
//   } catch (error) {
//     console.error("Error updating user data:", error);
//     return res.status(500).json({
//       error: "Internal server error while updating user data.",
//     });
//   }
// };

const updateUserById = async (req, res) => {
  const targetUserId = req.params.userId;

  if (!targetUserId) {
    return res.status(400).json({ error: "User ID is required in URL." });
  }

  const updates = req.body;
  console.log("updates", updates);

  try {
    const user = await User.findById(targetUserId);

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    deepMerge(user, updates);

    await user.save();

    let updatedUser = user.toObject();
    delete updatedUser.otp;
    delete updatedUser.__v;

    updatedUser = enrichUserWithCategoryData(updatedUser);

    return res.status(200).json({
      message: "User data updated successfully.",
      issuccess: true,
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user data:", error);
    return res.status(500).json({
      error: "Internal server error while updating user data.",
    });
  }
};

//   GET USER BY ID
// const getUserById = async (req, res) => {
//   const targetUserId = req.params.userId;
//   const loggedInUserId = req.user?.userId || null;

//   if (!targetUserId) {
//     return res.status(400).json({ error: "User ID is required in URL." });
//   }
//   if (targetUserId !== loggedInUserId) {
//     return res.status(403).json({
//       error: "Forbidden: You are only authorized to view your own profile.",
//       issuccess: false,
//     });
//   }

//   try {
//     const user = await User.findById(targetUserId).select("-otp -__v");

//     if (!user) {
//       return res.status(404).json({ error: "User not found." });
//     }

//     const enrichedUser = enrichUserWithCategoryData(user);

//     return res.status(200).json({
//       message: "User data retrieved successfully.",
//       user: enrichedUser,
//       userId: loggedInUserId,
//       issuccess: true,
//     });
//   } catch (error) {
//     console.error("Error retrieving user:", error);
//     return res.status(500).json({
//       error: "Internal server error while retrieving user data.",
//     });
//   }
// };
const getUserById = async (req, res) => {
  const targetUserId = req.params.userId;

  if (!targetUserId) {
    return res.status(400).json({ error: "User ID is required in URL." });
  }

  try {
    const user = await User.findById(targetUserId).select("-otp -__v");

    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const enrichedUser = enrichUserWithCategoryData(user);

    return res.status(200).json({
      message: "User data retrieved successfully.",
      user: enrichedUser,
      issuccess: true,
    });
  } catch (error) {
    console.error("Error retrieving user:", error);
    return res.status(500).json({
      error: "Internal server error while retrieving user data.",
    });
  }
};

// DELETE USER BY ID (PUBLIC ADMIN DELETE)
const deleteUserById = async (req, res) => {
  const targetUserId = req.params.userId;

  try {
    const deleted = await User.findByIdAndDelete(targetUserId);

    if (!deleted) {
      return res.status(404).json({ error: "User not found." });
    }

    return res.status(200).json({
      message: "User deleted successfully.",
      deletedUserId: targetUserId,
      issuccess: true,
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      error: "Internal server error while deleting user.",
    });
  }
};
// GET ALL USERS

// const getAllUsers = async (req, res) => {
//   try {
//     const page =
//       Number(req.query["params[page]"]) || Number(req.query.page) || 1;
//     const limit =
//       Number(req.query["params[limit]"]) || Number(req.query.limit) || 10;

//     const skip = (page - 1) * limit;

//     const gender = req.query["params[gender]"] || req.query.gender;
//     const categoryId = req.query["params[categoryId]"] || req.query.categoryId;
//     const subCategoryId =
//       req.query["params[subCategoryId]"] || req.query.subCategoryId;

//     const isAuthenticat =
//       req.query["params[isAuthenticat]"] || req.query.isAuthenticat;

//     const findQuery = {};

//     if (gender) findQuery.gender = gender;
//     if (categoryId) findQuery.categoryId = categoryId;
//     if (subCategoryId) findQuery.subCategoryId = subCategoryId;

//     if (isAuthenticat === "true") findQuery.isAuthenticat = true;
//     if (isAuthenticat === "false") findQuery.isAuthenticat = false;

//     const totalUsers = await User.countDocuments(findQuery);

//     const users = await User.find(findQuery)
//       .select("-otp -__v -password")
//       .skip(skip)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     const enrichedUsers = users.map((u) => enrichUserWithCategoryData(u));

//     return res.status(200).json({
//       message: "All user data retrieved successfully.",
//       issuccess: true,
//       users: enrichedUsers,
//       totalUsers,
//       totalPages: Math.ceil(totalUsers / limit),
//       page,
//     });
//   } catch (error) {
//     console.error("Error retrieving all users:", error);
//     return res.status(500).json({
//       error: "Internal server error while retrieving all user data.",
//     });
//   }
// };

// const getAllUsers = async (req, res) => {
//   try {
//     const page =
//       Number(req.query["params[page]"]) || Number(req.query.page) || 1;
//     const limit =
//       Number(req.query["params[limit]"]) || Number(req.query.limit) || 10;

//     const skip = (page - 1) * limit;

//     const gender = req.query["params[gender]"] || req.query.gender;
//     const categoryId = req.query["params[categoryId]"] || req.query.categoryId;
//     const subCategoryId =
//       req.query["params[subCategoryId]"] || req.query.subCategoryId;

//     const isAuthenticat =
//       req.query["params[isAuthenticat]"] || req.query.isAuthenticat;

//     // 🔍 SEARCH
//     const search = req.query["params[search]"] || req.query.search || "";

//     const findQuery = {};

//     // Filters
//     if (gender) findQuery.gender = gender;
//     if (categoryId) findQuery.categoryId = categoryId;
//     if (subCategoryId) findQuery.subCategoryId = subCategoryId;

//     if (isAuthenticat === "true") findQuery.isAuthenticat = true;
//     if (isAuthenticat === "false") findQuery.isAuthenticat = false;

//     // 🔍 Search logic
//     if (search) {
//       findQuery.$or = [
//         { name: { $regex: search, $options: "i" } },
//         { email: { $regex: search, $options: "i" } },
//         { mobile_number: { $regex: search, $options: "i" } },
//       ];
//     }

//     const totalUsers = await User.countDocuments(findQuery);

//     const users = await User.find(findQuery)
//       .select("-otp -__v -password")
//       .skip(skip)
//       .limit(limit)
//       .sort({ createdAt: -1 });

//     const enrichedUsers = users.map((u) => enrichUserWithCategoryData(u));

//     return res.status(200).json({
//       message: "All user data retrieved successfully.",
//       issuccess: true,
//       users: enrichedUsers,
//       totalUsers,
//       totalPages: Math.ceil(totalUsers / limit),
//       page,
//     });
//   } catch (error) {
//     console.error("Error retrieving all users:", error);
//     return res.status(500).json({
//       error: "Internal server error while retrieving all user data.",
//     });
//   }
// };

const getAllUsers = async (req, res) => {
  try {
    const page =
      Number(req.query["params[page]"]) || Number(req.query.page) || 1;

    const limit =
      Number(req.query["params[limit]"]) || Number(req.query.limit) || 10;

    const skip = (page - 1) * limit;

    const gender = req.query["params[gender]"] || req.query.gender;
    const categoryId = req.query["params[categoryId]"] || req.query.categoryId;
    const subCategoryId =
      req.query["params[subCategoryId]"] || req.query.subCategoryId;

    const isAuthenticat =
      req.query["params[isAuthenticat]"] || req.query.isAuthenticat;

    const languageCode =
      req.query["params[languageCode]"] || req.query.languageCode;

    const search = req.query["params[search]"] || req.query.search || "";

    const findQuery = {};

    // ✅ Filters
    if (gender) findQuery.gender = gender;
    if (categoryId) findQuery.categoryId = categoryId;
    if (subCategoryId) findQuery.subCategoryId = subCategoryId;
    if (languageCode) findQuery.languageCode = languageCode;

    if (isAuthenticat === "true") findQuery.isAuthenticat = true;
    if (isAuthenticat === "false") findQuery.isAuthenticat = false;

    // 🔍 Search
    if (search) {
      findQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { mobile_number: { $regex: search, $options: "i" } },
      ];
    }

    const totalUsers = await User.countDocuments(findQuery);

    const users = await User.find(findQuery)
      .select("-otp -__v -password")
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const enrichedUsers = users.map((u) => enrichUserWithCategoryData(u));

    return res.status(200).json({
      message: "All user data retrieved successfully.",
      issuccess: true,
      users: enrichedUsers,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      page,
    });
  } catch (error) {
    console.error("Error retrieving all users:", error);
    return res.status(500).json({
      error: "Internal server error while retrieving all user data.",
    });
  }
};

const getUserCount = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();

    return res.status(200).json({
      isSuccess: true,
      totalUsers,
    });
  } catch (error) {
    console.error("User count error:", error);
    return res.status(500).json({
      isSuccess: false,
      error: "Internal server error",
    });
  }
};

const getUserIdAndName = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const search = req.query.search || "";

    const findQuery = {};

    if (search) {
      findQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { mobile_number: { $regex: search, $options: "i" } },
      ];
    }

    const totalUsers = await User.countDocuments(findQuery);

    const users = await User.find(findQuery)
      .select("_id name") // only id + name
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    return res.status(200).json({
      message: "User id-name list fetched successfully.",
      issuccess: true,
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      page,
    });
  } catch (error) {
    console.error("Error fetching user id-name list:", error);
    return res.status(500).json({
      issuccess: false,
      error: "Internal server error while fetching user id-name list.",
    });
  }
};
module.exports = {
  updateUserById,
  getUserById,
  deleteUserById,
  getUserCount,
  getAllUsers,
  getUserIdAndName,
};
