const {
  createMessage,
  updateMessageStatus,
} = require("../controllers/chatController");
const { setOnline, setOffline } = require("../controllers/chatuserController");

const User = require("../models/userModel");
const {
  sendPushNotification,
} = require("../controllers/notificationcontroller");

const onlineUsers = new Map();

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("🔌 Socket connected:", socket.id);

    // --- USER ONLINE ---
    socket.on("user:online", async (userId) => {
      if (!userId) return;

      socket.userId = userId;
      onlineUsers.set(userId, socket.id);

      console.log("🟢 USER ONLINE:", userId);
      await setOnline(userId);

      io.emit("presence:update", {
        userId,
        status: "online",
      });
    });

    socket.on("typing:start", ({ from, to }) => {
      //   console.log(`✍️ TYPING START: ${from} -> ${to}`);
      const receiverSocketId = onlineUsers.get(to);
      //   if (receiverSocketId) {
      //     io.to(receiverSocketId).emit("typing:start", { from });
      //   }
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:start", { from });
        // console.log(`   --> Sent to socket: ${receiverSocketId}`);
      } else {
        // console.log(`   ⚠️ FAILED: Receiver ${to} is NOT in onlineUsers map.`);
        // console.log("   Current Online Users:", [...onlineUsers.keys()]);
      }
    });

    // --- TYPING STOP ---
    socket.on("typing:stop", ({ from, to }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:stop", { from });
      }
    });
    socket.on("presence:check", async (userIdToCheck, cb) => {
      const isOnline = onlineUsers.has(userIdToCheck);

      cb({
        userId: userIdToCheck,
        status: isOnline ? "online" : "offline",
      });
    });
    // ▼▼▼ UPDATED MESSAGE:SEND EVENT ▼▼▼
    socket.on("message:send", async (data, ack) => {
      try {
        const msg = await createMessage(data);

        const senderData = await User.findById(data.from)
          .select("name profileImage subCategoryId")
          .lean();

        const fullMsg = {
          ...msg,
          senderName: senderData?.name || "Unknown",
          senderImage: senderData?.profileImage || "",
          senderSubCategory: senderData?.subCategoryId
            ? senderData.subCategoryId.toString()
            : "",
        };

        ack && ack(fullMsg);

        const receiverSocketId = onlineUsers.get(data.to);

        if (receiverSocketId) {
          await updateMessageStatus({
            messageId: msg._id,
            status: "delivered",
          });

          io.to(receiverSocketId).emit("message:receive", {
            ...fullMsg,
            status: "delivered",
          });

          io.to(socket.id).emit("message:status", {
            id: msg._id,
            status: "delivered",
            to: data.to,
          });
        } else {
          console.log(
            `⚠️ User ${data.to} is OFFLINE. Sending Push Notification...`
          );

          const receiverData = await User.findById(data.to).select(
            "pushNotificationToken"
          );

          if (receiverData && receiverData.pushNotificationToken) {
            const title = fullMsg.senderName;
            const body = data.text;

            const payloadData = {
              type: "CHAT_MESSAGE",
              chatId: msg.chatId,
              senderId: data.from,
              messageId: msg._id.toString(),

              senderName: fullMsg.senderName,
              senderImage: fullMsg.senderImage,
              senderSubCategory: fullMsg.senderSubCategory,
            };

            await sendPushNotification(
              receiverData.pushNotificationToken,
              title,
              body,
              payloadData
            );
          } else {
            console.log(
              "❌ Notification failed: No Token found for user",
              data.to
            );
          }
        }
      } catch (err) {
        console.error("❌ MESSAGE SEND ERROR:", err);
      }
    });
    // ▲▲▲ END UPDATED SECTION ▲▲▲

    // --- MESSAGE SEEN ---
    socket.on("message:seen", async ({ messageId, chatWith }) => {
      try {
        await updateMessageStatus({
          messageId,
          status: "seen",
        });

        const senderSocketId = onlineUsers.get(chatWith);
        if (senderSocketId) {
          io.to(senderSocketId).emit("message:status", {
            id: messageId,
            status: "seen",
          });
        }
      } catch (err) {
        console.error("❌ MESSAGE SEEN ERROR:", err);
      }
    });

    // --- DISCONNECT ---
    socket.on("disconnect", async () => {
      if (!socket.userId) {
        console.log("⚡ Socket disconnected (no user)");
        return;
      }

      console.log("🔴 USER OFFLINE:", socket.userId);

      onlineUsers.delete(socket.userId);
      await setOffline(socket.userId);

      io.emit("presence:update", {
        userId: socket.userId,
        status: "offline",
        lastSeen: Date.now(),
      });
    });
  });
};
