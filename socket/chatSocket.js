
const {
  createMessage,
  updateMessageStatus,
} = require("../controllers/chatController");
const {
  setOnline,
  setOffline,
  markChatMessagesSeen,
} = require("../controllers/chatuserController");

const User = require("../models/userModel");
const Message = require("../models/Message");
const {
  sendPushNotification,
} = require("../controllers/notificationcontroller");

const onlineUsers = new Map();
const activeChats = new Map();

const logEvent = (emoji, title, detail = "") => {
  console.log(`${emoji} [${title}]`.padEnd(25) + `| ${detail}`);
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    logEvent("🔌", "New Connection", `Socket ID: ${socket.id}`);

    socket.on("user:online", async (userId) => {
      if (!userId) return;

      socket.userId = userId.toString();
      onlineUsers.set(userId.toString(), socket.id);

      await setOnline(userId);

      logEvent("🟢", "User Online", `User ID: ${userId}`);

      io.emit("presence:update", { userId, status: "online" });
    });

    socket.on("typing:start", ({ from, to }) => {
      if (!to || !from) return;

      const receiverId = to.toString();
      const receiverSocket = onlineUsers.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("typing:start", { from });
      }
    });

    socket.on("typing:stop", ({ from, to }) => {
      if (!to || !from) return;

      const receiverId = to.toString();
      const receiverSocket = onlineUsers.get(receiverId);

      if (receiverSocket) {
        io.to(receiverSocket).emit("typing:stop", { from });
      }
    });

    socket.on("presence:check", async (userIdToCheck, cb) => {
      if (!userIdToCheck) return cb({ status: "offline" });

      const isOnline = onlineUsers.has(userIdToCheck.toString());
      cb({
        userId: userIdToCheck,
        status: isOnline ? "online" : "offline",
      });
    });

    socket.on("message:send", async (data, ack) => {
      console.log("\n--- 📨 MESSAGE FLOW START ---");
      console.log("Input:", data);

      try {
        const msg = await createMessage(data);

        const senderData = await User.findById(data.from)
          .select("name profileImage subCategoryId")
          .lean();

        const fullMsg = {
          ...msg,
          senderName: senderData?.name || "Unknown",
          senderImage: senderData?.profileImage || "",
          senderSubCategory: senderData?.subCategoryId?.toString() || "",
        };

        if (ack) ack(fullMsg);

        const receiverSocketId = onlineUsers.get(data.to.toString());

        const isChatOpen =
          activeChats.get(data.to.toString()) === data.from.toString();

        if (isChatOpen && receiverSocketId) {
          await updateMessageStatus({ messageId: msg._id, status: "seen" });

          io.to(receiverSocketId).emit("message:receive", {
            ...fullMsg,
            status: "seen",
          });

          io.to(socket.id).emit("message:status", {
            id: msg._id,
            status: "seen",
            to: data.to,
          });

          logEvent("👀", "Instant Seen", `Chat open with ${data.to}`);
          return;
        }

        if (receiverSocketId) {
          await updateMessageStatus({
            messageId: msg._id,
            status: "delivered",
          });

          io.to(receiverSocketId).emit("message:receive", {
            ...fullMsg,
            status: "delivered",
          });

          io.to(receiverSocketId).emit("message:new", {
            from: data.from,
            chatId: msg.chatId,
            lastMessage: fullMsg.text,
            lastMessageTime: fullMsg.createdAt,
            status: "delivered",
          });

          io.to(socket.id).emit("message:status", {
            id: msg._id,
            status: "delivered",
            to: data.to,
          });

          logEvent("📬", "Delivered", `To: ${data.to}`);
          return;
        }

        console.log("📴 Receiver Offline → Push Mode");

        const receiverData = await User.findById(data.to).select(
          "pushNotificationToken"
        );

        if (!receiverData?.pushNotificationToken) {
          console.log("❌ No push token");
          return;
        }

        const unreadMessages = await Message.find({
          chatId: msg.chatId,
          to: data.to,
          status: { $ne: "seen" },
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .select("text");

        let historyArray = unreadMessages.map((m) => m.text).reverse();

        if (!historyArray.length) historyArray = [data.text];
        else if (!historyArray.includes(data.text))
          historyArray.push(data.text);

        const unreadCount = historyArray.length;

        const payloadData = {
          type: "CHAT_MESSAGE",
          chatId: msg.chatId,
          senderId: data.from,
          messageId: msg._id.toString(),
          senderName: fullMsg.senderName,
          senderImage: fullMsg.senderImage,
        };

        await sendPushNotification(
          receiverData.pushNotificationToken,
          fullMsg.senderName,
          data.text,
          payloadData,
          msg.chatId,
          historyArray,
          unreadCount
        );

        logEvent("📨", "Push Sent", `Unread: ${unreadCount}`);
      } catch (err) {
        console.error("❌ MESSAGE ERROR:", err.message);
      }

      console.log("--- 📨 MESSAGE FLOW END ---\n");
    });

    socket.on("chat:open", async ({ me, chatWith }) => {
      if (!me || !chatWith) return;

      activeChats.set(me.toString(), chatWith.toString());

      await markChatMessagesSeen({ me, chatWith });

      const senderSocketId = onlineUsers.get(chatWith.toString());
      if (senderSocketId) {
        io.to(senderSocketId).emit("chat:read", { chatWith: me });
      }

      logEvent("📗", "Chat Open", `${me} reading ${chatWith}`);
    });

    socket.on("chat:close", ({ me }) => {
      if (!me) return;
      activeChats.delete(me.toString());
      logEvent("📕", "Chat Closed", me);
    });

    socket.on("message:seen", async ({ messageId, chatWith }) => {
      try {
        await updateMessageStatus({ messageId, status: "seen" });

        const sender = onlineUsers.get(chatWith.toString());
        if (sender) {
          io.to(sender).emit("message:status", {
            id: messageId,
            status: "seen",
          });
        }

        logEvent("✔✔", "Message Seen", `From ${chatWith}`);
      } catch (err) {
        console.error("❌ SEEN ERROR:", err);
      }
    });
    
    socket.on("user:offline", async (userId) => {
      if (!userId) return;
      onlineUsers.delete(userId.toString());
      await setOffline(userId);
      io.emit("presence:update", {
        userId,
        status: "offline",
        lastSeen: Date.now(),
      });
      console.log("🔴 User went offline manually:", userId);
    });
    socket.on("disconnect", async () => {
      if (!socket.userId) return;

      onlineUsers.delete(socket.userId);
      // activeChats.delete(socket.userId); // Cleanup active chats too

      await setOffline(socket.userId);

      io.emit("presence:update", {
        userId: socket.userId,
        status: "offline",
        lastSeen: Date.now(),
      });

      logEvent("🔴", "User Offline", socket.userId);
    });
  });
};
