import { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { io, Socket } from "socket.io-client";
import Header from "@/components/Header";
import { SOCKET_URL } from "@/lib/theme";

type Msg = { from: "bot" | "user"; text: string };
type Mode = "faq" | "pending" | "chat";

const FAQ: Record<string, string> = {
  "How do I place an order?":
    "Browse products, tap ADD, then open your Cart and Proceed to Checkout.",
  "How do I track my order?":
    "Open Account → My Orders and tap an order to see live tracking.",
  "How do I cancel an order?":
    "Open the order from My Orders and tap Cancel order (while it's still Pending or Accepted).",
  "How do I get an invoice?":
    "Once an order is Delivered, open it and tap Download invoice.",
};

export default function Support() {
  const [mode, setMode] = useState<Mode>("faq");
  const [messages, setMessages] = useState<Msg[]>([
    { from: "bot", text: "Hi! How can we help you today?" },
  ]);
  const [input, setInput] = useState("");
  const socketRef = useRef<Socket | null>(null);
  const socketId = useRef<string | undefined>(undefined);

  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on("connect", () => (socketId.current = socket.id));
    socket.on("customer-chat-accepted", () => {
      setMode("chat");
      push("bot", "You're connected to an agent. How can we help?");
    });
    socket.on("customer-receive-message", ({ message }: any) =>
      push("bot", message)
    );
    socket.on("admin-end-session", () => {
      setMode("faq");
      push("bot", "The chat session has ended.");
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  const push = (from: "bot" | "user", text: string) =>
    setMessages((m) => [...m, { from, text }]);

  const send = (text: string) => {
    const t = text.trim();
    if (!t) return;
    push("user", t);
    setInput("");

    if (mode === "faq") {
      if (t.toLowerCase() === "connect to support") {
        if (!socketId.current) return;
        socketRef.current?.emit("customer-chat-request");
        setMode("pending");
        push("bot", "Connecting you to an agent… please wait.");
      } else {
        push("bot", FAQ[t] || "Sorry, I didn't catch that. Try a question below.");
      }
    } else {
      socketRef.current?.emit("customer-message", { message: t });
    }
  };

  const quick = [...Object.keys(FAQ), "Connect to support"];

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-surface"
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Header title="Customer Support" back />

      {mode === "pending" ? (
        <View className="bg-amber-50 p-2">
          <Text className="text-center text-xs font-semibold text-amber-700">
            Waiting for an agent to accept your chat…
          </Text>
        </View>
      ) : null}

      <FlatList
        data={messages}
        keyExtractor={(_, i) => String(i)}
        contentContainerStyle={{ padding: 12, gap: 8 }}
        renderItem={({ item }) => (
          <View
            className={`max-w-[80%] rounded-2xl px-3 py-2 ${
              item.from === "user"
                ? "self-end bg-brand-500"
                : "self-start border border-line bg-white"
            }`}
          >
            <Text className={item.from === "user" ? "text-white" : "text-ink"}>
              {item.text}
            </Text>
          </View>
        )}
      />

      {mode === "faq" ? (
        <View className="flex-row flex-wrap gap-2 px-3 pb-2">
          {quick.map((q) => (
            <Pressable
              key={q}
              onPress={() => send(q)}
              className="rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5"
            >
              <Text className="text-xs font-semibold text-brand-600">{q}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center border-t border-line bg-white p-2">
        <TextInput
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => send(input)}
          placeholder="Type a message…"
          placeholderTextColor="#9CA3AF"
          className="mr-2 h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-ink"
        />
        <Pressable
          onPress={() => send(input)}
          className="h-11 items-center justify-center rounded-xl bg-brand-500 px-4"
        >
          <Text className="font-extrabold text-white">Send</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}
