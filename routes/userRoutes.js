const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");

const {
  updateUserById,
  getUserById,
  deleteUserById,
  getAllUsers,
  getUserCount,
  getUserIdAndName,
} = require("../controllers/userController");
const router = express.Router();

router.get("/id-name", getUserIdAndName);

router.get("/all-users", getAllUsers);

router.get("/count", getUserCount);

router.put("/:userId", updateUserById);

router.get("/:userId", getUserById);

router.delete("/:userId", deleteUserById);

module.exports = router;
