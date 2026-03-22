import { io, type Socket } from "socket.io-client";
import { getBackendUrl } from "./apiBase";

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const url = getBackendUrl() || undefined;
    socket = io(url, {
      path: "/socket.io",
      transports: ["websocket", "polling"],
    });
  }
  return socket;
}
