const express = require("express");
const router = express.Router();

const { getChatHistory } = require("../controllers/chatController");
const { getPresence } = require("../controllers/chatuserController");
const { getChatUsersList } = require("../controllers/chatuserController");

router.get("/history", getChatHistory);
router.get("/presence/:id", getPresence);
router.get("/users/:userId", getChatUsersList);

module.exports = router;
