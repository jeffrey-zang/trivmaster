import { io, Socket } from "socket.io-client";

interface ISocket extends Socket {
  userName?: string;
  teamName?: string;
  roomName?: string;
}

const socket: ISocket = io(import.meta.env.VITE_PUBLIC_SOCKET_URL);

export default socket;
