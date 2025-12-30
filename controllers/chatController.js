const mongoose = require("mongoose");
const Message = require("../models/Message");

const chatId = (u1, u2) => [u1, u2].sort().join("_");

exports.getChatHistory = async (req, res) => {
  try {
    const { me, user, beforeMessageId, pageSize = 20 } = req.query;

    if (!me || !user)
      return res.status(400).json({ message: "me and user are required" });

    const cid = chatId(me, user);

    const query = { chatId: cid };

    if (beforeMessageId && mongoose.isValidObjectId(beforeMessageId)) {
      const cursorMsg = await Message.findById(beforeMessageId).select(
        "createdAt"
      );

      if (cursorMsg) {
        query.createdAt = { $lt: cursorMsg.createdAt };
      }
    }

    const messages = await Message.find(query)
      .sort({ createdAt: -1 }) 
      .limit(Number(pageSize));
    const ordered = messages.reverse();

    res.json({
      messages: ordered,
      hasMore: messages.length === Number(pageSize),
      nextCursor: ordered.length > 0 ? ordered[0]._id : null, 
    });
  } catch (err) {
    console.error("❌ Chat history error:", err);
    res.status(500).json({ message: "Server error" });
  }
};
exports.createMessage = async (data) => {
  const msg = await Message.create({
    from: data.from,
    to: data.to,
    text: data.text,
    chatId: chatId(data.from, data.to),
  });

  return msg.toObject();
};

exports.updateMessageStatus = async ({ messageId, status }) => {
  return Message.findByIdAndUpdate(messageId, { status }, { new: true }).lean();
};

exports.markMessagesDelivered = async (userId) => {
  const messages = await Message.find({
    to: userId,
    status: "sent",
  });

  await Message.updateMany(
    { to: userId, status: "sent" },
    { status: "delivered" }
  );

  return messages;
};
