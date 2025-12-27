const express = require("express");
const router = express.Router();

const { getChatHistory } = require("../controllers/chatController");
const { getPresence } = require("../controllers/chatuserController");

router.get("/history", getChatHistory);
router.get("/presence/:id", getPresence);

module.exports = router;
