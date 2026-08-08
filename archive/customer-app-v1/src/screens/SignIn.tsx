import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAuth } from "../context/AuthContext";

// -----------------------------------------------------------------------------
// Assets
// -----------------------------------------------------------------------------
const bagvector = require("../assets/bagvector.png");
const eyeOpen   = require("../assets/eyeopen.png");
const eyeClosed = require("../assets/eyeclosed.png");

// =============================================================================
// Sign‑In Screen
// =============================================================================
const SignIn: React.FC = () => {
  const navigation = useNavigation();
  const { login, googleLogin } = useAuth();

  // --------------------- Local state ---------------------
  const [email,       setEmail]    = useState("");
  const [password,    setPassword] = useState("");
  const [showPass,    setShowPass] = useState(false);

  // ------------------- Handlers -------------------
  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please enter both email and password.");
      return;
    }
    try {
      await login(email, password);
      Alert.alert("Success", "Login successful!");
      navigation.navigate("Home" as never);
    } catch (err: any) {
      Alert.alert("Login Error", err.message || "Server error. Please try again.");
    }
  };

  const handleGoogleLogin = async () => {
    try {
      await googleLogin();
      Alert.alert("Success", "Logged in with Google!");
      navigation.navigate("Home" as never);
    } catch (err: any) {
      Alert.alert("Google Login Error", err.message || "Couldn’t sign in with Google.");
    }
  };

  // -------------------- UI --------------------
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          style={styles.innerContainer}
        >
          <Image source={bagvector} style={styles.logo} />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Log in to continue shopping</Text>

          <View style={styles.form}>
            {/* Email */}
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="youremail@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              placeholderTextColor="#999"
            />

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={styles.inputPassword}
                value={password}
                onChangeText={setPassword}
                placeholder="********"
                secureTextEntry={!showPass}
                autoCapitalize="none"
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPass(!showPass)}
              >
                <Image source={showPass ? eyeOpen : eyeClosed} style={styles.eyeIcon} />
              </TouchableOpacity>
            </View>

            {/* Email login button */}
            <TouchableOpacity
              style={[styles.button, { opacity: !(email && password) ? 0.7 : 1 }]}
              onPress={handleEmailLogin}
              disabled={!(email && password)}
            >
              <Text style={styles.buttonText}>Log In</Text>
            </TouchableOpacity>

            {/* Google login button */}
            <TouchableOpacity
              style={styles.googleButton}
              onPress={handleGoogleLogin}
            >
              <Text style={styles.googleButtonText}>Sign In with Google</Text>
            </TouchableOpacity>

            {/* Links */}
            <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword" as never)}>
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>

            <View style={styles.signupContainer}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("SignUp" as never)}>
                <Text style={styles.signupLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </ScrollView>
    </View>
  );
};

export default SignIn;

// -----------------------------------------------------------------------------
// Styles
// -----------------------------------------------------------------------------
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  innerContainer: { width: "100%", alignItems: "center" },
  logo: { width: 80, height: 80, marginBottom: 20, resizeMode: "contain" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
    fontFamily: "Lucida Grande",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    marginBottom: 30,
    fontFamily: "Lucida Grande",
  },
  form: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 25,
    borderRadius: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  label: {
    fontSize: 14,
    color: "#666",
    marginBottom: 5,
    marginTop: 10,
    fontFamily: "Lucida Grande",
  },
  input: {
    width: "100%",
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginBottom: 15,
    color: "#333",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    backgroundColor: "#F5F5F5",
    marginBottom: 15,
  },
  inputPassword: { flex: 1, padding: 12, fontSize: 16, color: "#333" },
  eyeButton: { padding: 10 },
  eyeIcon: { width: 24, height: 24 },
  button: {
    backgroundColor: "#4ac76f",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
  },
  googleButton: {
    backgroundColor: "#4285F4",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 10,
  },
  googleButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  forgotPasswordText: {
    textAlign: "center",
    color: "#4ac76f",
    marginBottom: 10,
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
  },
  signupText: {
    fontSize: 14,
    color: "#666",
    fontFamily: "Lucida Grande",
  },
  signupLink: {
    fontSize: 14,
    color: "#4ac76f",
    fontWeight: "bold",
    fontFamily: "Lucida Grande",
  },
});