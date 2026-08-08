import React, { useState, useEffect, useRef, useCallback } from "react";
import { FaTrash, FaArrowLeft, FaPaperPlane, FaHeadset, FaStore } from "react-icons/fa";
import { Socket } from "socket.io-client";
import Badge from "../components/ui/Badge";
import { API_BASE_URL } from "@zipmart/shared";

const SESSION_DURATION = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = "adminShopSupportState";

interface Message {
  type: "admin" | "user";
  text: string;
}

interface ChatSession {
  id: string;
  messages: Message[];
  expiry: number; // numeric timestamp
}

interface AdminChatProps {
  socket: Socket | null;
}

const loadState = (): {
  shopkeeperRequests: string[];
  activeChats: ChatSession[];
  selectedChatId: string | null;
} => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      parsed.activeChats = (parsed.activeChats || []).filter(
        (chat: ChatSession) => Date.now() < chat.expiry
      );
      return {
        shopkeeperRequests: parsed.shopkeeperRequests || [],
        activeChats: parsed.activeChats || [],
        selectedChatId: parsed.selectedChatId || null,
      };
    }
  } catch (e) {
    console.error("Error loading admin shop support state:", e);
  }
  return {
    shopkeeperRequests: [],
    activeChats: [],
    selectedChatId: null,
  };
};

const saveState = (state: {
  shopkeeperRequests: string[];
  activeChats: ChatSession[];
  selectedChatId: string | null;
}) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const AdminChat: React.FC<AdminChatProps> = ({ socket }) => {
  const [shopkeeperRequests, setShopkeeperRequests] = useState<string[]>(
    loadState().shopkeeperRequests
  );
  const [activeChats, setActiveChats] = useState<ChatSession[]>(
    loadState().activeChats
  );
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    loadState().selectedChatId
  );
  const [input, setInput] = useState("");
  const [isMobile, setIsMobile] = useState<boolean>(window.innerWidth < 550);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save to localStorage
  useEffect(() => {
    saveState({ shopkeeperRequests, activeChats, selectedChatId });
  }, [shopkeeperRequests, activeChats, selectedChatId]);

  // Handle resizing
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 550);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load pending from server
  useEffect(() => {
    const loadPendingRequests = async () => {
      try {
        const res = await fetch(
          `${API_BASE_URL}/support/pending-shopkeeper-requests`
        );
        if (res.ok) {
          const data = await res.json();
          setShopkeeperRequests(data.map((req: any) => req.socketId));
        }
      } catch (error) {
        console.error("Failed to load pending shopkeeper requests:", error);
      }
    };
    loadPendingRequests();
  }, []);

  // Socket events
  useEffect(() => {
    if (!socket) return;

    socket.on("new-shopkeeper-chat-request", (requests: string[]) => {
      setShopkeeperRequests(requests);
    });

    // Shopkeeper -> Admin
    socket.on("admin-receive-shopkeeper-message", ({ shopkeeperSocketId, message }) => {
      setActiveChats((prev) =>
        prev.map((chat) =>
          chat.id === shopkeeperSocketId
            ? {
                ...chat,
                messages: [...chat.messages, { type: "user", text: message }],
              }
            : chat
        )
      );
    });

    // Shopkeeper ends session
    socket.on("shopkeeper-end-session", ({ shopkeeperSocketId }) => {
      setActiveChats((prev) => prev.filter((chat) => chat.id !== shopkeeperSocketId));
      if (selectedChatId === shopkeeperSocketId) setSelectedChatId(null);
    });

    return () => {
      socket.off("new-shopkeeper-chat-request");
      socket.off("admin-receive-shopkeeper-message");
      socket.off("shopkeeper-end-session");
    };
  }, [socket, selectedChatId]);

  // Periodically remove expired sessions
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveChats((prev) => {
        const now = Date.now();
        const updated = prev.filter((chat) => {
          if (chat.expiry > now) return true;
          // If expired, notify shopkeeper
          socket?.emit("admin-end-chat", { shopkeeperSocketId: chat.id });
          return false;
        });
        if (selectedChatId && !updated.find((c) => c.id === selectedChatId)) {
          setSelectedChatId(null);
        }
        return updated;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [socket, selectedChatId]);

  const handleAcceptChat = useCallback(
    async (id: string) => {
      // If not already in active
      if (!activeChats.find((chat) => chat.id === id)) {
        try {
          const res = await fetch(`${API_BASE_URL}/support/accept-chat`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ socketId: id }),
          });
          if (!res.ok) {
            console.error("Failed to accept shopkeeper chat request");
            return;
          }
          const chatSession = await res.json();

          // Convert expiry to a number
          let expiryNum = Date.now() + SESSION_DURATION;
          if (chatSession.expiry) {
            const parsed = new Date(chatSession.expiry).getTime();
            if (!isNaN(parsed) && parsed > Date.now()) {
              expiryNum = parsed;
            }
          }
          const newChat: ChatSession = {
            id: chatSession.socketId, // or chatSession.id if you store it that way
            messages: chatSession.messages || [],
            expiry: expiryNum,
          };
          setActiveChats((prev) => [...prev, newChat]);

          // Notify shop
          socket?.emit("admin-accept-shopkeeper-chat", {
            shopkeeperSocketId: id,
          });
        } catch (error) {
          console.error("Error accepting shopkeeper chat request:", error);
        }
      }
      setSelectedChatId(id);
    },
    [activeChats, socket]
  );

  const handleSendMessage = () => {
    if (!input.trim() || !selectedChatId) return;
    setActiveChats((prev) =>
      prev.map((chat) =>
        chat.id === selectedChatId
          ? {
              ...chat,
              messages: [...chat.messages, { type: "admin", text: input }],
            }
          : chat
      )
    );
    // Emit to shopkeeper
    socket?.emit("admin-shopkeeper-message", {
      shopkeeperSocketId: selectedChatId,
      message: input,
    });
    setInput("");
  };

  const handleEndChat = async (id: string) => {
    try {
      await fetch(`${API_BASE_URL}/support/end-session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ socketId: id }),
      });
    } catch (error) {
      console.error("Failed to end chat session", error);
    }
    setActiveChats((prev) => prev.filter((chat) => chat.id !== id));
    if (selectedChatId === id) setSelectedChatId(null);
    socket?.emit("admin-end-chat", { shopkeeperSocketId: id });
  };

  const getRemainingTime = (expiry: number) => {
    const remaining = Math.max(0, expiry - Date.now());
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  // Lists
  const renderChatList = () => (
    <div className="w-full overflow-y-auto p-4 scrollbar-thin">
      <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Shopkeeper Requests{" "}
        {shopkeeperRequests.length > 0 && (
          <Badge tone="danger">{shopkeeperRequests.length}</Badge>
        )}
      </h2>
      <ul className="space-y-2">
        {shopkeeperRequests.map((id) => (
          <li
            key={id}
            className="flex items-center justify-between gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5"
          >
            <span
              className="min-w-0 cursor-pointer truncate font-mono text-xs text-amber-800 hover:underline"
              onClick={() => handleAcceptChat(id)}
              title={`Accept chat ${id}`}
            >
              {id}
            </span>
            <button onClick={() => handleEndChat(id)} title="End Chat">
              <FaTrash size={14} className="text-amber-600 hover:text-red-600" />
            </button>
          </li>
        ))}
      </ul>
      <h2 className="mb-2 mt-5 text-sm font-semibold uppercase tracking-wider text-slate-400">
        Active Chats
      </h2>
      <ul className="space-y-2">
        {activeChats.map((chat) => (
          <li
            key={chat.id}
            onClick={() => setSelectedChatId(chat.id)}
            className={`flex items-center justify-between gap-2 rounded-lg border px-3 py-2.5 transition-colors cursor-pointer ${
              selectedChatId === chat.id
                ? "border-indigo-300 bg-indigo-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            }`}
          >
            <span className="min-w-0">
              <span className="block truncate font-mono text-xs text-slate-700">
                {chat.id}
              </span>
              <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                Time Left: {getRemainingTime(chat.expiry)}
              </span>
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEndChat(chat.id);
              }}
              className="rounded-md bg-red-50 p-1.5 text-red-600 hover:bg-red-100"
              title="End Chat"
            >
              <FaTrash size={12} />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  // Chat view
  const renderChatView = () => {
    const activeChat = activeChats.find((chat) => chat.id === selectedChatId);
    if (!activeChat) {
      return (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-slate-400">No active chat selected</p>
        </div>
      );
    }
    return (
      <div className="flex flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
          <div className="flex items-center gap-2">
            {isMobile && (
              <button
                onClick={() => setSelectedChatId(null)}
                className="mr-1 rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-indigo-600"
              >
                <FaArrowLeft size={16} />
              </button>
            )}
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
              <FaStore size={16} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-800">
                Chat with Shopkeeper
              </h2>
              <p className="font-mono text-[11px] text-slate-400">{activeChat.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge tone="warning">Time Left: {getRemainingTime(activeChat.expiry)}</Badge>
            <button
              onClick={() => handleEndChat(activeChat.id)}
              className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:bg-red-100"
            >
              End Chat
            </button>
          </div>
        </header>
        <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-4 scrollbar-thin">
          {activeChat.messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.type === "admin" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  msg.type === "admin"
                    ? "rounded-br-md bg-indigo-600 text-white"
                    : "rounded-bl-md bg-white text-slate-700 shadow-sm border border-slate-200"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 border-t border-slate-200 bg-white p-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="input-base flex-1"
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
          />
          <button
            onClick={handleSendMessage}
            className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm transition-colors hover:bg-indigo-700"
          >
            <FaPaperPlane size={16} />
          </button>
        </div>
      </div>
    );
  };

  const renderMobileView = () => (selectedChatId ? renderChatView() : renderChatList());
  const renderDesktopView = () => (
    <>
      <div className="w-1/3 border-r border-slate-200 bg-white lg:w-80">{renderChatList()}</div>
      <div className="flex-1">{renderChatView()}</div>
    </>
  );

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
          <FaHeadset size={15} />
        </div>
        <h1 className="text-base font-semibold text-slate-800">
          Admin Support (Shopkeepers)
        </h1>
      </div>
      <div className={`flex min-h-0 flex-1 ${isMobile ? "flex-col" : "flex"}`}>
        {isMobile ? renderMobileView() : renderDesktopView()}
      </div>
    </div>
  );
};

export default AdminChat;
