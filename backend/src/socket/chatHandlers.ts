import { Server } from "socket.io";
import { ISocket, Room } from "@/types.ts";

export const setupChatHandlers = (
  io: Server,
  socket: ISocket,
  rooms: Record<string, Room>
) => {
  socket.on(
    "chat:send",
    ({ roomName, text }: { roomName: string; text: string }) => {
      if (!(roomName in rooms)) {
        socket.emit("room:error", "Room not found");
        return;
      }

      if (text.trim() === "") {
        return;
      }

      console.log(socket.userName, "sent a message to", roomName);

      rooms[roomName].chat.unshift({
        author: socket.userName,
        team: socket.teamName,
        text: text,
        timestamp: Date.now(),
        tsx: false // Regular chat messages don't use TSX by default
      });

      io.to(roomName).emit("room:update", rooms[roomName], {
        userName: socket.userName,
        teamName: socket.teamName
      });
    }
  );
};
