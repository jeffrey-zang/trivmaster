import { Server } from "socket.io";
import { ISocket, Room } from "../types.ts";

export const setupTeamHandlers = (
  io: Server,
  socket: ISocket,
  rooms: Record<string, Room>
) => {
  socket.on(
    "team:add",
    ({
      roomName,
      teamName,
      userName
    }: {
      roomName: string;
      teamName: string;
      userName: string;
    }) => {
      if (!(roomName in rooms)) {
        return;
      }

      rooms[roomName].teams.push({
        teamName: teamName,
        members: [{ userName: userName, points: 0, buzzed: false }],
        points: 0,
        colour: "#" + Math.floor(Math.random() * 16777215).toString(16)
      });

      const oldTeamIndex = rooms[roomName].teams.findIndex((team) =>
        team.members.some((member) => member.userName === userName)
      );
      if (oldTeamIndex !== -1) {
        rooms[roomName].teams[oldTeamIndex].members = rooms[roomName].teams[
          oldTeamIndex
        ].members.filter((member) => member.userName !== userName);
      }

      socket.teamName = teamName;

      rooms[roomName].chat.unshift({
        author: "admin",
        text: `${userName} has added a team: ${teamName}`,
        timestamp: Date.now()
      });
      rooms[roomName].chat.unshift({
        author: "admin",
        text: `${userName} has joined ${teamName}`,
        timestamp: Date.now()
      });
      console.log(userName, "has added a team: ", teamName);
      io.to(roomName).emit("room:update", rooms[roomName], {
        userName: userName,
        teamName: teamName
      });
    }
  );

  socket.on(
    "team:join",
    ({
      roomName,
      teamName,
      userName
    }: {
      roomName: string;
      teamName: string;
      userName: string;
    }) => {
      if (!(roomName in rooms)) {
        return;
      }

      const targetTeamIndex = rooms[roomName].teams.findIndex(
        (team) => team.teamName === teamName
      );

      if (targetTeamIndex === -1) {
        return;
      }

      const oldTeamIndex = rooms[roomName].teams.findIndex((team) =>
        team.members.some((member) => member.userName === userName)
      );

      if (oldTeamIndex !== -1) {
        rooms[roomName].teams[oldTeamIndex].members = rooms[roomName].teams[
          oldTeamIndex
        ].members.filter((member) => member.userName !== userName);
      }

      rooms[roomName].teams[targetTeamIndex].members.push({
        userName: userName,
        points: 0,
        buzzed: false
      });

      socket.teamName = teamName;

      rooms[roomName].chat.unshift({
        author: "admin",
        text: `${userName} has joined ${teamName}`,
        timestamp: Date.now()
      });
      console.log(userName, "has joined team:", teamName);

      io.to(roomName).emit("room:update", rooms[roomName], {
        userName: userName,
        teamName: teamName
      });
    }
  );
};
