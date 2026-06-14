"use client";

import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

function getSocketBaseUrl() {
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api";
  return apiBase.replace(/\/api\/?$/, "");
}

export function getThreadSocket(token: string | null) {
  if (!socket) {
    socket = io(`${getSocketBaseUrl()}/threads`, {
      auth: token ? { token } : undefined,
      autoConnect: false,
    });
  }

  if (token) {
    socket.auth = { token };
  }

  return socket;
}

export function disconnectThreadSocket() {
  if (!socket) return;
  socket.disconnect();
}
