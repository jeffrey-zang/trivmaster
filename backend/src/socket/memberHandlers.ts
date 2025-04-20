import { Server } from "socket.io";
import { ISocket, Room, Member } from "./types.ts";
import { getColorWithOpacity } from "@/utils/getColorWithOpacity.ts";
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

      for (let i = 0; i < room.chat.length; i++) {
        const message = room.chat[i];
        if (message.author === oldUserName) {
          message.author = newUserName;
        }
      }
      member.userName = newUserName;
      socket.userName = newUserName;

      console.log("User renamed from", oldUserName, "to", newUserName);

      let teamColour: string = "";
      Object.keys(room.teams).map((t) => {
        const f = room.teams[t].members.filter(
          (member) => member.userName === socket.userName
        );

        if (f.length !== 0) {
          teamColour = room.teams[t].colour;
        }
      });

      room.system.unshift({
        author: "admin",
        text: `<span><span class="font-semibold" style="background-color: ${getColorWithOpacity(
          teamColour
        )}">${oldUserName}</span> renamed themselves to <span class="font-semibold" style="background-color: ${getColorWithOpacity(
          teamColour
        )}">${socket.userName}</span></span>`,
        timestamp: Date.now(),
        tsx: true,
      });

      io.to(roomName).emit("room:update", room, {
        userName: newUserName,
        teamName: socket.teamName,
      });
    }
  );
};
