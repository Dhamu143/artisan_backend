const categoriesData = require("../data.json");

const enrichUserWithCategoryData = (user) => {
  const enrichedUser = user.toObject ? user.toObject() : { ...user };

  const { categoryId, subCategoryId } = enrichedUser;

  if (!categoryId) return enrichedUser;

  const category = categoriesData.Categories.find(
    (c) => c.id === categoryId
  );

  if (!category) return enrichedUser;

  enrichedUser.category = {
    id: category.id,
    Category_Name: category.Category_Name,
    image_url: category.image_url,
  };

  delete enrichedUser.categoryId;

  if (!subCategoryId || !category.Subcategories) return enrichedUser;

  for (const sub of category.Subcategories) {
    if (!sub.Professions) continue;

    const prof = sub.Professions.find((p) => p.id === subCategoryId);

    if (prof) {
      enrichedUser.subcategory = {
        id: prof.id,
        display_name: prof.display_name,
        image_url: prof.image_url,
        parentSubcategory: sub.Subcategory_Name,
      };
      break;
    }
  }

  delete enrichedUser.subCategoryId;

  return enrichedUser;
};

module.exports = enrichUserWithCategoryData;
