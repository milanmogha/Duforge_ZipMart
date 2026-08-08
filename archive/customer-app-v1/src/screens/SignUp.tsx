import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { sendOtp, verifyOtp, registerUser } from "../services/api";

// Assets
const bagvector = require("../assets/bagvector.png");
const eyeOpen = require("../assets/eyeopen.png");
const eyeClosed = require("../assets/eyeclosed.png");

const SignUp: React.FC = () => {
  const navigation = useNavigation();

  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [otp, setOtp] = useState<string>("");

  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);

  const [otpSent, setOtpSent] = useState<boolean>(false);
  const [emailVerified, setEmailVerified] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleSendOtp = async () => {
    if (!email.includes("@")) {
      Alert.alert("Invalid Email", "Please enter a valid email address.");
      return;
    }
    setLoading(true);
    try {
      await sendOtp(email);
      setOtpSent(true);
      Alert.alert("OTP Sent", "Check your email for the OTP.");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert("Enter OTP", "Please enter the OTP sent to your email.");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      setEmailVerified(true);
      Alert.alert("Success", "Email verified successfully!");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert("Missing Fields", "Please fill in all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert("Password Mismatch", "Passwords do not match.");
      return;
    }
    if (!emailVerified) {
      Alert.alert("Email Verification", "Please verify your email first.");
      return;
    }

    setLoading(true);
    try {
      await registerUser({ name, email, password });
      Alert.alert("Success", "Registration completed. Redirecting to login...");
      navigation.navigate("SignIn");
    } catch (error: any) {
      Alert.alert("Error", error.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Image source={bagvector} style={styles.logo} />
        <Text style={styles.title}>Create an Account</Text>
        <Text style={styles.subtitle}>Sign up to start shopping</Text>

        <View style={styles.form}>
          {/* Name Input */}
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            placeholder="Your Name"
            value={name}
            onChangeText={setName}
            style={styles.input}
            editable={!loading}
          />

          {/* Email Input */}
          <Text style={styles.label}>Email</Text>
          <TextInput
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
            keyboardType="email-address"
            editable={!otpSent && !loading}
          />

          {/* Send OTP Button */}
          {!otpSent && (
            <TouchableOpacity style={styles.button} onPress={handleSendOtp} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Sending OTP..." : "Send OTP"}</Text>
            </TouchableOpacity>
          )}

          {/* OTP Verification */}
          {otpSent && !emailVerified && (
            <>
              <Text style={styles.label}>Enter OTP</Text>
              <TextInput
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                style={styles.input}
                keyboardType="numeric"
              />
              <TouchableOpacity style={[styles.button, styles.verifyButton]} onPress={handleVerifyOtp}>
                <Text style={styles.buttonText}>{loading ? "Verifying..." : "Verify OTP"}</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Password Fields */}
          {emailVerified && (
            <>
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Image source={showPassword ? eyeOpen : eyeClosed} style={styles.eyeIcon} />
                </TouchableOpacity>
              </View>

              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Confirm Password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  secureTextEntry={!showConfirmPassword}
                  editable={!loading}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Image source={showConfirmPassword ? eyeOpen : eyeClosed} style={styles.eyeIcon} />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* SignUp Button */}
          <TouchableOpacity style={[styles.button, styles.signUpButton]} onPress={handleSignUp} disabled={!emailVerified || loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Sign Up</Text>}
          </TouchableOpacity>

          {/* Navigate to Login */}
          <TouchableOpacity onPress={() => navigation.navigate("SignIn")}>
            <Text style={styles.loginText}>Already have an account? Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default SignUp;

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 20,
  },
  form: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 12,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
  },
  input: {
    width: "100%",
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
  },
  button: {
    backgroundColor: "#4ac76f",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 15,
  },
  verifyButton: {
    backgroundColor: "#2e7d32",
  },
  signUpButton: {
    marginTop: 25,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
  },
  loginText: {
    textAlign: "center",
    color: "#4ac76f",
    marginTop: 10,
  },
});
