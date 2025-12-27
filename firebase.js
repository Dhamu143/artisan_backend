const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    project_id: process.env.GOOGLE_PROJECT_ID,
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  }),
});

module.exports = admin;
