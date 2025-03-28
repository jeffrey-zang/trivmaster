import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { ISocket, Room } from "./types.ts";

dotenv.config();

const app: Express = express();

app.get("/", (req: Request, res: Response) => {
  res.status(200).send("Welcome to the Trivmaster backend!");
});
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

const rooms: Record<string, Room> = {};

io.on("connection", (socket: ISocket) => {
  socket.on("room:join", async ({ roomName }: { roomName: string }) => {
    const createRoom = !(roomName in rooms);

    let userName = "Guest";
    if (createRoom) {
      rooms[roomName] = {
        roomName: roomName,
        questions: [],
        teams: [
          {
            teamName: "Lobby",
            members: [{ userName: userName, points: 0, buzzed: false }],
            points: 0
          }
        ],
        currentQuestion: undefined,
        currentBuzzed: undefined,
        currentAnswered: false,
        chat: [],
        createdBy: userName
      };

      await socket.join(roomName);

      console.log(roomName, "has been created by", userName);
      console.log(userName, "has joined", roomName);

      rooms[roomName].chat.unshift({
        author: "admin",
        text: `${roomName} has been created by ${userName}`,
        timestamp: Date.now()
      });
      rooms[roomName].chat.unshift({
        author: "admin",
        text: `${userName} has joined`,
        timestamp: Date.now()
      });
    } else {
      const existingMembers = rooms[roomName].teams.flatMap(
        (team) => team.members
      );
      const existingMemberNames = existingMembers.map(
        (member) => member.userName
      );

      let i = 1;
      while (existingMemberNames.includes(userName)) {
        userName = `Guest ${i}`;
        i++;
      }

      rooms[roomName].teams[0].members.push({
        userName: userName,
        points: 0,
        buzzed: false
      });

      await socket.join(roomName);

      console.log(userName, "has joined", roomName);
      rooms[roomName].chat.unshift({
        author: "admin",
        text: `${userName} has joined`,
        timestamp: Date.now()
      });
    }

    socket.userName = userName;
    socket.teamName = "Lobby";

    socket.emit("room:update", rooms[roomName], {
      userName: userName,
      teamName: "Lobby"
    });

    socket.to(roomName).emit("room:update", rooms[roomName], {
      userName: userName,
      teamName: "Lobby"
    });
  });

  socket.on("room:leave", async ({ roomName }: { roomName: string }) => {
    await socket.leave(roomName);

    if (!(roomName in rooms)) {
      return;
    }

    const teamIndex = rooms[roomName].teams.findIndex((team) =>
      team.members.some((member) => member.userName === socket.userName)
    );
    if (teamIndex !== -1) {
      rooms[roomName].teams[teamIndex].members = rooms[roomName].teams[
        teamIndex
      ].members.filter((member) => member.userName !== socket.userName);

      if (rooms[roomName].teams[teamIndex].members.length === 0) {
        rooms[roomName].teams.splice(teamIndex, 1);
      }
    }

    console.log(socket.userName, "has left", roomName);

    if (rooms[roomName].teams) {
      if (rooms[roomName].teams.every((team) => team.members.length === 0)) {
        delete rooms[roomName];
        console.log(roomName, "has been deleted");
        return;
      }
    }

    rooms[roomName].chat.unshift({
      author: "admin",
      text: `${socket.userName} has left`,
      timestamp: Date.now()
    });

    io.to(roomName).emit("room:update", rooms[roomName], {
      userName: socket.userName,
      teamName: socket.teamName
    });

    socket.offAny();
  });

  socket.on(
    "chat:send",
    ({ roomName, text }: { roomName: string; text: string }) => {
      if (!(roomName in rooms)) {
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
        timestamp: Date.now()
      });

      io.to(roomName).emit("room:update", rooms[roomName], {
        userName: socket.userName,
        teamName: socket.teamName
      });
    }
  );

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
        points: 0
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
});

server.listen(3000, "0.0.0.0", () => {
  console.log(`🚀 Backend server is up and running!`);
});
