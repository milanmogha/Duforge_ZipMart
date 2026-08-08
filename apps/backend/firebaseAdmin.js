import admin from "firebase-admin";
import { readFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the service account JSON file
const serviceAccountPath = join(__dirname, "config", "serviceAccountKey.json");

// Initialize Firebase Admin
const initializeFirebaseAdmin = async () => {
  try {
    // Check if Firebase Admin is already initialized
    if (!admin.apps.length) {
      // Read and parse the service account JSON file dynamically
      const serviceAccountData = JSON.parse(await readFile(serviceAccountPath, "utf8"));

      // Initialize Firebase Admin SDK
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccountData),
      });

      console.log("Firebase Admin initialized successfully.");
    } else {
      console.log("Firebase Admin is already initialized. No action needed.");
    }
  } catch (error) {
    console.error("Failed to initialize Firebase Admin:", error);
    process.exit(1); // Exit the application if Firebase Admin initialization fails
  }
};

// Call initialization immediately
initializeFirebaseAdmin().catch(console.error);

// Export Firebase Admin
export default admin;

// Export additional utility functions (if needed)

// Check if Firebase Admin is initialized
export const isFirebaseAdminInitialized = () => admin.apps.length > 0;

/**
 * Verify Firebase ID Token (used for user authentication)
 * @param {string} token - The Firebase ID token to verify
 * @returns {Promise<object>} - Decoded token if valid
 */
export const verifyIdToken = async (token) => {
  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    return decodedToken;
  } catch (error) {
    console.error("Error verifying ID token:", error.message);
    throw new Error("Invalid or expired token.");
  }
};

/**
 * Generate Email Verification Link
 * @param {string} email - The email address to send the verification link to
 * @param {object} actionCodeSettings - Additional settings for the email link
 * @returns {Promise<string>} - Email verification link
 */
export const generateEmailVerificationLink = async (email, actionCodeSettings) => {
  try {
    const link = await admin.auth().generateEmailVerificationLink(email, actionCodeSettings);
    return link;
  } catch (error) {
    console.error("Error generating email verification link:", error.message);
    throw new Error("Failed to generate email verification link.");
  }
};

/**
 * Check if the email is verified
 * @param {string} email - The email address to check
 * @returns {Promise<boolean>} - Whether the email is verified
 */
export const isEmailVerified = async (email) => {
  try {
    const userRecord = await admin.auth().getUserByEmail(email);
    return userRecord.emailVerified;
  } catch (error) {
    console.error("Error checking email verification:", error.message);
    throw new Error("Failed to check email verification status.");
  }
};
