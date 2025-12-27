const User = require("../models/userModel");

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
    console.log(
      "🕘 USER OFFLINE:",
      userId,
      "| lastSeen:",
      user.lastSeen
    );
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
