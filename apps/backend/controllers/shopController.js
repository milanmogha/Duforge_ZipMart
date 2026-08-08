import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import Shop from "../models/Shop.js";
import Product from "../models/Product.js";
import OTPModel from "../models/OTPModel.js";
import transporter from "../config/mailer.js";

/**
 * Admin creates a shop (status = active).
 */
export const createShop = async (req, res) => {
  try {
    const {
      ownerName,
      shopName,
      email,
      phone,
      location,
      latitude,
      longitude,
      password,
      aadharNumber,
      gstNumber,
      serviceRadius,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      ownerName,
      shopName,
      email,
      phone,
      location,
      latitude,
      longitude,
      password,
      aadharNumber,
      gstNumber,
    };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === "") {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Check for duplicate entries
    const existingShop = await Shop.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone },
        { aadharNumber },
        { gstNumber: gstNumber.toUpperCase() },
      ],
    });

    if (existingShop) {
      let duplicateField = "";
      if (existingShop.email === email.toLowerCase()) duplicateField = "Email";
      else if (existingShop.phone === phone) duplicateField = "Phone number";
      else if (existingShop.aadharNumber === aadharNumber)
        duplicateField = "Aadhar number";
      else if (existingShop.gstNumber === gstNumber.toUpperCase())
        duplicateField = "GST number";

      return res
        .status(400)
        .json({ message: `This ${duplicateField} is already registered` });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new shop with location and proof data
    const newShop = new Shop({
      ownerName,
      shopName,
      email: email.toLowerCase(),
      phone,
      location,
      locationCoordinates: { latitude, longitude },
      serviceRadius: serviceRadius || 5,
      password: hashedPassword,
      aadharNumber,
      gstNumber: gstNumber.toUpperCase(),
      idProof: {
        aadharCard: {
          data: req.files.aadharCard[0].buffer,
          contentType: req.files.aadharCard[0].mimetype,
        },
        gstProof: {
          data: req.files.gstProof[0].buffer,
          contentType: req.files.gstProof[0].mimetype,
        },
      },
      status: "active",
    });

    await newShop.save();

    res
      .status(201)
      .json({ message: "Shop created successfully", shopId: newShop._id });
  } catch (error) {
    console.error("Error creating shop:", error);
    res
      .status(500)
      .json({
        message: error.message || "An error occurred while creating the shop",
      });
  }
};

// Shopkeeper Signup
export const signup = async (req, res) => {
  try {
    const {
      ownerName,
      shopName,
      email,
      phone,
      location,
      latitude,
      longitude,
      password,
      aadharNumber,
      gstNumber,
      serviceRadius,
    } = req.body;

    // Validate required fields
    const requiredFields = {
      ownerName,
      shopName,
      email,
      phone,
      location,
      latitude,
      longitude,
      password,
      aadharNumber,
      gstNumber,
    };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || value.trim() === "") {
        return res.status(400).json({ message: `${field} is required` });
      }
    }

    // Check for duplicate entries
    const existingShop = await Shop.findOne({
      $or: [
        { email: email.toLowerCase() },
        { phone },
        { aadharNumber },
        { gstNumber: gstNumber.toUpperCase() },
      ],
    });

    if (existingShop) {
      let duplicateField = "";
      if (existingShop.email === email.toLowerCase()) duplicateField = "Email";
      else if (existingShop.phone === phone) duplicateField = "Phone number";
      else if (existingShop.aadharNumber === aadharNumber)
        duplicateField = "Aadhar number";
      else if (existingShop.gstNumber === gstNumber.toUpperCase())
        duplicateField = "GST number";

      return res
        .status(400)
        .json({ message: `This ${duplicateField} is already registered` });
    }

    // Check if the OTP is verified
    const otpRecord = await OTPModel.findOne({ email, otpVerified: true });
    if (!otpRecord) {
      return res
        .status(400)
        .json({ message: "Email not verified. Please verify your email first." });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new shop with pending status
    const newShop = new Shop({
      ownerName,
      shopName,
      email: email.toLowerCase(),
      phone,
      location,
      locationCoordinates: { latitude, longitude },
      serviceRadius: serviceRadius || 5,
      password: hashedPassword,
      aadharNumber,
      gstNumber: gstNumber.toUpperCase(),
      idProof: {
        aadharCard: {
          data: req.files.aadharCard[0].buffer,
          contentType: req.files.aadharCard[0].mimetype,
        },
        gstProof: {
          data: req.files.gstProof[0].buffer,
          contentType: req.files.gstProof[0].mimetype,
        },
      },
      status: "pending",
      emailVerified: true, // Email is verified through OTP
    });

    await newShop.save();

    // Remove the OTP record as it is no longer needed
    await OTPModel.deleteMany({ email });

    res.status(201).json({
      message: "Your account request has been submitted for admin approval.",
    });
  } catch (error) {
    console.error("Error during signup:", error);
    res
      .status(500)
      .json({
        message: error.message || "An error occurred while signing up",
      });
  }
};

/**
 * Shopkeeper login.
 */
export const loginShopkeeper = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and password are required" });
    }

    const shop = await Shop.findOne({ email: email.toLowerCase() });

    if (!shop) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    // Check shop status
    if (shop.status !== "active") {
      return res
        .status(403)
        .json({
          message: "Your account is not active. Please contact admin for approval.",
        });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, shop.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: "Invalid password" });
    }

    // Generate JWT
    const token = jwt.sign(
      { shopId: shop._id, role: "shopkeeper" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token,
      shop: {
        id: shop._id,
        ownerName: shop.ownerName,
        shopName: shop.shopName,
        email: shop.email,
      },
    });
  } catch (error) {
    console.error("Error during shopkeeper login:", error);
    res.status(500).json({ message: "Error during login" });
  }
};

/**
 * Get all shops (admin view).
 */
export const getAllShops = async (req, res) => {
  try {
    const shops = await Shop.find({}, { idProof: 0, password: 0 });
    res.status(200).json(shops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    res.status(500).json({ message: "Error fetching shops" });
  }
};

/**
 * Get shop details by ID.
 */
export const getShopById = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    const shopData = shop.toObject();

    // Convert Buffer to Base64 for images
    if (shopData.idProof?.aadharCard?.data) {
      shopData.idProof.aadharCard.data = shopData.idProof.aadharCard.data.toString(
        "base64"
      );
    }
    if (shopData.idProof?.gstProof?.data) {
      shopData.idProof.gstProof.data = shopData.idProof.gstProof.data.toString(
        "base64"
      );
    }

    delete shopData.password;

    res.status(200).json(shopData);
  } catch (error) {
    console.error("Error fetching shop:", error);
    res.status(500).json({ message: "Error fetching shop details" });
  }
};

/**
 * Approve shop (admin action).
 */
export const approveShop = async (req, res) => {
  try {
    const { id } = req.params;
    const shop = await Shop.findById(id);

    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    shop.status = "active";
    await shop.save();

    res.status(200).json({ message: "Shop approved successfully" });
  } catch (error) {
    console.error("Error approving shop:", error);
    res.status(500).json({ message: "Error approving shop" });
  }
};

/**
 * Delete shop (admin or shop action).
 * Now also deletes all products belonging to this shop.
 */
export const deleteShop = async (req, res) => {
  try {
    const shop = await Shop.findById(req.params.id);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    // Delete all products for this shop
    await Product.deleteMany({ shopkeeperId: shop._id });

    // Now delete the shop itself using doc.deleteOne()
    await shop.deleteOne();

    res
      .status(200)
      .json({ message: "Shop and its products deleted successfully" });
  } catch (error) {
    console.error("Error deleting shop:", error);
    res.status(500).json({ message: "Error deleting shop" });
  }
};


/**
 * Update shop location and service radius.
 */
export const updateShopLocation = async (req, res) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, serviceRadius } = req.body;

    const shop = await Shop.findById(id);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found" });
    }

    shop.locationCoordinates = { latitude, longitude };
    shop.serviceRadius = serviceRadius || 5;
    await shop.save();

    res.status(200).json({ message: "Location updated successfully" });
  } catch (error) {
    console.error("Error updating shop location:", error);
    res.status(500).json({ message: "Error updating location" });
  }
};

/**
 * Fetch shops within a given radius.
 */
export const getShopsWithinRadius = async (req, res) => {
  try {
    const { latitude, longitude, radius } = req.query;

    if (!latitude || !longitude || !radius) {
      return res
        .status(400)
        .json({ message: "Latitude, longitude, and radius are required" });
    }

    const shops = await Shop.find({
      locationCoordinates: {
        $geoWithin: {
          $centerSphere: [[longitude, latitude], radius / 6378.1],
        },
      },
    });

    res.status(200).json(shops);
  } catch (error) {
    console.error("Error fetching shops:", error);
    res.status(500).json({ message: "Error fetching shops" });
  }
};

/**
 * Fetch shop location by ID.
 */
export const getShopLocation = async (req, res) => {
  try {
    const { id } = req.params;

    // Find shop by ID
    const shop = await Shop.findById(id, "locationCoordinates");
    if (!shop) {
      return res.status(404).json({ message: "Shop not found." });
    }

    // Return location coordinates
    res.status(200).json({
      latitude: shop.locationCoordinates?.latitude || null,
      longitude: shop.locationCoordinates?.longitude || null,
    });
  } catch (error) {
    console.error("Error fetching shop location:", error);
    res.status(500).json({ message: "Error fetching shop location." });
  }
};

// Send OTP
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

// Verify OTP
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

    res
      .status(200)
      .json({ verified: true, message: "OTP verified successfully!" });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    res.status(500).json({ message: "Error verifying OTP" });
  }
};

/**
 * Reset password for a shopkeeper after OTP verification
 */
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword, confirmPassword } = req.body;

    // Validate input
    if (!email || !newPassword || !confirmPassword) {
      return res
        .status(400)
        .json({
          message: "Email, new password, and confirm password are required",
        });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    // Check if the email has a verified OTP
    const otpRecord = await OTPModel.findOne({ email, otpVerified: true });
    if (!otpRecord) {
      return res
        .status(400)
        .json({ message: "OTP not verified. Please verify your OTP first." });
    }

    // Find the shopkeeper by email
    const shop = await Shop.findOne({ email: email.toLowerCase() });
    if (!shop) {
      return res.status(404).json({ message: "Shopkeeper account not found" });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the password in the database
    shop.password = hashedPassword;
    await shop.save();

    // Delete the OTP record after successful password reset
    await OTPModel.deleteMany({ email });

    res.status(200).json({
      message: "Password reset successfully. You can now log in with your new password.",
    });
  } catch (error) {
    console.error("Error resetting password:", error);
    res.status(500).json({ message: "Error resetting password" });
  }
};
