import { io, type Socket } from "socket.io-client";

import { SOCKET_URL } from "./config";

export type { Socket };

/**
 * Create a Socket.IO client pointed at the ZipMart backend.
 *
 * Callers own the lifecycle — create in an effect, `disconnect()` on cleanup.
 */
export function createSocket(options: Parameters<typeof io>[1] = {}): Socket {
  return io(SOCKET_URL, {
    transports: ["websocket", "polling"],
    ...options,
  });
}

/**
 * A lazily-created socket shared across a single app.
 *
 * Use this when several components need the same connection; use
 * {@link createSocket} when a component needs its own short-lived one.
 */
let sharedSocket: Socket | null = null;

export function getSharedSocket(): Socket {
  if (!sharedSocket || sharedSocket.disconnected) {
    sharedSocket = createSocket({ autoConnect: true });
  }
  return sharedSocket;
}

export function disconnectSharedSocket(): void {
  sharedSocket?.disconnect();
  sharedSocket = null;
}
