import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  FlatList,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from "react-native";
import { io, Socket } from "socket.io-client";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Chat modes
type ChatMode = "faq" | "pending" | "chat";

// Message type
interface Message {
  type: "bot" | "user";
  text: string;
}

// State stored in AsyncStorage
interface StoredChatState {
  chatMode: ChatMode;
  messages: Message[];
  expiry: number | null;
}

// Constants
const STORAGE_KEY = "customerChatState";
const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes

// Adjust to your server’s IP or hostname
const SERVER_URL = "http://10.0.2.2:8000";

const CustomerSupport: React.FC = () => {
  const [chatMode, setChatMode] = useState<ChatMode>("faq");
  const [messages, setMessages] = useState<Message[]>([
    { type: "bot", text: "Welcome! How can we help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  // FIX: allow undefined here so we can set it to newSocket.id which may be undefined
  const [mySocketId, setMySocketId] = useState<string | undefined>(undefined);
  const [expiry, setExpiry] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // -------------------------------------------
  // 1) Load stored chat state on mount
  // -------------------------------------------
  useEffect(() => {
    const loadState = async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: StoredChatState = JSON.parse(stored);
          // If not expired, restore
          if (parsed.expiry && parsed.expiry > Date.now()) {
            setChatMode(parsed.chatMode);
            setMessages(parsed.messages);
            setExpiry(parsed.expiry);
          } else {
            // If expired or no expiry, revert to FAQ
            await AsyncStorage.removeItem(STORAGE_KEY);
          }
        }
      } catch (error) {
        console.error("[CUSTOMER] Error loading chat state:", error);
      }
    };
    loadState();
  }, []);

  // -------------------------------------------
  // 2) Save state to AsyncStorage whenever changed
  // -------------------------------------------
  const saveState = async (
    mode: ChatMode,
    newMessages: Message[],
    newExpiry: number | null
  ) => {
    try {
      const data: StoredChatState = {
        chatMode: mode,
        messages: newMessages,
        expiry: newExpiry,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error("[CUSTOMER] Error saving chat state:", error);
    }
  };

  // -------------------------------------------
  // 3) Setup Socket.IO (runs ONLY ONCE)
  // -------------------------------------------
  useEffect(() => {
    console.log("[CUSTOMER] Connecting to server at:", SERVER_URL);
    const newSocket = io(SERVER_URL);

    setSocket(newSocket);

    // On connect => store the stable ID
    newSocket.on("connect", () => {
      console.log("[CUSTOMER] Socket connected with id:", newSocket.id);
      setMySocketId(newSocket.id); // no more TS error
    });

    // When admin accepts => we switch to "chat"
    newSocket.on("customer-chat-accepted", () => {
      console.log("[CUSTOMER] 'customer-chat-accepted' => Admin accepted");
      setChatMode("chat");
      const newExp = Date.now() + SESSION_DURATION;
      setExpiry(newExp);

      const acceptedMsg: Message = {
        type: "bot",
        text: "Your chat request has been accepted. You can now chat.",
      };
      setMessages((prev) => {
        const updated = [...prev, acceptedMsg];
        saveState("chat", updated, newExp);
        return updated;
      });
    });

    // Admin sends a message => user receives it
    newSocket.on("customer-receive-message", ({ message }) => {
      console.log("[CUSTOMER] 'customer-receive-message' =>", message);
      const adminMsg: Message = { type: "bot", text: message };
      setMessages((prev) => {
        const updated = [...prev, adminMsg];
        saveState(chatMode, updated, expiry);
        return updated;
      });
    });

    // Admin forcibly ends the chat session
    newSocket.on("admin-end-session", () => {
      console.log("[CUSTOMER] 'admin-end-session' => Admin ended session");
      endSessionLocally("Your chat session has been ended by admin.");
    });

    // If admin forcibly deletes the chat
    newSocket.on("chat-deleted", () => {
      console.log("[CUSTOMER] 'chat-deleted' => forcibly closed by admin");
      endSessionLocally("Your chat session has been closed by admin.");
    });

    return () => {
      console.log("[CUSTOMER] Disconnecting socket.");
      newSocket.disconnect();
    };
    // IMPORTANT: no [chatMode, expiry] => single socket remains
  }, []);

  // -------------------------------------------
  // 4) Session timer (updated every second)
  // -------------------------------------------
  useEffect(() => {
    if (chatMode === "chat" && expiry && expiry > Date.now()) {
      intervalRef.current = setInterval(() => {
        const now = Date.now();
        if (now < expiry) {
          const diff = expiry - now;
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setRemainingTime(`${mins}:${secs < 10 ? "0" : ""}${secs}`);
        } else {
          endSessionLocally("Your chat session has expired.");
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [chatMode, expiry]);

  // -------------------------------------------
  // 5) End session from user side
  // -------------------------------------------
  const handleEndSession = () => {
    console.log("[CUSTOMER] handleEndSession => user ended session");
    socket?.emit("customer-end-session");
    if (mySocketId) {
      fetch(`${SERVER_URL}/api/support/end-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socketId: mySocketId }),
      }).catch((err) => console.error("[CUSTOMER] Error ending session:", err));
    }
    endSessionLocally("You ended the chat session.");
  };

  // Ends session in local state (common final step)
  const endSessionLocally = async (finalBotMsg: string) => {
    console.log("[CUSTOMER] endSessionLocally =>", finalBotMsg);
    const finalMsg: Message = { type: "bot", text: finalBotMsg };
    setMessages((prev) => {
      const updated = [...prev, finalMsg];
      saveState("faq", updated, null);
      return updated;
    });
    setChatMode("faq");
    setExpiry(null);
    setRemainingTime("");
    await AsyncStorage.removeItem(STORAGE_KEY);
  };

  // -------------------------------------------
  // 6) Send messages
  // -------------------------------------------
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;
    console.log("[CUSTOMER] handleSendMessage =>", text, " in mode:", chatMode);

    // Add user message to local list
    const userMsg: Message = { type: "user", text };
    const updated = [...messages, userMsg];
    setMessages(updated);
    await saveState(chatMode, updated, expiry);
    setInput("");

    if (chatMode === "faq") {
      // Possibly "Connect to support"
      if (text.toLowerCase() === "connect to support") {
        if (!mySocketId) {
          console.warn("[CUSTOMER] We have no socket.id yet! Please wait...");
          return;
        }

        // Create support request in DB
        try {
          const res = await fetch(`${SERVER_URL}/api/support/request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              socketId: mySocketId,
              userType: "customer",
            }),
          });
          if (!res.ok) {
            console.error("[CUSTOMER] Failed to create support request");
          }
        } catch (err) {
          console.error("[CUSTOMER] Error creating support request:", err);
        }

        // Emit the socket event
        console.log("[CUSTOMER] Emitting 'customer-chat-request'");
        socket?.emit("customer-chat-request");

        setChatMode("pending");
        const pendingMsg: Message = {
          type: "bot",
          text: "Chat request sent. Waiting for admin acceptance...",
        };
        const next = [...updated, pendingMsg];
        setMessages(next);
        await saveState("pending", next, null);
      } else {
        // Basic FAQ responses
        const faqResponses: Record<string, string> = {
          "how do i place an order?":
            "To place an order, browse products and click 'Add to Cart'. Then proceed to checkout.",
          "how do i track my order?":
            "Go to 'My Orders' to see the status of each order.",
          "how do i cancel an order?":
            "Open 'My Orders' and cancel the desired order.",
          "how do i return a product?":
            "Go to 'My Orders' and request a return.",
          "how do i update my profile?":
            "Go to 'Profile' and edit your details.",
          "how do i make payments?":
            "Payments are managed via the 'Payments' section.",
        };
        const response =
          faqResponses[text.toLowerCase()] ||
          "Sorry, I didn't understand that question.";

        const botMsg: Message = { type: "bot", text: response };
        const next = [...updated, botMsg];
        setMessages(next);
        await saveState("faq", next, null);
      }
    } else if (chatMode === "pending") {
      // You can still send messages while pending
      console.log("[CUSTOMER] Emitting 'customer-message' =>", text);
      socket?.emit("customer-message", { message: text });
    } else if (chatMode === "chat") {
      // Normal active chat
      console.log("[CUSTOMER] Emitting 'customer-message' =>", text);
      socket?.emit("customer-message", { message: text });
    }
  };

  // 6b) "Resend Chat Request"
  const handleResendRequest = async () => {
    console.log("[CUSTOMER] handleResendRequest => socketId:", mySocketId);
    if (!mySocketId) {
      console.warn("[CUSTOMER] No socketId yet! Cannot resend.");
      return;
    }

    try {
      await fetch(`${SERVER_URL}/api/support/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socketId: mySocketId, userType: "customer" }),
      });
    } catch (err) {
      console.error("[CUSTOMER] Error resending support request:", err);
    }

    console.log("[CUSTOMER] Emitting 'customer-chat-request' again");
    socket?.emit("customer-chat-request");
    const resentMsg: Message = {
      type: "bot",
      text: "Resent chat request. Still waiting for admin acceptance...",
    };
    setMessages((prev) => {
      const updated = [...prev, resentMsg];
      saveState("pending", updated, expiry);
      return updated;
    });
  };

  // -------------------------------------------
  // 7) Rendering
  // -------------------------------------------
  const faqOptions = [
    "How do I place an order?",
    "How do I track my order?",
    "How do I cancel an order?",
    "How do I return a product?",
    "How do I update my profile?",
    "How do I make payments?",
    "Connect to support",
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Customer Support</Text>
      </View>

      {/* If in chat mode, show timer & End Chat button */}
      {chatMode === "chat" && expiry && (
        <View style={styles.chatInfoContainer}>
          <Text style={styles.timerText}>Time Left: {remainingTime}</Text>
          <TouchableOpacity
            style={styles.endChatButton}
            onPress={handleEndSession}
          >
            <Text style={styles.endChatButtonText}>End Chat</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* If in pending, show "Resend" button */}
      {chatMode === "pending" && (
        <View style={styles.pendingContainer}>
          <Text style={styles.pendingText}>
            Chat request sent. Waiting for admin acceptance...
          </Text>
          <TouchableOpacity
            style={styles.resendButton}
            onPress={handleResendRequest}
          >
            <Text style={styles.resendButtonText}>Resend Chat Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat messages */}
      <FlatList
        data={messages}
        keyExtractor={(_, i) => i.toString()}
        renderItem={({ item }) => (
          <View
            style={[
              styles.messageBubble,
              item.type === "user" ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        )}
        contentContainerStyle={{ flexGrow: 1, padding: 10 }}
      />

      {/* If in FAQ mode, show the quick questions */}
      {chatMode === "faq" && (
        <ScrollView style={styles.faqContainer}>
          <Text style={styles.faqTitle}>FAQs:</Text>
          {faqOptions.map((q, i) => (
            <TouchableOpacity key={i} onPress={() => handleSendMessage(q)}>
              <Text style={styles.faqItem}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input box */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
          onSubmitEditing={() => handleSendMessage(input)}
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={() => handleSendMessage(input)}
        >
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

// -------------------------------------------
// Styles
// -------------------------------------------
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#eef1f5",
  },
  header: {
    backgroundColor: "#4f46e5",
    paddingVertical: 15,
    alignItems: "center",
  },
  headerTitle: {
    marginTop: 20,
    fontSize: 18,
    color: "#fff",
    fontWeight: "bold",
  },
  chatInfoContainer: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: 10,
    justifyContent: "space-between",
    alignItems: "center",
  },
  timerText: {
    fontSize: 14,
    color: "#111",
  },
  endChatButton: {
    backgroundColor: "#dc2626",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
  },
  endChatButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  pendingContainer: {
    backgroundColor: "#fffbeb",
    padding: 10,
    alignItems: "center",
  },
  pendingText: {
    fontSize: 14,
    marginBottom: 5,
    color: "#92400e",
  },
  resendButton: {
    backgroundColor: "#f97316",
    paddingVertical: 5,
    paddingHorizontal: 15,
    borderRadius: 5,
    marginTop: 5,
  },
  resendButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 10,
    borderRadius: 8,
    marginVertical: 5,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#2563eb",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#6b7280",
  },
  messageText: {
    color: "#fff",
  },
  faqContainer: {
    backgroundColor: "#e0e7ff",
    padding: 10,
    paddingBottom: 20,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#4338ca",
    marginBottom: 10,
  },
  faqItem: {
    fontSize: 14,
    color: "#4f46e5",
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderColor: "#ccc",
    padding: 8,
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    marginRight: 10,
    height: 40,
  },
  sendButton: {
    backgroundColor: "#4f46e5",
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6,
  },
  sendButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default CustomerSupport;
