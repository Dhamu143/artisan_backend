const User = require("../models/userModel");
const Message = require("../models/Message");

exports.setOnline = async (userId) => {
  // console.log("🟢 setOnline called for:", userId);

  const user = await User.findByIdAndUpdate(
    userId,
    {
      isOnline: true,
      lastSeen: null,
    },
    { new: true }
  );

  if (user) {
    // console.log("✅ USER ONLINE:", userId);
  } else {
    // console.log("⚠️ setOnline → user not found:", userId);
  }

  return user;
};

exports.setOffline = async (userId) => {
  // console.log("🔴 setOffline called for:", userId);

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

  // console.log("📡 getPresence request for:", id);

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

exports.markChatMessagesSeen = async ({ me, chatWith }) => {
  // console.log("📩 markChatMessagesSeen called");
  // console.log("👉 Me:", me);
  // console.log("👉 Chat With:", chatWith);

  const result = await Message.updateMany(
    {
      from: chatWith,
      to: me,
      status: { $ne: "seen" },
    },
    { status: "seen" }
  );

  // console.log("✔️ Messages updated:", result.modifiedCount);

  return result;
};

exports.getChatUsersList = async (req, res) => {
  try {
    const currentUserId = req.params.userId;

    // console.log(`\n--- 👥 FETCHING CHAT LIST START ---`);
    // console.log(`🆔 Current User ID: ${currentUserId}`);

    if (!currentUserId) {
      return res.status(400).json({ message: "User ID is required" });
    }

    const usersList = await Message.aggregate([
      {
        $match: {
          $or: [{ from: currentUserId }, { to: currentUserId }],
        },
      },

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

      { $sort: { createdAt: -1 } },

      {
        $group: {
          _id: "$otherUserId",

          lastMessage: { $first: "$text" },
          lastMessageTime: { $first: "$createdAt" },
          lastSenderId: { $first: "$from" },
          lastMessageStatus: { $first: "$status" },

          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$to", currentUserId] },
                    { $ne: ["$status", "seen"] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },

      {
        $addFields: {
          userObjectId: { $toObjectId: "$_id" },
        },
      },

      {
        $lookup: {
          from: "users",
          localField: "userObjectId",
          foreignField: "_id",
          as: "userDetails",
        },
      },

      { $unwind: "$userDetails" },
      {
        $project: {
          _id: "$userDetails._id",
          name: "$userDetails.name",
          profileImage: "$userDetails.profileImage",
          categoryId: "$userDetails.categoryId",
          subCategoryId: "$userDetails.subCategoryId",
          isOnline: "$userDetails.isOnline",

          lastMessage: 1,
          lastMessageTime: 1, 
          unreadCount: 1,
          lastSenderId: 1,
          lastMessageStatus: 1,
        },
      },

      { $sort: { lastMessageTime: -1 } },
    ]);

    // console.log(`✅ Found ${usersList.length} chats.`);
    // console.log("--- 👥 FETCHING CHAT LIST END ---\n");

    res.status(200).json(usersList);
  } catch (error) {
    console.error("❌ Error fetching chat users:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
};
