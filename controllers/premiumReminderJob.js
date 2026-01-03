// const cron = require("node-cron");
// const User = require("../models/userModel");
// const {
//   sendPushNotification,
// } = require("../controllers/notificationcontroller");

// // Runs once every 24 hours at 10:00 AM IST
// cron.schedule("0 10 * * *", async () => {
//   console.log("⏰ Running Daily Premium Reminder Job...");

//   try {
//     const users = await User.find({
//       isPremium: false,
//       findArtisan: false,
//       pushNotificationToken: { $exists: true, $ne: "" },
//     }).select("_id name pushNotificationToken findArtisan isPremium");

//     if (!users.length) {
//       console.log("ℹ️ No eligible users found");
//       return;
//     }

//     console.log(`📌 Sending reminders to ${users.length} users`);

//     for (const user of users) {
//       await sendPushNotification(
//         user.pushNotificationToken,
//         "Unlock Premium Benefits",
//         "Upgrade your account to enjoy exclusive features and priority support.",
//         {
//           type: "PREMIUM_REMINDER",
//           userId: user._id.toString(),
//           segment: "non_artisan_user",
//         },
//         null,
//         [],
//         1,
//         false
//       );

//       console.log(`📨 Reminder sent to ${user.name} (${user._id})`);
//     }

//     console.log("✅ Daily Premium Reminder Job Finished");
//   } catch (err) {
//     console.error("❌ Premium Reminder Job Error:", err.message);
//   }
// });
