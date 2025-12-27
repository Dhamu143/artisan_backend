// // const {
// //   createMessage,
// //   updateMessageStatus,
// // } = require("../controllers/chatController");

// // const { setOnline, setOffline } = require("../controllers/chatuserController");

// // const onlineUsers = new Map();

// //   socket.on("disconnect", async () => {
// //     if (!socket.userId) return;

// //     onlineUsers.delete(socket.userId);
// //     await setOffline(socket.userId);

// //     io.emit("presence:update", {
// //       userId: socket.userId,
// //       status: "offline",
// //       lastSeen: Date.now(),
// //     });
// //   });
// // });
// // module.exports = (io) => {
// //   io.on("connection", (socket) => {
// //     console.log("🔌 Socket connected:", socket.id);

// //     // USER ONLINE
// //     socket.on("user:online", async (userId) => {
// //       onlineUsers.set(userId, socket.id);
// //       socket.userId = userId;

// //       console.log("🟢 USER ONLINE:", userId, "-> socket:", socket.id);
// //       console.log("Current online users:", Array.from(onlineUsers.keys()));

// //       await setOnline(userId);

// //       io.emit("presence:update", {
// //         userId,
// //         status: "online",
// //       });
// //     });
// //     io.emit("presence:update", {
// //       userId: socket.userId,
// //       status: "offline",
// //       lastSeen: Date.now(),
// //     });
// //     // TYPING START
// //     socket.on("typing:start", ({ from, to }) => {
// //       console.log("✍️ typing:start from", from, "to", to);

// //       const id = onlineUsers.get(to);
// //       if (id) io.to(id).emit("typing:start", { from });
// //     });

// //     // TYPING STOP
// //     socket.on("typing:stop", ({ from, to }) => {
// //       console.log("✍️ typing:stop from", from, "to", to);

// //       const id = onlineUsers.get(to);
// //       if (id) io.to(id).emit("typing:stop", { from });
// //     });

// //     // SEND MESSAGE
// //     socket.on("message:send", async (data, ack) => {
// //       console.log("📩 MESSAGE SEND:", data);

// //       const msg = await createMessage(data);

// //       console.log("✔️ STORED MESSAGE:", msg._id);

// //       // SENT (single tick)
// //       ack && ack(msg);

// //       const receiver = onlineUsers.get(data.to);

// //       if (receiver) {
// //         console.log("📨 RECEIVER ONLINE:", data.to);

// //         // DELIVERED (double tick)
// //         await updateMessageStatus({
// //           messageId: msg._id,
// //           status: "delivered",
// //         });

// //         console.log("✅ DELIVERED ->", msg._id);

// //         io.to(receiver).emit("message:receive", {
// //           ...msg,
// //           status: "delivered",
// //         });

// //         io.to(socket.id).emit("message:status", {
// //           id: msg._id,
// //           status: "delivered",
// //           to: data.to,
// //         });
// //       } else {
// //         console.log("⚠️ RECEIVER OFFLINE:", data.to);
// //       }
// //     });

// //     // SEEN (blue ticks)
// //     socket.on("message:seen", async ({ messageId, chatWith }) => {
// //       console.log("👁 MESSAGE SEEN:", messageId, "by", chatWith);

// //       await updateMessageStatus({
// //         messageId,
// //         status: "seen",
// //       });

// //       const sender = onlineUsers.get(chatWith);

// //       if (sender) {
// //         console.log("🔵 SEEN STATUS SENT TO:", chatWith);

// //         io.to(sender).emit("message:status", {
// //           id: messageId,
// //           status: "seen",
// //         });
// //       }
// //     });

// //     // DISCONNECT
// //     socket.on("disconnect", async () => {
// //       if (!socket.userId) {
// //         console.log("⚡ Socket disconnected (no user):", socket.id);
// //         return;
// //       }

// //       console.log("🔴 USER OFFLINE:", socket.userId);

// //       onlineUsers.delete(socket.userId);

// //       console.log("Remaining online users:", Array.from(onlineUsers.keys()));

// //       await setOffline(socket.userId);

// //       io.emit("presence:update", {
// //         userId: socket.userId,
// //         status: "offline",
// //       });
// //     });
// //   });
// // };
// const {
//   createMessage,
//   updateMessageStatus,
// } = require("../controllers/chatController");

// const { setOnline, setOffline } = require("../controllers/chatuserController");

// const onlineUsers = new Map();

// module.exports = (io) => {
//   io.on("connection", (socket) => {
//     console.log("🔌 Socket connected:", socket.id);

//     socket.on("user:online", async (userId) => {
//       if (!userId) return;

//       socket.userId = userId;
//       onlineUsers.set(userId, socket.id);

//       console.log("🟢 USER ONLINE:", userId);
//       console.log("Online users:", [...onlineUsers.keys()]);

//       await setOnline(userId);

//       io.emit("presence:update", {
//         userId,
//         status: "online",
//       });
//     });

//     socket.on("typing:start", ({ from, to }) => {
//       const receiverSocketId = onlineUsers.get(to);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("typing:start", { from });
//       }
//     });

//     socket.on("typing:stop", ({ from, to }) => {
//       const receiverSocketId = onlineUsers.get(to);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("typing:stop", { from });
//       }
//     });

//     socket.on("message:send", async (data, ack) => {
//       try {
//         const msg = await createMessage(data);

//         // SENT (single tick)
//         ack && ack(msg);

//         const receiverSocketId = onlineUsers.get(data.to);

//         if (receiverSocketId) {
//           // DELIVERED (double tick)
//           await updateMessageStatus({
//             messageId: msg._id,
//             status: "delivered",
//           });

//           io.to(receiverSocketId).emit("message:receive", {
//             ...msg,
//             status: "delivered",
//           });

//           io.to(socket.id).emit("message:status", {
//             id: msg._id,
//             status: "delivered",
//             to: data.to,
//           });
//         }
//       } catch (err) {
//         console.error("❌ MESSAGE SEND ERROR:", err);
//       }
//     });

//     socket.on("message:seen", async ({ messageId, chatWith }) => {
//       try {
//         await updateMessageStatus({
//           messageId,
//           status: "seen",
//         });

//         const senderSocketId = onlineUsers.get(chatWith);
//         if (senderSocketId) {
//           io.to(senderSocketId).emit("message:status", {
//             id: messageId,
//             status: "seen",
//           });
//         }
//       } catch (err) {
//         console.error("❌ MESSAGE SEEN ERROR:", err);
//       }
//     });

//     socket.on("disconnect", async () => {
//       if (!socket.userId) {
//         console.log("⚡ Socket disconnected (no user)");
//         return;
//       }

//       console.log("🔴 USER OFFLINE:", socket.userId);

//       onlineUsers.delete(socket.userId);
//       await setOffline(socket.userId);

//       io.emit("presence:update", {
//         userId: socket.userId,
//         status: "offline",
//         lastSeen: Date.now(),
//       });
//     });
//   });
// };
// const {
//   createMessage,
//   updateMessageStatus,
// } = require("../controllers/chatController");
// const { setOnline, setOffline } = require("../controllers/chatuserController");

// // 🆕 IMPORTS
// const User = require("../models/userModel");
// const { sendPushNotification } = require("../controllers/notificationController");

// const onlineUsers = new Map();

// module.exports = (io) => {
//   io.on("connection", (socket) => {
//     console.log("🔌 Socket connected:", socket.id);

//     // --- USER ONLINE ---
//     socket.on("user:online", async (userId) => {
//       if (!userId) return;

//       socket.userId = userId;
//       onlineUsers.set(userId, socket.id);

//       console.log("🟢 USER ONLINE:", userId);
//       // console.log("Online users:", [...onlineUsers.keys()]);

//       await setOnline(userId);

//       io.emit("presence:update", {
//         userId,
//         status: "online",
//       });
//     });

//     // --- TYPING START ---
//     socket.on("typing:start", ({ from, to }) => {
//       const receiverSocketId = onlineUsers.get(to);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("typing:start", { from });
//       }
//     });

//     // --- TYPING STOP ---
//     socket.on("typing:stop", ({ from, to }) => {
//       const receiverSocketId = onlineUsers.get(to);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("typing:stop", { from });
//       }
//     });

//     // --- MESSAGE SEND (Modified) ---
//     socket.on("message:send", async (data, ack) => {
//       try {
//         // 1. Save Message to DB
//         const msg = await createMessage(data);

//         // 2. Acknowledge Sender (Single Tick)
//         ack && ack(msg);

//         const receiverSocketId = onlineUsers.get(data.to);

//         // --- SCENARIO A: Receiver is ONLINE ---
//         if (receiverSocketId) {
//           // Update status to delivered
//           await updateMessageStatus({
//             messageId: msg._id,
//             status: "delivered",
//           });

//           // Send to Receiver
//           io.to(receiverSocketId).emit("message:receive", {
//             ...msg,
//             status: "delivered",
//           });

//           // Update Sender (Double Tick)
//           io.to(socket.id).emit("message:status", {
//             id: msg._id,
//             status: "delivered",
//             to: data.to,
//           });
//         }

//         // --- SCENARIO B: Receiver is OFFLINE ---
//         else {
//           console.log(`⚠️ User ${data.to} is OFFLINE. Sending Push Notification...`);

//           // Fetch Receiver (for Token) and Sender (for Name) in parallel
//           const [receiverData, senderData] = await Promise.all([
//             User.findById(data.to).select("pushNotificationToken"),
//             User.findById(data.from).select("name"),
//           ]);

//           if (receiverData && receiverData.pushNotificationToken) {
//             const senderName = senderData ? senderData.name : "New Message";
//             const title = `Message from ${senderName}`;
//             const body = data.text;

//             // Send Notification
//             await sendPushNotification(
//               receiverData.pushNotificationToken,
//               title,
//               body,
//               {
//                 type: "CHAT_MESSAGE",
//                 chatId: msg.chatId,
//                 senderId: data.from,
//                 messageId: msg._id.toString(),
//               }
//             );
//           } else {
//             console.log("❌ Cannot send notification: No Token found for user", data.to);
//           }
//         }
//       } catch (err) {
//         console.error("❌ MESSAGE SEND ERROR:", err);
//       }
//     });

//     // --- MESSAGE SEEN ---
//     socket.on("message:seen", async ({ messageId, chatWith }) => {
//       try {
//         await updateMessageStatus({
//           messageId,
//           status: "seen",
//         });

//         const senderSocketId = onlineUsers.get(chatWith);
//         if (senderSocketId) {
//           io.to(senderSocketId).emit("message:status", {
//             id: messageId,
//             status: "seen",
//           });
//         }
//       } catch (err) {
//         console.error("❌ MESSAGE SEEN ERROR:", err);
//       }
//     });

//     // --- DISCONNECT ---
//     socket.on("disconnect", async () => {
//       if (!socket.userId) {
//         console.log("⚡ Socket disconnected (no user)");
//         return;
//       }

//       console.log("🔴 USER OFFLINE:", socket.userId);

//       onlineUsers.delete(socket.userId);
//       await setOffline(socket.userId);

//       io.emit("presence:update", {
//         userId: socket.userId,
//         status: "offline",
//         lastSeen: Date.now(),
//       });
//     });
//   });
// };

const {
  createMessage,
  updateMessageStatus,
} = require("../controllers/chatController");
const { setOnline, setOffline } = require("../controllers/chatuserController");

// 🆕 IMPORTS
const User = require("../models/userModel");
const {
  sendPushNotification,
} = require("../controllers/notificationController");

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

    // --- TYPING START ---
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
        }

        else {
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
