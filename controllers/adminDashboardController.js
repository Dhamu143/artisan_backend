const User = require("../models/userModel");
const data = require("../data.json");
const { LANGUAGES } = require("../constants/languages");

const LANGUAGE_MAP = Object.fromEntries(
  LANGUAGES.map(({ code, label }) => [code, label])
);

const categoryMap = new Map(
  data.Categories.map((cat) => [cat.id, cat.Category_Name])
);

const professionCount = data.Categories.reduce((total, category) => {
  if (category.Subcategories?.length) {
    return (
      total +
      category.Subcategories.reduce(
        (sum, sub) => sum + (sub.Professions?.length || 0),
        0
      )
    );
  }
  return total + (category.Professions?.length || 0);
}, 0);

const getFullDashboardData = async (req, res) => {
  try {
    const [totalUsers, usersByCategoryRaw, usersByLanguageRaw] =
      await Promise.all([
        User.countDocuments(),

        User.aggregate([
          { $match: { categoryId: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: "$categoryId",
              userCount: { $sum: 1 },
            },
          },
        ]),

        User.aggregate([
          { $match: { languageCode: { $exists: true, $ne: null } } },
          {
            $group: {
              _id: "$languageCode",
              userCount: { $sum: 1 },
            },
          },
          { $sort: { userCount: -1 } },
        ]),
      ]);

    const usersByCategory = usersByCategoryRaw.map(({ _id, userCount }) => ({
      categoryId: _id,
      categoryName: categoryMap.get(_id) || "Unknown",
      userCount,
    }));

    const usersByLanguage = usersByLanguageRaw.map(({ _id, userCount }) => ({
      languageCode: _id,
      languageName: LANGUAGE_MAP[_id] || "Unknown",
      userCount,
    }));

    return res.status(200).json({
      issuccess: true,
      data: {
        userCount: totalUsers,
        professionCount,
        usersByCategory,
        usersByLanguage,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return res.status(500).json({
      issuccess: false,
      error: "Internal Server Error",
    });
  }
};

module.exports = { getFullDashboardData };

// const User = require("../models/userModel");
// const data = require("../data.json");

// const LANGUAGE_MAP = {
//   en: "English",
//   hi: "Hindi",
//   tm: "Tamil",
//   gt: "Gujarati",
//   bn: "Bengali",
//   mr: "Marathi",
//   kn: "Kannada",
//   tg: "Telugu",
//   od: "Odia",
//   ml: "Malayalam",
// };

// const categoryMap = new Map(
//   data.Categories.map((cat) => [cat.id, cat.Category_Name])
// );

// const professionCount = data.Categories.reduce((total, category) => {
//   if (category.Subcategories?.length) {
//     return (
//       total +
//       category.Subcategories.reduce(
//         (sum, sub) => sum + (sub.Professions?.length || 0),
//         0
//       )
//     );
//   }
//   return total + (category.Professions?.length || 0);
// }, 0);

// // const getFullDashboardData = async (req, res) => {
// //   try {
// //     const [totalUsers, usersByCategoryRaw] = await Promise.all([
// //       User.countDocuments(),

// //       User.aggregate([
// //         {
// //           $match: {
// //             categoryId: { $exists: true, $ne: null },
// //           },
// //         },
// //         {
// //           $group: {
// //             _id: "$categoryId",
// //             userCount: { $sum: 1 },
// //           },
// //         },
// //       ]),
// //     ]);

// //     const usersByCategory = usersByCategoryRaw.map(({ _id, userCount }) => ({
// //       categoryId: _id,
// //       categoryName: categoryMap.get(_id) || "Unknown",
// //       userCount,
// //     }));

// //     return res.status(200).json({
// //       issuccess: true,
// //       data: {
// //         userCount: totalUsers,
// //         professionCount,
// //         usersByCategory,
// //       },
// //     });
// //   } catch (error) {
// //     console.error("Dashboard error:", error);
// //     return res.status(500).json({
// //       issuccess: false,
// //       error: "Internal Server Error",
// //     });
// //   }
// // };

// const getFullDashboardData = async (req, res) => {
//   try {
//     const [totalUsers, usersByCategoryRaw, usersByLanguageRaw] =
//       await Promise.all([
//         User.countDocuments(),

//         User.aggregate([
//           { $match: { categoryId: { $exists: true, $ne: null } } },
//           {
//             $group: {
//               _id: "$categoryId",
//               userCount: { $sum: 1 },
//             },
//           },
//         ]),

//         User.aggregate([
//           {
//             $match: {
//               languageCode: { $exists: true, $ne: null },
//             },
//           },
//           {
//             $group: {
//               _id: "$languageCode",
//               userCount: { $sum: 1 },
//             },
//           },
//           { $sort: { userCount: -1 } },
//         ]),
//       ]);

//     const usersByCategory = usersByCategoryRaw.map(({ _id, userCount }) => ({
//       categoryId: _id,
//       categoryName: categoryMap.get(_id) || "Unknown",
//       userCount,
//     }));

//     const usersByLanguage = usersByLanguageRaw.map(({ _id, userCount }) => ({
//       languageCode: _id,
//       languageName: LANGUAGE_MAP[_id] || "Unknown",
//       userCount,
//     }));

//     return res.status(200).json({
//       issuccess: true,
//       data: {
//         userCount: totalUsers,
//         professionCount,
//         usersByCategory,
//         usersByLanguage,
//       },
//     });
//   } catch (error) {
//     console.error("Dashboard error:", error);
//     return res.status(500).json({
//       issuccess: false,
//       error: "Internal Server Error",
//     });
//   }
// };

// module.exports = { getFullDashboardData };
