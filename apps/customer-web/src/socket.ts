import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@zipmart/shared";

const URL = SOCKET_URL;

const socket: Socket = io(URL, {
  withCredentials: true,
  extraHeaders: {},
});

export default socket;
