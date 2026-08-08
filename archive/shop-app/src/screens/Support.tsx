import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { io, Socket } from "socket.io-client";
// If you use vector icons for React Native, consider using react-native-vector-icons.
// For this example, we're using react-icons from web (adjust accordingly).
import { FaPaperPlane, FaRobot, FaUser } from "react-icons/fa";

const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "shopkeeperChatState";

type ChatMode = "faq" | "pending" | "chat";

interface Message {
  type: "bot" | "user";
  text: string;
}

interface ShopkeeperChatState {
  chatMode: ChatMode;
  messages: Message[];
  expiry: number | null;
}

const loadState = async (): Promise<ShopkeeperChatState> => {
  try {
    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading shopkeeper chat state", e);
  }
  return {
    chatMode: "faq",
    messages: [{ type: "bot", text: "Welcome! How can we help you today?" }],
    expiry: null,
  };
};

const saveState = async (state: ShopkeeperChatState) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error saving shopkeeper chat state", e);
  }
};

const ShopkeeperChat: React.FC = () => {
  const [chatMode, setChatMode] = useState<ChatMode>("faq");
  const [messages, setMessages] = useState<Message[]>([
    { type: "bot", text: "Welcome! How can we help you today?" },
  ]);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [expiry, setExpiry] = useState<number | null>(null);
  const [remainingTime, setRemainingTime] = useState<string>("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load persisted state on mount
  useEffect(() => {
    loadState().then((state) => {
      setChatMode(state.chatMode);
      setMessages(state.messages);
      setExpiry(state.expiry);
    });
  }, []);

  // Persist state on changes
  useEffect(() => {
    saveState({ chatMode, messages, expiry });
  }, [chatMode, messages, expiry]);

  // Establish Socket.IO connection on mount
  useEffect(() => {
    const newSocket = io("http://localhost:8000"); // Adjust server URL as needed
    setSocket(newSocket);

    newSocket.on("shopkeeper-receive-message", (data: { message: string }) => {
      setMessages((prev) => [...prev, { type: "bot", text: data.message }]);
    });

    // When admin accepts the chat, switch to chat mode and set valid expiry.
    newSocket.on("shopkeeper-chat-accepted", () => {
      setChatMode("chat");
      const newExpiry = Date.now() + SESSION_DURATION;
      setExpiry(newExpiry);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Admin has accepted your chat request. Session started.",
        },
      ]);
    });

    // Listen for admin ending the session
    newSocket.on("admin-end-session", () => {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Your chat session has been ended by admin." },
      ]);
      setChatMode("faq");
      setExpiry(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    });

    newSocket.on("chat-deleted", () => {
      setMessages([
        { type: "bot", text: "Your chat session has been closed by admin." },
      ]);
      setChatMode("faq");
      AsyncStorage.removeItem(STORAGE_KEY);
      setExpiry(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Session timer: update remaining time every second when in chat mode with valid expiry
  useEffect(() => {
    if (chatMode === "chat" && expiry && expiry > Date.now()) {
      intervalRef.current = setInterval(() => {
        const remaining = expiry - Date.now();
        if (remaining > 0) {
          const minutes = Math.floor(remaining / 60000);
          const seconds = Math.floor((remaining % 60000) / 1000);
          setRemainingTime(`${minutes}:${seconds < 10 ? "0" : ""}${seconds}`);
        } else {
          handleEndSession();
        }
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [chatMode, expiry]);

  // Resend chat request when in pending mode
  const resendRequest = () => {
    if (socket && socket.id) {
      fetch("http://localhost:8000/api/support/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socketId: socket.id, userType: "shopkeeper" }),
      }).catch((err) => console.error("Error resending support request:", err));
      socket.emit("shopkeeper-chat-request");
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Resent chat request. Waiting for admin acceptance...",
        },
      ]);
    }
  };

  // Handle sending a message
  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { type: "user", text }]);
    if (chatMode === "faq") {
      if (text.toLowerCase() === "connect to support") {
        if (socket && socket.id) {
          fetch("http://localhost:8000/api/support/request", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              socketId: socket.id,
              userType: "shopkeeper",
            }),
          }).catch((err) =>
            console.error("Error creating support request:", err)
          );
        }
        setChatMode("pending");
        socket?.emit("shopkeeper-chat-request");
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: "Chat request sent. Waiting for admin acceptance...",
          },
        ]);
      } else {
        const faqResponses: Record<string, string> = {
          "how do i add a product?":
            "To add a product, go to the 'Add Product' section and fill the form to add the product.",
          "how do i manage inventory?":
            "Use the 'Products' section to add, edit, or remove products.",
          "how do i update my shop details?":
            "Go to 'Account' and click 'Edit Shop Details' to update your information.",
          "how do i handle payments?":
            "Payments are processed automatically. Check the 'Payments' section for details.",
          "how do i view order history?":
            "Go to the 'Orders' section and click on 'Order History'.",
        };
        const response =
          faqResponses[text.toLowerCase()] ||
          "Sorry, I didn't understand that question.";
        setMessages((prev) => [...prev, { type: "bot", text: response }]);
      }
    } else if (chatMode === "chat") {
      socket?.emit("shopkeeper-message", { message: text });
    }
    setInput("");
  };

  // End the chat session (shopkeeper and admin can trigger this)
  const handleEndSession = () => {
    socket?.emit("shopkeeper-end-session");
    fetch("http://localhost:8000/api/support/end-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ socketId: socket?.id }),
    }).catch((err) => console.error("Error ending session:", err));
    setMessages((prev) => [
      ...prev,
      { type: "bot", text: "Your chat session has ended." },
    ]);
    setChatMode("faq");
    setExpiry(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  return (
    <KeyboardAvoidingView
      style={styles.chatContainer}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      {/* Header */}
      <View style={styles.chatHeader}>
        <Text style={styles.chatHeaderText}>Shopkeeper Support</Text>
      </View>

      {/* Chat Messages */}
      <ScrollView
        style={styles.chatMessages}
        ref={scrollViewRef}
        onContentSizeChange={() =>
          scrollViewRef.current?.scrollToEnd({ animated: true })
        }
      >
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.chatMessage,
              msg.type === "user"
                ? styles.chatMessageUser
                : styles.chatMessageBot,
            ]}
          >
            <Text style={styles.chatMessageText}>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* FAQ / Pending UI */}
      {chatMode === "faq" && <FAQList handleSendMessage={handleSendMessage} />}
      {chatMode === "pending" && (
        <View style={styles.chatPending}>
          <Text>Chat request sent. Waiting for admin acceptance...</Text>
          <TouchableOpacity onPress={resendRequest} style={styles.resendButton}>
            <Text style={styles.resendButtonText}>Resend Chat Request</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Chat Input & Timer when in active chat */}
      {chatMode === "chat" && (
        <View style={styles.chatInputContainer}>
          <Text style={styles.chatTimerText}>Time Left: {remainingTime}</Text>
          <TextInput
            style={styles.chatInput}
            value={input}
            onChangeText={setInput}
            placeholder="Type your message..."
            onSubmitEditing={() => handleSendMessage(input)}
          />
          <TouchableOpacity
            onPress={() => handleSendMessage(input)}
            style={styles.chatSendButton}
          >
            <Text style={styles.chatSendButtonText}>Send</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
};

export default ShopkeeperChat;

const FAQList: React.FC<{ handleSendMessage: (text: string) => void }> = ({
  handleSendMessage,
}) => (
  <View style={styles.faqContainer}>
    <Text style={styles.faqTitle}>FAQs:</Text>
    <TouchableOpacity
      onPress={() => handleSendMessage("How do I add a product?")}
    >
      <Text style={styles.faqItem}>How do I add a product?</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => handleSendMessage("How do I manage inventory?")}
    >
      <Text style={styles.faqItem}>How do I manage inventory?</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => handleSendMessage("How do I update my shop details?")}
    >
      <Text style={styles.faqItem}>How do I update my shop details?</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => handleSendMessage("How do I handle payments?")}
    >
      <Text style={styles.faqItem}>How do I handle payments?</Text>
    </TouchableOpacity>
    <TouchableOpacity
      onPress={() => handleSendMessage("How do I view order history?")}
    >
      <Text style={styles.faqItem}>How do I view order history?</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={() => handleSendMessage("Connect to support")}>
      <Text style={[styles.faqItem, styles.faqConnect]}>
        Connect to Support
      </Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },
  chatHeader: {
    padding: 16,
    backgroundColor: "#4F46E5",
    alignItems: "center",
  },
  chatHeaderText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  chatMessage: {
    marginBottom: 8,
    padding: 10,
    borderRadius: 8,
    maxWidth: "80%",
  },
  chatMessageUser: {
    alignSelf: "flex-end",
    backgroundColor: "#60A5FA",
  },
  chatMessageBot: {
    alignSelf: "flex-start",
    backgroundColor: "#E5E7EB",
  },
  chatMessageText: {
    fontSize: 14,
    color: "#111827",
  },
  faqContainer: {
    backgroundColor: "#FFF",
    marginHorizontal: 16,
    marginBottom: 8,
    padding: 12,
    borderRadius: 8,
  },
  faqTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 8,
    color: "#1F2937",
  },
  faqItem: {
    fontSize: 14,
    color: "#374151",
    paddingVertical: 4,
  },
  faqConnect: {
    color: "#2563EB",
    fontWeight: "600",
  },
  chatInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    backgroundColor: "#FFFFFF",
  },
  chatTimerText: {
    fontSize: 14,
    marginRight: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    marginRight: 8,
    fontSize: 14,
  },
  chatSendButton: {
    backgroundColor: "#4F46E5",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  chatSendButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  chatPending: {
    backgroundColor: "#FFF",
    margin: 16,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  resendButton: {
    marginTop: 8,
    backgroundColor: "#2563EB",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  resendButtonText: {
    color: "#FFF",
    fontWeight: "600",
  },
});

export { ShopkeeperChat };
