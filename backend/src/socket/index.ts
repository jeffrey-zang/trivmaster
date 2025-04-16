import { Server } from "socket.io";
import { ISocket, Room } from "@/types.ts";
import { setupRoomHandlers } from "./roomHandlers.ts";
import { setupChatHandlers } from "./chatHandlers.ts";
import { setupTeamHandlers } from "./teamHandlers.ts";
import { setupGameHandlers } from "./gameHandlers.ts";
import { setupMemberHandlers } from "./memberHandlers.ts";

export const setupSocketIO = (io: Server) => {
  const rooms: Record<string, Room> = {};

  io.on("connection", (socket: ISocket) => {
    setupRoomHandlers(io, socket, rooms);
    setupChatHandlers(io, socket, rooms);
    setupTeamHandlers(io, socket, rooms);
    setupGameHandlers(io, socket, rooms);
    setupMemberHandlers(io, socket, rooms);
  });

  return { rooms };
};
