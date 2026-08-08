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

export default function OtpScreen() {
  const { verifyOtp, phone } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (code.replace(/\D/g, "").length < 6) {
      Alert.alert("Enter the 6-digit code sent to your phone.");
      return;
    }
    setLoading(true);
    try {
      await verifyOtp(code);
      try {
        router.dismissAll();
      } catch {
        router.replace("/account");
      }
    } catch (e: any) {
      Alert.alert("Verification failed", e?.message ?? "Please try again.");
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
          <Text className="text-2xl font-black text-ink">Verify your number</Text>
          <Text className="mt-1 text-base text-muted">
            Enter the code sent to {phone ?? "your phone"}.
          </Text>

          <TextInput
            value={code}
            onChangeText={setCode}
            placeholder="• • • • • •"
            placeholderTextColor="#C7CBD1"
            keyboardType="number-pad"
            maxLength={6}
            className="mt-8 h-16 rounded-2xl border border-line bg-surface text-center text-2xl font-black tracking-[12px] text-ink"
          />
        </View>

        <Pressable
          onPress={submit}
          disabled={loading}
          className={`h-14 items-center justify-center rounded-2xl ${
            code.replace(/\D/g, "").length === 6 ? "bg-brand-500" : "bg-brand-200"
          }`}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-base font-extrabold text-white">
              Verify & Continue
            </Text>
          )}
        </Pressable>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
