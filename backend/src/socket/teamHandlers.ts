import { Server } from "socket.io";
import { ISocket, Room, Team, Member } from "@/types.ts";
import { getColorWithOpacity } from "../utils.ts";

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
  "slate",
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
      userName,
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

      const teamColour = colours[Math.floor(Math.random() * colours.length)];

      rooms[roomName].teams[teamName] = {
        teamName: teamName,
        members: [{ userName: userName, points: 0, buzzed: false }],
        points: 0,
        colour: teamColour,
      };
      socket.teamName = teamName;

      rooms[roomName].system.unshift({
        author: "admin",
        text: `<span>${userName} added a team: <span class="font-semibold" style="background-color: ${getColorWithOpacity(
          teamColour
        )}">${teamName}</span></span>`,
        timestamp: Date.now(),
        tsx: true,
      });
      rooms[roomName].system.unshift({
        author: "admin",
        text: `<span>${userName} joined <span class="font-semibold" style="background-color: ${getColorWithOpacity(
          teamColour
        )}">${teamName}</span></span>`,
        timestamp: Date.now(),
        tsx: true,
      });
      console.log(userName, "added a team:", teamName);
      console.log(userName, "joined team:", teamName);

      io.to(roomName).emit("room:update", rooms[roomName]);
    }
  );

  socket.on(
    "team:join",
    ({
      roomName,
      teamName,
      userName,
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
        buzzed: false,
      });

      socket.teamName = teamName;

      const teamColour = rooms[roomName].teams[teamName].colour;

      rooms[roomName].system.unshift({
        author: "admin",
        text: `<span>${userName} joined <span class="bg-${teamColour}-100 font-semibold">${teamName}</span></span>`,
        timestamp: Date.now(),
        tsx: true,
      });
      console.log(userName, "joined team:", teamName);

      io.to(roomName).emit("room:update", rooms[roomName], {
        userName: userName,
        teamName: teamName,
      });
    }
  );
};
