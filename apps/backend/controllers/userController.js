import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { generateToken } from "../services/authService.js";
import admin from "../firebaseAdmin.js";
import OTPModel from "../models/OTPModel.js";
import transporter from "../config/mailer.js";


// ---------------------------------------------------------------------
// Register User
// ---------------------------------------------------------------------
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, and password are required." });
    }

    // Check if the email has a verified OTP
    const otpRecord = await OTPModel.findOne({ email, otpVerified: true });
    if (!otpRecord) {
      return res.status(400).json({ message: "Email not verified. Please verify your email first." });
    }

    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Save the new user
    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      emailVerified: true,
    });

    await newUser.save();

    // Delete OTP records after successful registration
    await OTPModel.deleteMany({ email });

    res.status(201).json({ message: "User registered successfully." });
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

// ---------------------------------------------------------------------
// Verify Email (called from the frontend)
// ---------------------------------------------------------------------
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.body;
    const decodedToken = await admin.auth().verifyIdToken(token);

    res.status(200).json({ message: "Token is valid.", userId: decodedToken.uid });
  } catch (error) {
    console.error("Error verifying Firebase email:", error.message);
    res.status(401).json({ message: "Invalid or expired token." });
  }
};

// ---------------------------------------------------------------------
// User Login
// ---------------------------------------------------------------------
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    if (!user.emailVerified) {
      return res.status(400).json({ message: "Please verify your email before logging in." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user,
    });
  } catch (error) {
    console.error("Error logging in user:", error.message);
    res.status(500).json({ message: "Error logging in user" });
  }
};

// ---------------------------------------------------------------------
// Admin Login
// ---------------------------------------------------------------------
export const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const adminUser = await User.findOne({ email, role: "admin" });
    if (!adminUser) {
      return res.status(404).json({ message: "Admin not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, adminUser.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateToken(adminUser);

    res.status(200).json({ message: "Admin login successful", token });
  } catch (error) {
    console.error("Error logging in admin:", error.message);
    res.status(500).json({ message: "Error logging in admin" });
  }
};

// ---------------------------------------------------------------------
// Create Admin
// ---------------------------------------------------------------------
export const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const adminCount = await User.countDocuments({ role: "admin" });
    if (adminCount >= 2) {
      return res.status(400).json({ message: "Cannot create more than two admins" });
    }

    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Admin with this email already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newAdmin = new User({
      name,
      email,
      password: hashedPassword,
      role: "admin",
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin created successfully", admin: newAdmin });
  } catch (error) {
    console.error("Error creating admin:", error.message);
    res.status(500).json({ message: "Error creating admin" });
  }
};

// ---------------------------------------------------------------------
// Google Login
// ---------------------------------------------------------------------
export const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ message: "Missing ID token" });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const uid = decodedToken.uid;

    let user = await User.findOne({ firebaseId: uid });
    if (!user) {
      user = new User({
        name: decodedToken.name || "Google User",
        email: decodedToken.email,
        firebaseId: uid,
        role: "customer",
        emailVerified: true,
      });
      await user.save();
    }

    const token = generateToken(user);
    res.status(200).json({ message: "Authenticated successfully", token, user });
  } catch (error) {
    console.error("Error during Firebase Authentication:", error);
    res.status(401).json({ message: "Authentication failed", error: error.message });
  }
};

// ---------------------------------------------------------------------
// Send OTP
// ---------------------------------------------------------------------
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Check if email is already registered
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP in the database
    await OTPModel.create({ email, otp });

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It is valid for 5 minutes.`,
    });

    res.status(200).json({ message: "OTP sent successfully to your email." });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP." });
  }
};

// ---------------------------------------------------------------------
// Verify OTP
// ---------------------------------------------------------------------
export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    // Find the OTP record
    const otpRecord = await OTPModel.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Update the `otpVerified` flag and save
    otpRecord.otpVerified = true;
    await otpRecord.save();

    // Optional: Clean up other OTPs for the email
    await OTPModel.deleteMany({ email, _id: { $ne: otpRecord._id } });

    res.status(200).json({ message: "OTP verified successfully." });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Error verifying OTP." });
  }
};

// How many wrong guesses a single login code tolerates before it is discarded
const MAX_LOGIN_OTP_ATTEMPTS = 5;

// ---------------------------------------------------------------------
// Passwordless Login - Send OTP
// ---------------------------------------------------------------------
// Unlike `sendOtp` (which is for registration and rejects known emails),
// this issues a code to any valid address so returning users can sign in.
export const sendLoginOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ message: "Please enter a valid email address." });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Drop any outstanding login code so only the newest one works
    await OTPModel.deleteMany({ email: normalizedEmail, purpose: "login" });
    await OTPModel.create({ email: normalizedEmail, otp, purpose: "login" });

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: normalizedEmail,
      subject: "Your ZipMart login code",
      html: `
        <p>Hi,</p>

        <p>Use the code below to sign in to ZipMart:</p>

        <p>
          <strong>Login Code: ${otp}</strong><br/>
          Valid for: 5 minutes
        </p>

        <p>If you did not request this, you can safely ignore this email.</p>

        <p>Best regards,<br/>
           ZipMart Team</p>
      `,
    });

    res.status(200).json({ message: "OTP sent successfully to your email." });
  } catch (error) {
    console.error("Error sending login OTP:", error);
    res.status(500).json({ message: "Error sending OTP." });
  }
};

// ---------------------------------------------------------------------
// Passwordless Login - Verify OTP
// ---------------------------------------------------------------------
export const verifyLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required." });
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Look the record up by address, not by code, so wrong guesses can be counted
    const otpRecord = await OTPModel.findOne({
      email: normalizedEmail,
      purpose: "login",
    });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    if (otpRecord.otp !== String(otp).trim()) {
      otpRecord.attempts += 1;

      // Burn the code once it has been guessed at too many times
      if (otpRecord.attempts >= MAX_LOGIN_OTP_ATTEMPTS) {
        await OTPModel.deleteMany({ email: normalizedEmail, purpose: "login" });
        return res.status(429).json({
          message: "Too many incorrect attempts. Please request a new code.",
        });
      }

      await otpRecord.save();
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Burn the code so it cannot be replayed
    await OTPModel.deleteMany({ email: normalizedEmail, purpose: "login" });

    // First-time sign-in registers the account, mirroring `googleLogin`
    let user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      user = new User({
        name: normalizedEmail.split("@")[0],
        email: normalizedEmail,
        role: "customer",
        authProvider: "email-otp",
        emailVerified: true,
      });
      await user.save();
    } else if (!user.emailVerified) {
      // Reaching a code at this address proves ownership
      user.emailVerified = true;
      await user.save();
    }

    const token = generateToken(user);

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error verifying login OTP:", error);
    res.status(500).json({ message: "Error verifying OTP." });
  }
};

// ---------------------------------------------------------------------
// Forgot Password - Send OTP
// ---------------------------------------------------------------------
export const sendForgotPasswordOtp = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }

    // Check if the user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User with this email does not exist." });
    }

    // Generate a 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Save OTP to the database
    await OTPModel.create({ email, otp });

    // Send OTP via email
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Welcome to Bellybasket – OTP Verification",
      html: `
        <p>Dear,</p>
        
        <p>Welcome to the Bellybasket team! To complete your verification, please use the OTP below:</p>
        
        <p>
          <strong>OTP Code: ${otp}</strong><br/>
          Valid for: 5 minutes
        </p>
        
        <p>If you did not request this, please ignore this email.</p>
        
        <p>Best regards,<br/>
           Bellybasket Team</p>
      `,
    });
    
    res.status(200).json({ message: "OTP sent successfully to your email." });
  } catch (error) {
    console.error("Error sending forgot password OTP:", error);
    res.status(500).json({ message: "Error sending forgot password OTP." });
  }
};

// ---------------------------------------------------------------------
// Reset Password
// ---------------------------------------------------------------------
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ message: "Email, OTP, and new password are required." });
    }

    // Check if the OTP is valid
    const otpRecord = await OTPModel.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the user's password
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    user.password = hashedPassword;
    await user.save();

    // Remove OTP record after successful password reset
    await OTPModel.deleteMany({ email });

    res.status(200).json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password." });
  }
};

// ---------------------------------------------------------------------
// Get User Details (Fetch user's name and other details)
// ---------------------------------------------------------------------
export const getUserDetails = async (req, res) => {
  try {
    // Assumes authMiddleware sets req.user with the authenticated user's id
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
