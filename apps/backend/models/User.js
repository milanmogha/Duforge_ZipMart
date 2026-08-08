import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // User's name
    email: { type: String, required: true, unique: true }, // User's email
    password: {
      type: String,
      required: function () {
        // Password required only if not using Firebase or email-OTP sign-in
        return !this.firebaseId && this.authProvider !== 'email-otp';
      },
    },
    firebaseId: { type: String, unique: true, sparse: true }, // Firebase identifier for Google-authenticated users
    authProvider: {
      type: String,
      enum: ['password', 'google', 'email-otp'], // How the account signs in
      default: 'password',
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'customer'], // Define user roles
      default: 'customer',
    },
    emailVerified: { type: Boolean, default: false }, // Email verification status
  },
  {
    timestamps: true, // Automatically add createdAt and updatedAt fields
  }
);

// Export the User model
const User = mongoose.model('User', userSchema);

export default User;
