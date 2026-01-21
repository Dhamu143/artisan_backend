const admin = require("firebase-admin");
require("dotenv").config();

console.log("\n🔥 [FIREBASE INIT] Starting Initialization...");

const cleanEnvVar = (value) => {
  if (!value) return undefined;
  return value.replace(/^['"]|['",]+$/g, '').trim();
};

const projectId = cleanEnvVar(process.env.GOOGLE_PROJECT_ID);
const clientEmail = cleanEnvVar(process.env.GOOGLE_CLIENT_EMAIL);
let privateKey = process.env.GOOGLE_PRIVATE_KEY;

if (!privateKey) {
  console.error("❌ [FIREBASE] GOOGLE_PRIVATE_KEY is missing!");
} else {
  privateKey = privateKey.replace(/^["']|["']$/g, ""); 
  privateKey = privateKey.replace(/\\n/g, "\n");  

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