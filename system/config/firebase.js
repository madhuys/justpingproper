const admin = require("firebase-admin");

// Build service account object from environment variables
const serviceAccount = {
    type: process.env.GOOGLE_CLOUD_TYPE || "service_account",
    project_id: process.env.GOOGLE_CLOUD_PROJECT_ID,
    private_key_id: process.env.GOOGLE_CLOUD_PRIVATE_KEY_ID,
    private_key: process.env.GOOGLE_CLOUD_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    client_email: process.env.GOOGLE_CLOUD_CLIENT_EMAIL,
    client_id: process.env.GOOGLE_CLOUD_CLIENT_ID,
    auth_uri:
        process.env.GOOGLE_CLOUD_AUTH_URI ||
        "https://accounts.google.com/o/oauth2/auth",
    token_uri:
        process.env.GOOGLE_CLOUD_TOKEN_URI ||
        "https://oauth2.googleapis.com/token",
    auth_provider_x509_cert_url:
        process.env.GOOGLE_CLOUD_AUTH_PROVIDER_X509_CERT_URL ||
        "https://www.googleapis.com/oauth2/v1/certs",
    client_x509_cert_url: process.env.GOOGLE_CLOUD_CLIENT_X509_CERT_URL,
    universe_domain:
        process.env.GOOGLE_CLOUD_UNIVERSE_DOMAIN || "googleapis.com",
};

// Validate required fields
const requiredFields = [
    "project_id",
    "private_key_id",
    "private_key",
    "client_email",
    "client_id",
    "client_x509_cert_url",
];
const missingFields = requiredFields.filter((field) => !serviceAccount[field]);

if (missingFields.length > 0) {
    console.error(
        `Missing required Firebase service account fields: ${missingFields.join(
            ", ",
        )}`,
    );
    throw new Error("Firebase service account configuration is incomplete");
}

// Initialize Firebase Admin with the service account
let adminApp;
try {
    // Check if the app is already initialized to prevent duplicate initialization
    if (!admin.apps.length) {
        adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            // You can also specify the database URL if needed
            // databaseURL: `https://${serviceAccount.project_id}.firebaseio.com`
        });
        console.log("Firebase Admin SDK initialized successfully");
    } else {
        adminApp = admin.app();
    }
} catch (error) {
    console.error("Error initializing Firebase Admin SDK:", error);
    throw error;
}

// Export both the admin SDK and the API key
module.exports = {
    admin,
    apiKey: process.env.FIREBASE_API_KEY,
};
