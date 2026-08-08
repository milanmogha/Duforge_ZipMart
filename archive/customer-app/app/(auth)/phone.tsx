import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuth } from "@/context/AuthContext";

export default function PhoneScreen() {
  const { sendOtp } = useAuth();
  const [num, setNum] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    const digits = num.replace(/\D/g, "");
    if (digits.length !== 10) {
      Alert.alert("Invalid number", "Enter a valid 10-digit mobile number.");
      return;
    }
    setLoading(true);
    try {
      await sendOtp("+91" + digits);
      router.push("/(auth)/otp");
    } catch (e: any) {
      Alert.alert("Couldn't send OTP", e?.message ?? "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        className="flex-1 justify-between p-6"
      >
        <View>
          <Pressable onPress={() => router.back()} className="mb-6 py-2">
            <Text className="text-2xl text-ink">‹</Text>
          </Pressable>
          <Text className="text-5xl">🛒</Text>
          <Text className="mt-4 text-2xl font-black text-ink">
            Groceries in minutes
          </Text>
          <Text className="mt-1 text-base text-muted">
            Log in or sign up with your mobile number.
          </Text>

          <View className="mt-8 h-14 flex-row items-center rounded-2xl border border-line bg-surface px-4">
            <Text className="text-base font-bold text-ink">+91</Text>
            <View className="mx-3 h-6 w-px bg-line" />
            <TextInput
              value={num}
              onChangeText={setNum}
              placeholder="Mobile number"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={10}
              className="flex-1 text-base font-semibold text-ink"
            />
          </View>
        </View>

        <View>
          <Pressable
            onPress={submit}
            disabled={loading}
            className={`h-14 items-center justify-center rounded-2xl ${
              num.replace(/\D/g, "").length === 10 ? "bg-brand-500" : "bg-brand-200"
            }`}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text className="text-base font-extrabold text-white">
                Continue
              </Text>
            )}
          </Pressable>
          <Text className="mt-3 text-center text-xs text-muted">
            By continuing you agree to ZipMart's Terms & Privacy Policy.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
