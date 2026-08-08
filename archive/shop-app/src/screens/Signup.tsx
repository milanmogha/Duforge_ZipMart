import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons"; // For eye/eye-slash icons
import api from "../services/api"; // Your configured Axios instance

interface SignupFormData {
  ownerName: string;
  shopName: string;
  email: string;
  phone: string;
  location: string;
  latitude: string;
  longitude: string;
  aadharNumber: string;
  gstNumber: string;
  password: string;
  confirmPassword: string;
}

const TTL_KEY = 5 * 60 * 1000; // 5 minutes in milliseconds

const Signup: React.FC = () => {
  const navigation = useNavigation();

  // State for the signup form
  const [formData, setFormData] = useState<SignupFormData>({
    ownerName: "",
    shopName: "",
    email: "",
    phone: "",
    location: "",
    latitude: "",
    longitude: "",
    aadharNumber: "",
    gstNumber: "",
    password: "",
    confirmPassword: "",
  });

  // State for uploaded images (store URI strings)
  const [aadharCard, setAadharCard] = useState<string | null>(null);
  const [gstProof, setGstProof] = useState<string | null>(null);

  // State for password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // State for OTP flow
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  // Error/Message state
  const [error, setError] = useState("");

  // ------------------------
  //  Local Storage with TTL
  // ------------------------
  const saveToAsyncStorage = async (key: string, value: any, ttl: number) => {
    try {
      const data = { value, expiry: Date.now() + ttl };
      await AsyncStorage.setItem(key, JSON.stringify(data));
    } catch (err) {
      console.log("Error saving to AsyncStorage:", err);
    }
  };

  const getFromAsyncStorage = async (key: string) => {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (!jsonValue) return null;

      const { value, expiry } = JSON.parse(jsonValue);
      if (Date.now() > expiry) {
        // Data expired
        await AsyncStorage.removeItem(key);
        return null;
      }
      return value;
    } catch (err) {
      console.log("Error reading from AsyncStorage:", err);
      return null;
    }
  };

  // Save form data whenever it changes (with TTL = 5 minutes)
  useEffect(() => {
    saveToAsyncStorage("signupFormData", formData, TTL_KEY);
  }, [formData]);

  // Load form data on mount
  useEffect(() => {
    (async () => {
      const storedData = await getFromAsyncStorage("signupFormData");
      if (storedData) {
        setFormData(storedData);
      }
    })();
  }, []);

  // ------------------------
  //   Request Media Library Permission
  // ------------------------
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow media library access to select images."
        );
      }
    })();
  }, []);

  // ------------------------
  //   Location Handling
  // ------------------------
  const fetchLocation = async () => {
    setError("");
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setError("Location is required. Please enable location access.");
      return;
    }
    try {
      const locationResult = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = locationResult.coords;
      setFormData((prev) => ({
        ...prev,
        latitude: latitude.toString(),
        longitude: longitude.toString(),
      }));
    } catch (err) {
      setError("Error fetching location. Please try again.");
    }
  };

  // Fetch location on mount if not already set
  useEffect(() => {
    if (!formData.latitude || !formData.longitude) {
      fetchLocation();
    }
  }, [formData.latitude, formData.longitude]);

  // ------------------------
  //   Image Handling
  // ------------------------
  const pickImage = async (
    setter: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaType.Images,
        quality: 1,
      });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        setter(result.assets[0].uri);
      } else {
        Alert.alert("Canceled", "No image selected.");
      }
    } catch (err) {
      Alert.alert("Error", "Could not open image library.");
      console.log(err);
    }
  };

  // ------------------------
  //   OTP Flow
  // ------------------------
  const sendOtp = async () => {
    setError("");
    try {
      await api.post("/shop/send-otp", { email: formData.email });
      setOtpSent(true);
      Alert.alert("OTP Sent", "OTP sent to your email. Please check your inbox.");
    } catch (err: any) {
      console.log(err);
      setError(err.response?.data?.message || "Error sending OTP.");
    }
  };

  const verifyOtp = async () => {
    setError("");
    try {
      const response = await api.post("/shop/verify-otp", {
        email: formData.email,
        otp,
      });
      if (response.data.verified) {
        setEmailVerified(true);
        Alert.alert("Success", "Email verified successfully!");
      }
    } catch (err: any) {
      console.log(err);
      setError(err.response?.data?.message || "Invalid OTP.");
    }
  };

  // ------------------------
  //   Form Submission
  // ------------------------
  const handleSignUp = async () => {
    setError("");

    // Validate location
    if (!formData.latitude || !formData.longitude) {
      setError("Location is required. Please enable location access.");
      return;
    }

    // Check email verification
    if (!emailVerified) {
      setError("Please verify your email before signing up.");
      return;
    }

    // Check password match
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    // Check required images
    if (!aadharCard || !gstProof) {
      setError("Aadhar Card and GST Proof are required!");
      return;
    }

    // Prepare multipart form data
    const submissionData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      submissionData.append(key, value);
    });

    // Append images as file objects
    submissionData.append("aadharCard", {
      uri: aadharCard,
      type: "image/jpeg", // or "image/png" if needed
      name: "aadhar.jpg",
    } as any);

    submissionData.append("gstProof", {
      uri: gstProof,
      type: "image/jpeg",
      name: "gst.jpg",
    } as any);

    try {
      await api.post("/shop/signup", submissionData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      Alert.alert(
        "Success",
        "Account created successfully and submitted for admin approval!"
      );
      // Clear AsyncStorage
      await AsyncStorage.removeItem("signupFormData");
      // Navigate to login (adjust route as needed)
      navigation.navigate("ShopkeeperLogin" as never);
    } catch (err: any) {
      console.log(err);
      setError(err.response?.data?.message || "Error creating account.");
    }
  };

  // ------------------------
  //   Rendering
  // ------------------------
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Shopkeeper Account</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Owner Name */}
      <TextInput
        style={styles.input}
        placeholder="Owner's Name"
        value={formData.ownerName}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, ownerName: text }))
        }
      />

      {/* Shop Name */}
      <TextInput
        style={styles.input}
        placeholder="Shop Name"
        value={formData.shopName}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, shopName: text }))
        }
      />

      {/* Email */}
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={formData.email}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, email: text }))
        }
      />

      {/* Phone */}
      <TextInput
        style={styles.input}
        placeholder="Phone (10 digits)"
        keyboardType="phone-pad"
        value={formData.phone}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, phone: text }))
        }
      />

      {/* Location / Shop Address */}
      <TextInput
        style={styles.input}
        placeholder="Location / Shop Address"
        value={formData.location}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, location: text }))
        }
      />

      {/* Aadhar Number */}
      <TextInput
        style={styles.input}
        placeholder="Aadhar Number (12 digits)"
        value={formData.aadharNumber}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, aadharNumber: text }))
        }
      />

      {/* GST Number */}
      <TextInput
        style={styles.input}
        placeholder="GST Number (15 characters)"
        value={formData.gstNumber}
        onChangeText={(text) =>
          setFormData((prev) => ({ ...prev, gstNumber: text }))
        }
      />

      {/* Upload Aadhar Card */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => pickImage(setAadharCard)}
      >
        <Text style={styles.uploadButtonText}>Upload Aadhar Card</Text>
      </TouchableOpacity>
      {aadharCard ? (
        <Text style={styles.fileText}>Aadhar Card Selected</Text>
      ) : null}

      {/* Upload GST Proof */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => pickImage(setGstProof)}
      >
        <Text style={styles.uploadButtonText}>Upload GST Proof</Text>
      </TouchableOpacity>
      {gstProof ? (
        <Text style={styles.fileText}>GST Proof Selected</Text>
      ) : null}

      {/* Password */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={formData.password}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, password: text }))
          }
        />
        <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
          <Ionicons
            name={showPassword ? "eye-off" : "eye"}
            size={24}
            color="#666"
            style={{ marginRight: 8 }}
          />
        </TouchableOpacity>
      </View>

      {/* Confirm Password */}
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          value={formData.confirmPassword}
          onChangeText={(text) =>
            setFormData((prev) => ({ ...prev, confirmPassword: text }))
          }
        />
        <TouchableOpacity
          onPress={() => setShowConfirmPassword(!showConfirmPassword)}
        >
          <Ionicons
            name={showConfirmPassword ? "eye-off" : "eye"}
            size={24}
            color="#666"
            style={{ marginRight: 8 }}
          />
        </TouchableOpacity>
      </View>

      {/* OTP Flow */}
      {!otpSent && !emailVerified && (
        <TouchableOpacity style={styles.button} onPress={sendOtp}>
          <Text style={styles.buttonText}>Send OTP</Text>
        </TouchableOpacity>
      )}

      {otpSent && !emailVerified && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Enter OTP"
            keyboardType="numeric"
            value={otp}
            onChangeText={setOtp}
          />
          <TouchableOpacity style={styles.button} onPress={verifyOtp}>
            <Text style={styles.buttonText}>Verify OTP</Text>
          </TouchableOpacity>
        </>
      )}

      {/* Sign Up Button */}
      <TouchableOpacity
        style={[styles.button, emailVerified ? {} : { backgroundColor: "#999" }]}
        onPress={handleSignUp}
        disabled={!emailVerified}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      {/* Login Redirect */}
      <TouchableOpacity
        style={{ marginTop: 10 }}
        onPress={() => navigation.navigate("Login" as never)}
      >
        <Text style={{ color: "#4ac76f", textAlign: "center" }}>
          Already have an account? Login
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

export default Signup;

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#ffffff",
    minHeight: "100%",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4ac76f",
    textAlign: "center",
    marginBottom: 15,
  },
  errorText: {
    color: "red",
    textAlign: "center",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#4ac76f",
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
  },
  uploadButton: {
    backgroundColor: "#4ac76f",
    padding: 12,
    borderRadius: 6,
    marginBottom: 5,
    alignItems: "center",
  },
  uploadButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  fileText: {
    marginBottom: 10,
    textAlign: "center",
    color: "green",
  },
  passwordContainer: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#4ac76f",
    borderRadius: 6,
    marginBottom: 15,
    alignItems: "center",
    paddingRight: 6,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4ac76f",
    padding: 15,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 10,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
