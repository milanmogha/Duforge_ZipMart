import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Keyboard,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../services/api"; // ✅ Using API instance

interface LoginProps {
  setToken: (token: string | null) => void;
  connectSocket: (shopkeeperId: string) => void;
}

const Login: React.FC<LoginProps> = ({ setToken, connectSocket }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const navigation = useNavigation();
  const passwordInputRef = useRef<TextInput>(null);

  const handleSubmit = async () => {
    setError("");
    Keyboard.dismiss();

    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }

    try {
      console.log("🔹 Logging in with:", { email, password });

      const response = await api.post("/shop/login", { email, password });

      console.log("✅ Login Successful:", response.data);

      const { token, shop } = response.data;

      if (!token || !shop?.id) {
        throw new Error("Invalid login response: Missing token or shop ID.");
      }

      await AsyncStorage.multiSet([
        ["shopkeeperToken", token],
        ["shopkeeperId", shop.id],
      ]);

      if (typeof setToken === "function") {
        setToken(token);
      } else {
        console.error("❌ setToken is undefined!");
      }

      if (typeof connectSocket === "function") {
        connectSocket(shop.id);
      } else {
        console.error("❌ connectSocket is undefined!");
      }

      navigation.reset({ index: 0, routes: [{ name: "Dashboard" }] });

    } catch (err: any) {
      console.error("❌ Login Error:", err);

      let errorMessage = "Login failed. Please check your credentials.";

      if (err.response) {
        errorMessage = err.response.data?.message || errorMessage;
      } else if (err.request) {
        errorMessage = "Server not responding. Check your internet connection.";
      } else {
        errorMessage = err.message || errorMessage;
      }

      setError(errorMessage);
      Alert.alert("Login Error", errorMessage);

      if (err.response?.status === 401) {
        await AsyncStorage.removeItem("shopkeeperToken");
      }
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.card}>
        <Text style={styles.title}>Shopkeeper Login</Text>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {/* Email Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your email"
            placeholderTextColor="#999"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Password Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordWrapper}>
            <TextInput
              ref={passwordInputRef}
              style={styles.inputPassword}
              placeholder="Enter your password"
              placeholderTextColor="#999"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
              <MaterialCommunityIcons name={showPassword ? "eye-off" : "eye"} size={24} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Login Button */}
        <Pressable style={styles.loginButton} onPress={handleSubmit}>
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        <View style={styles.linksContainer}>
          <Text style={styles.text}>
            Don't have an account?{" "}
            <Text style={styles.linkText} onPress={() => navigation.navigate("Signup")}>
              Create one
            </Text>
          </Text>

          <Text style={[styles.linkText, styles.marginTop]} onPress={() => navigation.navigate("ForgotPassword")}>
            Forgot Password?
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

// 🔹 Styles
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    padding: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 15,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4ac76f",
    textAlign: "center",
    marginBottom: 20,
    fontFamily: "Lucida Grande",
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
    marginBottom: 5,
    fontFamily: "Lucida Grande",
  },
  inputContainer: {
    marginBottom: 18,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
    fontFamily: "Lucida Grande",
  },
  passwordWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: "#f9fafb",
  },
  inputPassword: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: "#1f2937",
    fontFamily: "Lucida Grande",
  },
  loginButton: {
    backgroundColor: "#4ac76f",
    borderRadius: 12,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
  },
  buttonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    fontFamily: "Lucida Grande",
  },
  linksContainer: {
    marginTop: 20,
    alignItems: "center",
  },
  text: {
    color: "#4b5563",
    fontSize: 14,
    fontFamily: "Lucida Grande",
  },
  linkText: {
    color: "#4ac76f",
    fontWeight: "500",
    fontFamily: "Lucida Grande",
  },
  marginTop: {
    marginTop: 12,
  },
  errorText: {
    color: "#dc2626",
    backgroundColor: "#fee2e2",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
    fontFamily: "Lucida Grande",
  },
});

export default Login;


