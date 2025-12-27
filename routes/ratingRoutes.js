const express = require("express");
const router = express.Router();
const {
  addRating,
  getRatingsForUser,
  deleteRating,
} = require("../controllers/ratingController");

router.post("/add", addRating);
router.get("/:userId", getRatingsForUser);
router.delete("/:ratingId", deleteRating);
module.exports = router;
