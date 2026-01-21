const data = require("../data.json");

function getCategoryHierarchyByProfessionId(professionId) {
  if (!professionId) return null;

  for (const category of data.Categories) {
    // Category with subcategories
    if (category.Subcategories) {
      for (const sub of category.Subcategories) {
        const profession = sub.Professions?.find(
          (p) => p.id === professionId
        );

        if (profession) {
          return {
            category: {
              id: category.id,
              name: category.Category_Name,
              icon: category.icon || "",
            },
            subCategory: {
              name: sub.Subcategory_Name,
            },
            profession,
          };
        }
      }
    }

    // Category without subcategories
    if (category.Professions) {
      const profession = category.Professions.find(
        (p) => p.id === professionId
      );

      if (profession) {
        return {
          category: {
            id: category.id,
            name: category.Category_Name,
            icon: category.icon || "",
          },
          subCategory: null,
          profession,
        };
      }
    }
  }

  return null;
}

module.exports = {
  getCategoryHierarchyByProfessionId,
};
