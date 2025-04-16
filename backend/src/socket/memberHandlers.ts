import { Server } from "socket.io";
import { ISocket, Room, Team, Member } from "../types.ts";

export const setupMemberHandlers = (
  io: Server,
  socket: ISocket,
  rooms: Record<string, Room>
) => {
  socket.on(
    "member:rename",
    async ({
      roomName,
      oldUserName,
      newUserName,
    }: {
      roomName: string;
      oldUserName: string;
      newUserName: string;
    }) => {
      if (!socket.userName) return;

      const room = rooms[roomName];
      if (!room) return;

      const team = room.teams[socket.teamName!];
      if (!team) return;

      const member = team.members.find(
        (member: Member) => member.userName === oldUserName
      );
      if (!member) return;

      console.log(room.createdBy, socket.userName);
      if (room.createdBy === socket.userName) {
        room.createdBy = newUserName;
      }
      member.userName = newUserName;
      socket.userName = newUserName;

      console.log("User renamed from", oldUserName, "to", newUserName);

      io.to(roomName).emit("room:update", room, {
        userName: newUserName,
        teamName: socket.teamName,
      });
    }
  );
};
