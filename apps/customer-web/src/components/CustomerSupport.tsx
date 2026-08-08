import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { FiSend } from "react-icons/fi";
import { API_BASE_URL, SOCKET_URL } from "@zipmart/shared";

const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "customerChatState";

type ChatMode = "faq" | "pending" | "chat";

interface Message {
  type: "bot" | "user";
  text: string;
}

interface CustomerChatState {
  chatMode: ChatMode;
  messages: Message[];
  expiry: number | null;
}

const loadState = (): CustomerChatState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error("Error loading customer chat state", e);
  }
  return {
    chatMode: "faq",
    messages: [{ type: "bot", text: "Welcome! How can we help you today?" }],
    expiry: null,
  };
};

const saveState = (state: CustomerChatState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const CustomerChat: React.FC = () => {
  const initialState = loadState();
  const [chatMode, setChatMode] = useState<ChatMode>(initialState.chatMode);
  const [messages, setMessages] = useState<Message[]>(initialState.messages);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [expiry, setExpiry] = useState<number | null>(initialState.expiry);
  const [remainingTime, setRemainingTime] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    saveState({ chatMode, messages, expiry });
  }, [chatMode, messages, expiry]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Listen for admin acceptance
    newSocket.on("customer-chat-accepted", () => {
      setChatMode("chat");
      const newExpiry = Date.now() + SESSION_DURATION;
      setExpiry(newExpiry);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Your chat request has been accepted by admin. Session started.",
        },
      ]);
    });

    // Listen for messages from the admin
    newSocket.on("customer-receive-message", (data) => {
      setMessages((prev) => [...prev, { type: "bot", text: data.message }]);
    });

    // If admin forcibly ends the session
    newSocket.on("admin-end-session", () => {
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Your chat session has ended." },
      ]);
      setChatMode("faq");
      setExpiry(null);
    });

    // If admin forcibly deletes
    newSocket.on("chat-deleted", () => {
      setMessages([
        { type: "bot", text: "Your chat session has been closed by admin." },
      ]);
      setChatMode("faq");
      localStorage.removeItem(STORAGE_KEY);
      setExpiry(null);
      if (intervalRef.current) clearInterval(intervalRef.current);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

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

  const resendRequest = () => {
    if (socket && socket.id) {
      fetch(`${API_BASE_URL}/support/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socketId: socket.id, userType: "customer" }),
      }).catch((err) => console.error("Error resending support request:", err));
      socket.emit("customer-chat-request");
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Resent chat request. Waiting for admin acceptance...",
        },
      ]);
    }
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages((prev) => [...prev, { type: "user", text }]);
    if (chatMode === "faq") {
      if (text.toLowerCase() === "connect to support") {
        if (socket && socket.id) {
          fetch(`${API_BASE_URL}/support/request`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ socketId: socket.id, userType: "customer" }),
          }).catch((err) =>
            console.error("Error creating support request:", err)
          );
        }
        setChatMode("pending");
        socket?.emit("customer-chat-request");
        setMessages((prev) => [
          ...prev,
          {
            type: "bot",
            text: "Chat request sent. Waiting for admin acceptance...",
          },
        ]);
      } else {
        const faqResponses: Record<string, string> = {
          "how do i place an order?":
            "To place an order, browse products and click 'Add to Cart'. Proceed to checkout to complete your order.",
          "how do i track my order?":
            "Go to 'My Orders' and click on the order to track its status.",
          "how do i cancel an order?":
            "Visit 'My Orders' and select the order you wish to cancel.",
          "how do i return a product?":
            "Go to 'My Orders' and select the product to request a return.",
          "how do i update my profile?":
            "Click on 'Profile' and select 'Edit Profile' to update your details.",
          "how do i make payments?":
            "Use the 'Payments' section to manage your payment methods securely.",
        };
        const response =
          faqResponses[text.toLowerCase()] ||
          "Sorry, I didn't understand that question.";
        setMessages((prev) => [...prev, { type: "bot", text: response }]);
      }
    } else if (chatMode === "chat") {
      socket?.emit("customer-message", { message: text });
    }
    setInput("");
  };

  const handleEndSession = () => {
    socket?.emit("customer-end-session");
    fetch(`${API_BASE_URL}/support/end-session`, {
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

  const faqs = [
    "How do I place an order?",
    "How do I track my order?",
    "How do I cancel an order?",
    "How do I return a product?",
    "How do I update my profile?",
    "How do I make payments?",
  ];

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col p-4">
      <div className="flex h-full flex-col overflow-hidden rounded-[2rem] border border-cream-300 bg-cream-50 shadow-arch">
        <header className="flex items-center justify-between bg-gradient-to-r from-ink-800 to-brand-800 px-5 py-4 text-cream-100">
          <div>
            <p className="font-display text-xs italic text-accent-300">
              We're here to help
            </p>
            <h1 className="font-display text-lg font-bold text-cream-50">
              Customer Support
            </h1>
          </div>
          {chatMode === "chat" && (
            <div className="flex items-center gap-3 text-sm">
              <span className="rounded-full bg-cream-50/15 px-3 py-1 font-semibold backdrop-blur-sm">
                ⏱ {remainingTime}
              </span>
              <button
                onClick={handleEndSession}
                className="rounded-full bg-cream-50 px-3 py-1 font-semibold text-ink-800 transition hover:bg-cream-100"
              >
                End Chat
              </button>
            </div>
          )}
        </header>

        {chatMode === "pending" && (
          <div className="flex items-center justify-between gap-3 border-b border-accent-300/40 bg-accent-300/20 px-5 py-3 text-sm text-ink-700">
            <p>Chat request sent. Waiting for admin acceptance…</p>
            <button
              onClick={resendRequest}
              className="shrink-0 font-semibold text-brand-700 hover:underline"
            >
              Resend
            </button>
          </div>
        )}

        <div className="flex-1 space-y-3 overflow-y-auto bg-cream-100 p-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-arch ${
                  msg.type === "user"
                    ? "rounded-br-md bg-brand-600 text-white"
                    : "rounded-bl-md border border-cream-300 bg-cream-50 text-ink-800"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {chatMode === "faq" && (
          <div className="border-t border-cream-300 bg-cream-50 p-4">
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-500">
              Quick questions
            </p>
            <div className="flex flex-wrap gap-2">
              {faqs.map((q) => (
                <button
                  key={q}
                  onClick={() => handleSendMessage(q)}
                  className="rounded-full border border-cream-300 bg-cream-100 px-3 py-1.5 text-xs font-medium text-ink-700 transition hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700"
                >
                  {q}
                </button>
              ))}
              <button
                onClick={() => handleSendMessage("Connect to support")}
                className="rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white transition hover:bg-brand-700"
              >
                Connect to Support
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 border-t border-cream-300 bg-cream-50 p-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="input-field flex-1 border-cream-300 bg-cream-100"
            placeholder="Type your message…"
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(input)}
          />
          <button
            onClick={() => handleSendMessage(input)}
            className="btn-primary px-4"
            aria-label="Send message"
          >
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomerChat;
