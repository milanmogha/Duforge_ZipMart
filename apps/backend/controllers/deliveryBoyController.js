import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import DeliveryBoy from '../models/DeliveryBoy.js';
import OTPModel from "../models/OTPModel.js";
import transporter from "../config/mailer.js";

// ======================================================================
// Admin creates a delivery boy (status = active)
// ======================================================================
export const createDeliveryBoy = async (req, res) => {
  try {
    const { name, email, phone, password, confirmPassword, address } = req.body;
    const files = req.files;

    if (password !== confirmPassword) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const deliveryBoyExist = await DeliveryBoy.findOne({ email });
    if (deliveryBoyExist) {
      return res.status(400).json({ message: 'Delivery boy with this email already exists' });
    }

    if (!files?.aadhar || !files?.drivingLicence) {
      return res.status(400).json({ message: 'Aadhar card and driving license are required' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newDeliveryBoy = new DeliveryBoy({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      plainPassword: password,
      idProof: {
        aadhar: {
          data: files.aadhar[0].buffer,
          contentType: files.aadhar[0].mimetype,
        },
        drivingLicence: {
          data: files.drivingLicence[0].buffer,
          contentType: files.drivingLicence[0].mimetype,
        },
      },
      status: 'active', // Admin-created delivery boys are active immediately
    });

    await newDeliveryBoy.save();
    res.status(201).json({ message: 'Delivery boy created successfully' });
  } catch (error) {
    console.error('Error creating delivery boy:', error);
    res.status(500).json({ message: 'Error creating delivery boy', error: error.message });
  }
};

// ======================================================================
// Delivery boy signup (status = pending) using OTP verification
// ======================================================================
export const signupDeliveryBoy = async (req, res) => {
  try {
    const { name, email, phone, password, address } = req.body;
    const files = req.files;

    // Check if OTP is verified for the provided email
    const otpRecord = await OTPModel.findOne({ email, otpVerified: true });
    if (!otpRecord) {
      return res.status(400).json({ message: "Email not verified. Please verify your email first." });
    }

    // Check if a delivery boy already exists with the email
    const deliveryBoyExist = await DeliveryBoy.findOne({ email });
    if (deliveryBoyExist) {
      return res.status(400).json({ message: 'Delivery boy with this email already exists' });
    }

    // Check for required files
    if (!files?.aadhar || !files?.drivingLicence) {
      return res.status(400).json({ message: 'Aadhar card and driving license are required' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new delivery boy with pending status and mark email as verified
    const newDeliveryBoy = new DeliveryBoy({
      name,
      email,
      phone,
      address,
      password: hashedPassword,
      plainPassword: password,
      idProof: {
        aadhar: {
          data: files.aadhar[0].buffer,
          contentType: files.aadhar[0].mimetype,
        },
        drivingLicence: {
          data: files.drivingLicence[0].buffer,
          contentType: files.drivingLicence[0].mimetype,
        },
      },
      status: 'pending', // Signup sets delivery boy status to pending
      emailVerified: true, // Email verified via OTP
    });

    await newDeliveryBoy.save();

    // Delete OTP records for this email as they're no longer needed
    await OTPModel.deleteMany({ email });

    res.status(201).json({ message: 'Signup request submitted for admin approval.' });
  } catch (error) {
    console.error('Error during signup:', error);
    res.status(500).json({ message: 'Error during signup', error: error.message });
  }
};

// ======================================================================
// Approve a delivery boy (admin action)
// ======================================================================
export const approveDeliveryBoy = async (req, res) => {
  try {
    const { id } = req.params;
    const deliveryBoy = await DeliveryBoy.findById(id);

    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }

    deliveryBoy.status = 'active';
    await deliveryBoy.save();

    res.status(200).json({ message: 'Delivery boy approved successfully' });
  } catch (error) {
    console.error('Error approving delivery boy:', error);
    res.status(500).json({ message: 'Error approving delivery boy', error: error.message });
  }
};

// ======================================================================
// Fetch all delivery boys (with image conversion)
// ======================================================================
export const getAllDeliveryBoys = async (req, res) => {
  try {
    const deliveryBoys = await DeliveryBoy.find();
    const deliveryBoysBase64 = deliveryBoys.map(boy => {
      const boyObj = boy.toObject();
      if (boyObj.idProof?.aadhar?.data) {
        boyObj.idProof.aadhar.data = boyObj.idProof.aadhar.data.toString('base64');
      }
      if (boyObj.idProof?.drivingLicence?.data) {
        boyObj.idProof.drivingLicence.data = boyObj.idProof.drivingLicence.data.toString('base64');
      }
      return boyObj;
    });
    res.status(200).json(deliveryBoysBase64);
  } catch (error) {
    console.error('Error fetching delivery boys:', error);
    res.status(500).json({ message: 'Error fetching delivery boys', error: error.message });
  }
};

// ======================================================================
// Fetch delivery boy by ID (with image conversion)
// ======================================================================
export const getDeliveryBoyById = async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findById(req.params.id);
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }
    const boyObj = deliveryBoy.toObject();
    if (boyObj.idProof?.aadhar?.data) {
      boyObj.idProof.aadhar.data = boyObj.idProof.aadhar.data.toString('base64');
    }
    if (boyObj.idProof?.drivingLicence?.data) {
      boyObj.idProof.drivingLicence.data = boyObj.idProof.drivingLicence.data.toString('base64');
    }
    res.status(200).json(boyObj);
  } catch (error) {
    console.error('Error fetching delivery boy:', error);
    res.status(500).json({ message: 'Error fetching delivery boy', error: error.message });
  }
};

// ======================================================================
// Delete a delivery boy
// ======================================================================
export const deleteDeliveryBoy = async (req, res) => {
  try {
    const deliveryBoy = await DeliveryBoy.findByIdAndDelete(req.params.id);
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'Delivery boy not found' });
    }
    res.status(200).json({ message: 'Delivery boy deleted successfully' });
  } catch (error) {
    console.error('Error deleting delivery boy:', error);
    res.status(500).json({ message: 'Error deleting delivery boy', error: error.message });
  }
};

// ======================================================================
// Login Delivery Boy
// ======================================================================
export const loginDeliveryBoy = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if the delivery boy exists
    const deliveryBoy = await DeliveryBoy.findOne({ email });
    if (!deliveryBoy) {
      return res.status(404).json({ message: 'No account found with this email.' });
    }

    // Check if the account is active
    if (deliveryBoy.status !== 'active') {
      return res.status(403).json({ message: 'Your account is not active. Please contact the admin.' });
    }

    // Compare the entered password with the hashed password
    const isPasswordMatch = await bcrypt.compare(password, deliveryBoy.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }

    // Generate a JWT token for authentication
    const token = jwt.sign(
      { id: deliveryBoy._id, email: deliveryBoy.email, role: 'deliveryBoy' },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'Login successful!',
      token,
      deliveryBoy: {
        id: deliveryBoy._id,
        name: deliveryBoy.name,
        email: deliveryBoy.email,
        phone: deliveryBoy.phone,
      },
    });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ message: 'An error occurred during login.', error: error.message });
  }
};

// ======================================================================
// Register device token (for push notifications, etc.)
// ======================================================================
export const registerDeviceToken = async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: "Token is required." });

    const deliveryBoy = req.deliveryBoy;
    if (!deliveryBoy.deviceTokens) {
      deliveryBoy.deviceTokens = [];
    }
    if (!deliveryBoy.deviceTokens.includes(token)) {
      deliveryBoy.deviceTokens.push(token);
      await deliveryBoy.save();
    }

    return res.status(200).json({ message: "Device token registered successfully." });
  } catch (error) {
    console.error("Error registering device token:", error);
    return res.status(500).json({ message: "Failed to register device token." });
  }
};

// ======================================================================
// OTP routes for Delivery Boy Signup
// ======================================================================
export const sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    // Save OTP in the database
    await OTPModel.create({ email, otp });
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
    
    res.status(200).json({ message: "OTP sent successfully!" });
  } catch (error) {
    console.error("Error sending OTP:", error);
    res.status(500).json({ message: "Error sending OTP" });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }
    // Find the OTP record for the given email and OTP
    const otpRecord = await OTPModel.findOne({ email, otp });
    if (!otpRecord) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    // Mark the OTP as verified
    otpRecord.otpVerified = true;
    await otpRecord.save();
    res.status(200).json({ verified: true, message: "OTP verified successfully!" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

// ======================================================================
// Forgot Password: Send OTP for delivery boy
// ======================================================================
export const sendForgotPasswordOtpDeliveryBoy = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required." });
    }
    // Check if the delivery boy exists
    const deliveryBoy = await DeliveryBoy.findOne({ email });
    if (!deliveryBoy) {
      return res.status(404).json({ message: "Delivery boy with this email does not exist." });
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
      text: `Dear,
     
      Welcome to the Bellybasket team! To complete your verification, please use the OTP below:
     
      OTP Code: ${otp}
      Valid for: 5 minutes
     
      If you did not request this, please ignore this email.
     
     
      Best regards,
      Bellybasket Team`,
    });
    res.status(200).json({ message: "OTP sent successfully to your email." });
  } catch (error) {
    console.error("Error sending forgot password OTP:", error);
    res.status(500).json({ message: "Error sending forgot password OTP." });
  }
};

// ======================================================================
// Forgot Password: Reset Password for delivery boy
// ======================================================================
export const resetPasswordDeliveryBoy = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;
    if (!email || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Email, new password, and confirm password are required" });
    }
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    // Check if the email has a verified OTP
    const otpRecord = await OTPModel.findOne({ email, otpVerified: true });
    if (!otpRecord) {
      return res.status(400).json({ message: "OTP not verified. Please verify your OTP first." });
    }
    // Find the delivery boy by email
    const deliveryBoy = await DeliveryBoy.findOne({ email });
    if (!deliveryBoy) {
      return res.status(404).json({ message: "Delivery boy account not found" });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    deliveryBoy.password = hashedPassword;
    await deliveryBoy.save();
    // Delete the OTP record after successful password reset
    await OTPModel.deleteMany({ email });
    res.status(200).json({ message: "Password reset successfully. You can now log in with your new password." });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};
