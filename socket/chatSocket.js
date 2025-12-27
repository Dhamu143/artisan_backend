const {
  createMessage,
  updateMessageStatus,
} = require("../controllers/chatController");
const { setOnline, setOffline } = require("../controllers/chatuserController");

const User = require("../models/userModel");
const Message = require("../models/Message");
const {
  sendPushNotification,
} = require("../controllers/notificationcontroller");

const onlineUsers = new Map();

const logEvent = (emoji, title, detail = "") => {
  console.log(`${emoji} [${title}]`.padEnd(25) + `| ${detail}`);
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    logEvent("🔌", "New Connection", `Socket ID: ${socket.id}`);

    socket.on("user:online", async (userId) => {
      if (!userId) return;

      socket.userId = userId;
      onlineUsers.set(userId, socket.id);

      await setOnline(userId);

      logEvent("🟢", "User Online", `User ID: ${userId}`);

      io.emit("presence:update", {
        userId,
        status: "online",
      });
    });

    socket.on("typing:start", ({ from, to }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:start", { from });
             }
    });

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
    // socket.on("message:send", async (data, ack) => {
    //   console.log(`\n--- 📨 NEW MESSAGE FLOW [${socket.userId}] ---`);

    //   try {
    //     const msg = await createMessage(data);

    //     const senderData = await User.findById(data.from)
    //       .select("name profileImage subCategoryId")
    //       .lean();

    //     const fullMsg = {
    //       ...msg,
    //       senderName: senderData?.name || "Unknown",
    //       senderImage: senderData?.profileImage || "",
    //       senderSubCategory: senderData?.subCategoryId
    //         ? senderData.subCategoryId.toString()
    //         : "",
    //     };

    //     // Acknowledge sender
    //     ack && ack(fullMsg);
    //     logEvent("✅", "Message Saved", `ID: ${msg._id}`);

    //     const receiverSocketId = onlineUsers.get(data.to);

    //     if (receiverSocketId) {
    //       // --- SCENARIO 1: RECEIVER IS ONLINE ---
    //       await updateMessageStatus({
    //         messageId: msg._id,
    //         status: "delivered",
    //       });

    //       io.to(receiverSocketId).emit("message:receive", {
    //         ...fullMsg,
    //         status: "delivered",
    //       });

    //       io.to(socket.id).emit("message:status", {
    //         id: msg._id,
    //         status: "delivered",
    //         to: data.to,
    //       });

    //       logEvent("🚀", "Socket Delivered", `To User: ${data.to}`);
    //     } else {
    //       // --- SCENARIO 2: RECEIVER IS OFFLINE ---
    //       logEvent("🌙", "User Offline", `Target: ${data.to}`);
    //       logEvent("🔔", "Push Notification", "Initiating...");

    //       const receiverData = await User.findById(data.to).select(
    //         "pushNotificationToken"
    //       );

    //       if (receiverData && receiverData.pushNotificationToken) {
    //         const title = fullMsg.senderName;
    //         const body = data.text;

    //         const payloadData = {
    //           type: "CHAT_MESSAGE",
    //           chatId: msg.chatId,
    //           senderId: data.from,
    //           messageId: msg._id.toString(),
    //           senderName: fullMsg.senderName,
    //           senderImage: fullMsg.senderImage,
    //           senderSubCategory: fullMsg.senderSubCategory,
    //         };

    //         await sendPushNotification(
    //           receiverData.pushNotificationToken,
    //           title,
    //           body,
    //           payloadData
    //         );
    //         logEvent("📲", "Notification Sent", "FCM Request Successful");
    //       } else {
    //         logEvent("❌", "Notification Failed", "No Token Found for User");
    //       }
    //     }
    //   } catch (err) {
    //     console.error("❌ [MESSAGE ERROR]:", err.message);
    //   }
    //   console.log("----------------------------------------\n");
    // });
    // ▼▼▼ MESSAGE SEND EVENT ▼▼▼
    socket.on("message:send", async (data, ack) => {
      console.log("\n--- 📨 NEW MESSAGE FLOW START ---");
      console.log("1️⃣ Input Data:", data);

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

        if (ack) ack(fullMsg);

        const receiverSocketId = onlineUsers.get(data.to);

        if (receiverSocketId) {
          // --- ONLINE ---
          console.log(`4️⃣ Receiver ONLINE (${receiverSocketId})`);
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
          // --- OFFLINE ---
          console.log("4️⃣ Receiver OFFLINE. Preparing Push...");
          const receiverData = await User.findById(data.to).select(
            "pushNotificationToken"
          );

          if (receiverData && receiverData.pushNotificationToken) {
            const unreadMessages = await Message.find({
              chatId: msg.chatId,
              to: data.to, // Messages sent TO the receiver
              status: { $ne: "seen" }, // That are NOT read
            })
              .sort({ createdAt: -1 })
              .limit(10)
              .select("text");

            // Create Array: ["Hello", "How are you?"]
            let historyArray = unreadMessages.map((m) => m.text).reverse();

            // Fallback: If DB is slow, manually add the new message
            if (historyArray.length === 0) historyArray = [data.text];
            else if (!historyArray.includes(data.text))
              historyArray.push(data.text);

            const unreadCount = historyArray.length;

            // ✅ LOG THE ARRAY TO SEE IT WORKING
            console.log(`📦 HISTORY ARRAY [${unreadCount}]:`, historyArray);

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
            logEvent("✅", "Notification Sent", `Count: ${unreadCount}`);
          } else {
            console.log("❌ No Push Token found");
          }
        }
      } catch (err) {
        console.error("❌ [MESSAGE ERROR]:", err.message);
      }
      console.log("--- 📨 MESSAGE FLOW END ---\n");
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
          logEvent(
            "👀",
            "Message Seen",
            `By: ${socket.userId} -> Sender: ${chatWith}`
          );
        }
      } catch (err) {
        console.error("❌ [SEEN ERROR]:", err);
      }
    });

    // --- DISCONNECT ---
    socket.on("disconnect", async () => {
      if (!socket.userId) {
        logEvent("⚡", "Disconnect", "Socket disconnected (No User ID)");
        return;
      }

      logEvent("🔴", "User Offline", `User ID: ${socket.userId}`);

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
