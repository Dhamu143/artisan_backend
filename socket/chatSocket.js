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

// Helper for nice logs
const logEvent = (emoji, title, detail = "") => {
  console.log(`${emoji} [${title}]`.padEnd(25) + `| ${detail}`);
};

module.exports = (io) => {
  io.on("connection", (socket) => {
    // 1. Connection Event
    logEvent("🔌", "New Connection", `Socket ID: ${socket.id}`);

    // --- USER ONLINE ---
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

    // --- TYPING EVENTS ---
    socket.on("typing:start", ({ from, to }) => {
      const receiverSocketId = onlineUsers.get(to);
      if (receiverSocketId) {
        io.to(receiverSocketId).emit("typing:start", { from });
        // Optional: Uncomment if you want to see typing logs
        // logEvent("✍️ ", "Typing Start", `${from} -> ${to}`);
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
    socket.on("message:send", async (data, ack) => {
      console.log("\n--- 📨 NEW MESSAGE FLOW START ---");
      console.log("1️⃣ Input Data:", data);

      try {
        const msg = await createMessage(data);

        const senderData = await User.findById(data.from)
          .select("name profileImage subCategoryId")
          .lean();

        // This is the EXACT object the Frontend receives
        const fullMsg = {
          ...msg,
          senderName: senderData?.name || "Unknown",
          senderImage: senderData?.profileImage || "",
          senderSubCategory: senderData?.subCategoryId
            ? senderData.subCategoryId.toString()
            : "",
        };

        console.log(
          "2️⃣ Constructed Payload (fullMsg):",
          JSON.stringify(fullMsg, null, 2)
        );

        // Acknowledge Sender
        if (ack) {
          console.log("3️⃣ Sending ACK to Sender");
          ack(fullMsg);
        }

        const receiverSocketId = onlineUsers.get(data.to);

        if (receiverSocketId) {
          console.log(`4️⃣ Receiver is ONLINE (Socket ID: ${receiverSocketId})`);

          // --- SCENARIO 1: ONLINE (Socket Delivery) ---
          await updateMessageStatus({
            messageId: msg._id,
            status: "delivered",
          });

          const receivePayload = {
            ...fullMsg,
            status: "delivered",
          };

          console.log(
            "🚀 Emitting 'message:receive' to Receiver:",
            receivePayload
          );
          io.to(receiverSocketId).emit("message:receive", receivePayload);

          const statusPayload = {
            id: msg._id,
            status: "delivered",
            to: data.to,
          };

          console.log("🔄 Emitting 'message:status' to Sender:", statusPayload);
          io.to(socket.id).emit("message:status", statusPayload);
        } else {
          console.log("4️⃣ Receiver is OFFLINE. Checking for Push Token...");
          // --- SCENARIO 2: OFFLINE (Push Notification) ---
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
            };

            console.log("📲 Sending Push Notification:", {
              token: receiverData.pushNotificationToken,
              title,
              body,
              tag: msg.chatId,
            });

            await sendPushNotification(
              receiverData.pushNotificationToken,
              title,
              body,
              payloadData,
              msg.chatId
            );

            logEvent("✅", "Notification Sent", "Grouped by ChatID");
          } else {
            console.log("❌ No Push Token found for receiver.");
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
