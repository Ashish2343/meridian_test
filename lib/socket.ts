import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;
// 
const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "https://meridian-backend-test-1.onrender.com/";

export const getSocket = () => {
  if (!socket) {
    socket = io(SOCKET_SERVER_URL, {
      autoConnect: false,
      transports: ["websocket"], // optional but faster
    });
  }
  return socket;
};