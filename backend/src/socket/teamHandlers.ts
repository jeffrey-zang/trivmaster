import { Server } from "socket.io";
import { ISocket, Room, Team, Member } from "../types.ts";

const colours = [
  "red",
  "orange",
  "amber",
  "yellow",
  "lime",
  "green",
  "emerald",
  "teal",
  "cyan",
  "sky",
  "blue",
  "indigo",
  "violet",
  "purple",
  "fuchsia",
  "pink",
  "rose",
  "gray",
  "slate"
];

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

      Object.values(rooms[roomName].teams).forEach((team: Team) => {
        team.members = team.members.filter(
          (member: Member) => member.userName !== userName
        );
      });

      rooms[roomName].teams[teamName] = {
        teamName: teamName,
        members: [{ userName: userName, points: 0, buzzed: false }],
        points: 0,
        colour: colours[Math.floor(Math.random() * colours.length)]
      };

      console.log("Team added:", rooms[roomName].teams);

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
      console.log(userName, "has added a team:", teamName);
      console.log(userName, "has joined team:", teamName);

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

      if (!(teamName in rooms[roomName].teams)) {
        return;
      }

      Object.values(rooms[roomName].teams).forEach((team: Team) => {
        team.members = team.members.filter(
          (member: Member) => member.userName !== userName
        );
      });

      rooms[roomName].teams[teamName].members.push({
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
