const express = require("express");
const router = express.Router();
const controller = require("../controllers/professioncontroller");

router.get("/categories", controller.getCategoriesList);

router.get("/category/:categoryId", controller.getSubcategoriesByCategoryId);

router.get("/active/:lang", controller.getProfessionsActive);

router.get("/count", controller.getCategorySubcategoryCount);

router.get("/admin", controller.getProfessionsAdmin);
router.get("/artisans", controller.getArtisans);

router.post("/", controller.createProfession);

router.get("/:id", controller.getProfessionById);

router.put("/:id", controller.updateProfession);

router.put("/:id/status", controller.updateProfessionStatus);

router.put("/:id/translate/:lang", controller.updateProfessionTranslation);

router.get("/artisans/:id", controller.getArtisanById);

router.put("/artisans/:id/admin-approval", controller.toggleAdminApproval);

router.patch(
  "/categories/:categoryId/subcategories/:subcategoryName/status",
  controller.updateSubcategoryStatus
);
router.put(
  "/artisans/:id/authentication",
  controller.toggleArtisanAuthentication
);
router.put("/artisans/:id/isPremium", controller.toggleArtisanPremium);
router.put("/artisans/:id/isAvailable", controller.toggleArtisanAvailability);

router.delete("/:id", controller.deleteProfession);

module.exports = router;
