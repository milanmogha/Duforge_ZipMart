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
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import api from "../services/api"; // Your axios instance configured for React Native

interface ResetPasswordRouteParams {
  email?: string;
}

const ResetPassword: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  // We expect an 'email' param to be passed to this screen
  const { email }: ResetPasswordRouteParams = route.params || {};

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  // If there's no email, navigate back or show an error
  useEffect(() => {
    if (!email) {
      Alert.alert("Error", "Email is missing. Redirecting to forgot password...");
      navigation.navigate("ForgotPassword");
    }
  }, [email]);

  const handleSubmit = async () => {
    setError("");
    setMessage("");

    if (!email) {
      setError("Email is missing. Please try the reset process again.");
      return;
    }

    if (!newPassword || !confirmPassword) {
      setError("Please fill out both password fields.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      // Example debug log
      console.log("Submitting reset password for email:", email);

      // Make API request
      await api.post("/shop/reset-password", {
        email,
        newPassword,
        confirmPassword,
      });

      setMessage("Password reset successfully. Redirecting to login...");

      // Delay before navigating to login
      setTimeout(() => {
        navigation.navigate("Login");
      }, 2000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || "Error resetting password.");
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.box}>
        <Text style={styles.title}>Reset Password</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {message ? <Text style={styles.successText}>{message}</Text> : null}

        {/* New Password */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="New Password"
            secureTextEntry
            value={newPassword}
            onChangeText={setNewPassword}
          />
        </View>

        {/* Confirm Password */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />
        </View>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Reset Password</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

export default ResetPassword;

/** Basic React Native styles */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    backgroundColor: "#FFFFFF",
    width: "90%",
    maxWidth: 400,
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
    fontSize: 20,
    fontWeight: "bold",
    color: "#3B82F6",
    textAlign: "center",
    marginBottom: 16,
  },
  errorText: {
    color: "#EF4444",
    textAlign: "center",
    marginBottom: 8,
  },
  successText: {
    color: "#10B981",
    textAlign: "center",
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 12,
  },
  input: {
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#111827",
  },
  submitButton: {
    backgroundColor: "#3B82F6",
    paddingVertical: 12,
    borderRadius: 6,
    marginTop: 8,
  },
  submitButtonText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
    fontSize: 16,
  },
});
