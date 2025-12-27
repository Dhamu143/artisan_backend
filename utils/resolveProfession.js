const data = require("../data.json");

function resolveCategory(categoryId) {
  return data.Categories.find((c) => c.id === categoryId) || null;
}

function resolveSubcategoryByProfession(category, professionId) {
  if (!category) return null;

  return category.Subcategories.find((sub) =>
    sub.Professions?.some((p) => p.id === professionId)
  ) || null;
}

function resolveProfession(subcategory, professionId) {
  if (!subcategory) return null;

  return subcategory.Professions.find((p) => p.id === professionId) || null;
}

function resolveAll(categoryId, professionId) {
  console.log("resolveAll INPUT:", { categoryId, professionId });

  const category = resolveCategory(categoryId);
  const subcategory = resolveSubcategoryByProfession(category, professionId);
  const profession = resolveProfession(subcategory, professionId);

  console.log("Found:", {
    category: category?.Category_Name,
    subcategory: subcategory?.Subcategory_Name,
    profession: profession?.display_name,
  });

  return {
    category: category
      ? {
          id: category.id,
          name: category.Category_Name,
          image_url: category.image_url,
        }
      : null,

    subcategory: subcategory
      ? {
          id: subcategory.Subcategory_Name,
          name: subcategory.Subcategory_Name,
          image_url: subcategory.image_url || null,
        }
      : null,

    profession: profession
      ? {
          id: profession.id,
          display_name: profession.display_name,
          image_url: profession.image_url,
        }
      : null,
  };
}

module.exports = resolveAll;
