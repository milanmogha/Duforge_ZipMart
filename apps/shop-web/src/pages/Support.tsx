import React, { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import {
  FaPaperPlane,
  FaRobot,
  FaUser,
  FaHeadset,
  FaClock,
} from "react-icons/fa";
import { API_BASE_URL, SOCKET_URL } from "@zipmart/shared";

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

const loadState = (): ShopkeeperChatState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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

const saveState = (state: ShopkeeperChatState) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const ShopkeeperChat: React.FC = () => {
  const initialState = loadState();
  const [chatMode, setChatMode] = useState<ChatMode>(initialState.chatMode);
  const [messages, setMessages] = useState<Message[]>(initialState.messages);
  const [input, setInput] = useState("");
  const [socket, setSocket] = useState<Socket | null>(null);
  const [expiry, setExpiry] = useState<number | null>(initialState.expiry);
  const [remainingTime, setRemainingTime] = useState<string>("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    saveState({ chatMode, messages, expiry });
  }, [chatMode, messages, expiry]);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
    setSocket(newSocket);

    // Listen for admin acceptance
    newSocket.on("shopkeeper-chat-accepted", () => {
      setChatMode("chat");
      const newExpiry = Date.now() + SESSION_DURATION;
      setExpiry(newExpiry);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Admin has accepted your chat request. Session started." },
      ]);
    });

    // Listen for admin’s messages
    newSocket.on("shopkeeper-receive-message", (data) => {
      setMessages((prev) => [...prev, { type: "bot", text: data.message }]);
    });

    // If forcibly closed by admin
    newSocket.on("chat-deleted", () => {
      setMessages([{ type: "bot", text: "Your chat session has been closed by admin." }]);
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

  // Auto-scroll to the newest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, chatMode]);

  const resendRequest = () => {
    if (socket && socket.id) {
      fetch(`${API_BASE_URL}/support/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socketId: socket.id, userType: "shopkeeper" }),
      }).catch((err) => console.error("Error resending support request:", err));
      socket.emit("shopkeeper-chat-request");
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Resent chat request. Waiting for admin acceptance..." },
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
            body: JSON.stringify({ socketId: socket.id, userType: "shopkeeper" }),
          }).catch((err) => console.error("Error creating support request:", err));
        }
        setChatMode("pending");
        socket?.emit("shopkeeper-chat-request");
        setMessages((prev) => [
          ...prev,
          { type: "bot", text: "Chat request sent. Waiting for admin acceptance..." },
        ]);
      } else {
        const faqResponses: Record<string, string> = {
          "how do i add a product?":
            "To add a product, go to the 'Add Product' section and fill in the required details.",
          "how do i manage inventory?":
            "Use the 'Products' section to edit inventory counts, pricing, etc.",
          "how do i update my shop details?":
            "Go to 'Account' and click 'Edit Shop Details' to update your information.",
          "how do i handle payments?":
            "Payments are processed automatically; check the 'Payments' section.",
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

  const handleEndSession = () => {
    socket?.emit("shopkeeper-end-session");
    fetch(`${API_BASE_URL}/support/end-session`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ socketId: socket?.id }),
    }).catch((err) => console.error("Error ending session:", err));
    setMessages((prev) => [...prev, { type: "bot", text: "Your chat session has ended." }]);
    setChatMode("faq");
    setExpiry(null);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const faqItems = [
    { q: "How do I add a product?", text: "📦 How do I add a product?" },
    { q: "How do I manage inventory?", text: "📊 How do I manage inventory?" },
    { q: "How do I update my shop details?", text: "✏️ How do I update my shop details?" },
    { q: "How do I handle payments?", text: "💳 How do I handle payments?" },
    { q: "How do I view order history?", text: "📜 How do I view order history?" },
  ];

  return (
    <div className="page-container flex h-[calc(100dvh-7rem)] max-w-3xl flex-col sm:h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="card flex flex-wrap items-center justify-between gap-3 rounded-b-none px-4 py-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-white">
            <FaHeadset />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-semibold text-slate-900">Shopkeeper Support</h1>
            <p className="truncate text-sm text-slate-500">
              {chatMode === "chat"
                ? "Connected with an agent"
                : chatMode === "pending"
                ? "Waiting for an agent"
                : "We typically reply within minutes"}
            </p>
          </div>
        </div>
        {chatMode === "chat" && (
          <div className="flex shrink-0 items-center gap-3">
            <span className="badge-blue">
              <FaClock />
              {remainingTime}
            </span>
            <button onClick={handleEndSession} className="btn-danger px-3 py-1.5 text-xs">
              End Chat
            </button>
          </div>
        )}
      </div>

      {/* Pending banner */}
      {chatMode === "pending" && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 bg-amber-50 px-6 py-3">
          <p className="text-sm font-medium text-amber-700">
            Chat request sent. Waiting for admin acceptance...
          </p>
          <button onClick={resendRequest} className="btn-secondary px-3 py-1.5 text-xs">
            Resend Request
          </button>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 space-y-4 overflow-y-auto bg-slate-50 px-4 py-6 sm:px-6">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 ${
              msg.type === "user" ? "justify-end" : "justify-start"
            }`}
          >
            {msg.type === "bot" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-600">
                <FaRobot size={15} />
              </div>
            )}
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                msg.type === "user"
                  ? "rounded-br-sm bg-brand-500 text-white"
                  : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
              }`}
            >
              {msg.text}
            </div>
            {msg.type === "user" && (
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <FaUser size={15} />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* FAQ quick replies */}
      {chatMode === "faq" && (
        <div className="border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Quick questions
          </p>
          <div className="flex flex-wrap gap-2">
            {faqItems.map((item) => (
              <button
                key={item.q}
                onClick={() => handleSendMessage(item.q)}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
              >
                {item.text}
              </button>
            ))}
            <button
              onClick={() => handleSendMessage("Connect to support")}
              className="rounded-full bg-brand-500 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-brand-600"
            >
              🔴 Connect to Support
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex items-center gap-3 border-t border-slate-100 bg-white px-4 py-3 sm:px-6">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="input"
          placeholder="Type your message..."
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage(input)}
        />
        <button
          onClick={() => handleSendMessage(input)}
          className="btn-primary shrink-0 px-4"
          aria-label="Send message"
        >
          <FaPaperPlane size={16} />
        </button>
      </div>
    </div>
  );
};

export default ShopkeeperChat;
