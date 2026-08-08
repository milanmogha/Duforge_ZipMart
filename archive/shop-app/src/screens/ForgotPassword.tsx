import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../services/api"; // Adjust the import path as needed

interface RouteParams {
  email?: string;
}

const ForgotPassword: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();

  // Extract email from route params
  const { email: routeEmail } = route.params as RouteParams;

  const [email, setEmail] = useState(routeEmail || "");
  const [otp, setOtp] = useState("");
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isOtpVerified, setIsOtpVerified] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // Optional: Persist email using AsyncStorage if you want persistence
  // useEffect(() => {
  //   if (routeEmail) {
  //     // Optionally save to AsyncStorage
  //   }
  // }, [routeEmail]);

  useEffect(() => {
    if (routeEmail) {
      setEmail(routeEmail);
      setShowOtpInput(true);
      setMessage("OTP already sent to your email. Please verify.");
    }
  }, [routeEmail]);

  const handleSendOtp = async () => {
    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.post("/shop/send-otp", { email });
      setShowOtpInput(true);
      setMessage("OTP sent successfully. Please check your email.");
    } catch (err: any) {
      console.error("Error sending OTP:", err);
      setError(err.response?.data?.message || "Error sending OTP.");
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    setError("");
    setMessage("");

    try {
      await api.post("/shop/verify-otp", { email, otp });
      setIsOtpVerified(true);
      setMessage("OTP verified successfully. Redirecting to reset password...");
      setTimeout(() => {
        // Navigate to ResetPassword screen with email as a param
        navigation.navigate("ResetPassword", { email });
      }, 1500);
    } catch (err: any) {
      console.error("Error verifying OTP:", err);
      setError(err.response?.data?.message || "Invalid or expired OTP.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.box}>
          <Text style={styles.title}>Forgot Password</Text>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          {message ? <Text style={styles.messageText}>{message}</Text> : null}

          {!showOtpInput ? (
            <View style={styles.form}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
              <TouchableOpacity style={styles.button} onPress={handleSendOtp}>
                <Text style={styles.buttonText}>Send OTP</Text>
              </TouchableOpacity>
            </View>
          ) : !isOtpVerified ? (
            <View style={styles.form}>
              <Text style={styles.label}>OTP</Text>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={otp}
                onChangeText={setOtp}
                keyboardType="number-pad"
                secureTextEntry
              />
              <TouchableOpacity style={styles.button} onPress={handleVerifyOtp}>
                <Text style={styles.buttonText}>Verify OTP</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                OTP verified successfully! Redirecting...
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

export default ForgotPassword;

/** React Native Styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  box: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 8,
    // iOS shadow
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    // Android elevation
    elevation: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#3B82F6",
    textAlign: "center",
    marginBottom: 20,
  },
  form: {
    marginTop: 10,
  },
  label: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 6,
  },
  input: {
    height: 50,
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 12,
    fontSize: 16,
    color: "#111827",
    marginBottom: 16,
    backgroundColor: "#F9FAFB",
  },
  button: {
    backgroundColor: "#3B82F6",
    paddingVertical: 14,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
  messageText: {
    color: "#10B981",
    textAlign: "center",
    marginBottom: 12,
    fontSize: 14,
  },
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  successText: {
    color: "#10B981",
    fontSize: 16,
    textAlign: "center",
  },
});
