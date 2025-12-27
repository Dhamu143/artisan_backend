const Message = require("../models/Message");

const chatId = (u1, u2) => [u1, u2].sort().join("_");

exports.getChatHistory = async (req, res) => {
  const { me, user } = req.query;

  if (!me || !user)
    return res.status(400).json({ message: "me and user are required" });

  const cid = chatId(me, user);

  const history = await Message.find({ chatId: cid }).sort({ createdAt: 1 });

  res.json(history);
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
