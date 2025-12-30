const admin = require("firebase-admin");
require("dotenv").config();

console.log("\n🔥 [FIREBASE INIT] Starting Initialization...");

// Helper function to clean env variables (removes quotes and trailing commas)
const cleanEnvVar = (value) => {
  if (!value) return undefined;
  // Removes " ' and , from the start or end of the string
  return value.replace(/^['"]|['",]+$/g, '').trim();
};

const projectId = cleanEnvVar(process.env.GOOGLE_PROJECT_ID);
const clientEmail = cleanEnvVar(process.env.GOOGLE_CLIENT_EMAIL);
let privateKey = process.env.GOOGLE_PRIVATE_KEY;

// console.log(`👤 [FIREBASE] Client Email: '${clientEmail}'`);
// console.log(`🆔 [FIREBASE] Project ID:   '${projectId}'`);

if (!privateKey) {
  console.error("❌ [FIREBASE] GOOGLE_PRIVATE_KEY is missing!");
} else {
  // Clean the private key
  privateKey = privateKey.replace(/^["']|["']$/g, ""); // Remove outer quotes
  privateKey = privateKey.replace(/\\n/g, "\n");       // Fix newlines

  console.log(`🔑 [FIREBASE] Key Processed (Length: ${privateKey.length})`);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert({
      project_id: projectId,
      client_email: clientEmail,
      private_key: privateKey,
    }),
  });
  console.log("✅ [FIREBASE] App Initialized Successfully\n");
} catch (error) {
  console.error("❌ [FIREBASE] Init Failed:", error.message);
}

module.exports = admin;