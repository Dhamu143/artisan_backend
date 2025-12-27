const User = require("../models/userModel");
const Message = require("../models/Message");

exports.setOnline = async (userId) => {
  console.log("🟢 setOnline called for:", userId);

  const user = await User.findByIdAndUpdate(
    userId,
    {
      isOnline: true,
      lastSeen: null,
    },
    { new: true }
  );

  if (user) {
    console.log("✅ USER ONLINE:", userId);
  } else {
    console.log("⚠️ setOnline → user not found:", userId);
  }

  return user;
};

exports.setOffline = async (userId) => {
  console.log("🔴 setOffline called for:", userId);

  const user = await User.findByIdAndUpdate(
    userId,
    {
      isOnline: false,
      lastSeen: new Date(),
    },
    { new: true }
  );

  if (user) {
    console.log("🕘 USER OFFLINE:", userId, "| lastSeen:", user.lastSeen);
  } else {
    console.log("⚠️ setOffline → user not found:", userId);
  }

  return user;
};

exports.getPresence = async (req, res) => {
  const { id } = req.params;

  console.log("📡 getPresence request for:", id);

  const user = await User.findById(id)
    .select("isOnline lastSeen name profileImage")
    .lean();

  if (!user) {
    console.log("❌ Presence lookup failed → User not found:", id);
    return res.status(404).json({ message: "User not found" });
  }

  console.log("📍 Presence data:", user);

  res.json(user);
};
exports.getChatUsersList = async (req, res) => {
  try {
    const currentUserId = req.params.userId;

    console.log(`\n--- 👥 FETCHING CHAT LIST START ---`);
    console.log(`🆔 Current User ID: ${currentUserId}`);

    if (!currentUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const usersList = await Message.aggregate([
      // 1. Find all messages involving this user
      {
        $match: {
          $or: [{ from: currentUserId }, { to: currentUserId }],
        },
      },

      // 2. Identify the "Other Person" (Calculate this EARLY so we can group by it)
      {
        $addFields: {
          otherUserId: {
            $cond: {
              if: { $eq: ["$from", currentUserId] },
              then: "$to",
              else: "$from",
            },
          },
        },
      },

      // 3. SORT by Date DESCENDING (Crucial for getting the LAST message)
      { $sort: { createdAt: -1 } },

      // 4. GROUP by the Other User
      {
        $group: {
          _id: "$otherUserId",

          // Get details of the very first message in the sorted list (The Latest One)
          lastMessage: { $first: "$text" },
          lastMessageTime: { $first: "$createdAt" },
          lastSenderId: { $first: "$from" },
          lastMessageStatus: { $first: "$status" },

          // CALCULATE UNREAD COUNT
          // Logic: Sum 1 if (Receiver is ME) AND (Status is NOT 'seen')
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$to", currentUserId] }, // Sent TO me
                    { $ne: ["$status", "seen"] }, // Not Read yet
                  ],
                },
                1, // Add 1 to count
                0, // Add 0 to count
              ],
            },
          },
        },
      },

      // 5. Convert String ID to ObjectId for Lookup
      {
        $addFields: {
          userObjectId: { $toObjectId: "$_id" },
        },
      },

      // 6. Join with Users collection to get profile info
      {
        $lookup: {
          from: "users",
          localField: "userObjectId",
          foreignField: "_id",
          as: "userDetails",
        },
      },

      // 7. Unwind the array
      { $unwind: "$userDetails" },

      // 8. Select and Format Final Fields
      {
        $project: {
          _id: "$userDetails._id",
          name: "$userDetails.name",
          profileImage: "$userDetails.profileImage",
          categoryId: "$userDetails.categoryId",
          subCategoryId: "$userDetails.subCategoryId",
          isOnline: "$userDetails.isOnline",

          // Chat Specific Data
          lastMessage: 1,
          lastMessageTime: 1,
          unreadCount: 1,
          lastSenderId: 1,
          lastMessageStatus: 1,
        },
      },

      // 9. Final Sort: Show users with most recent messages at the top
      { $sort: { lastMessageTime: -1 } },
    ]);

    console.log(`✅ Found ${usersList.length} chats.`);
    // console.log("📦 Data:", JSON.stringify(usersList, null, 2));
    console.log("--- 👥 FETCHING CHAT LIST END ---\n");

    res.status(200).json(usersList);
  } catch (error) {
    console.error("❌ Error fetching chat users:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
