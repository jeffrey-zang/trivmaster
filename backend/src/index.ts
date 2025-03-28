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

      rooms[roomName].chat.unshift(
        `${roomName} has been created by ${userName}`
      );
      rooms[roomName].chat.unshift(`${userName} has joined`);
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
      rooms[roomName].chat.unshift(`${userName} has joined`);
    }

    socket.userName = userName;
    socket.roomName = roomName;

    socket.emit("room:update", rooms[roomName], socket.userName);

    socket.to(roomName).emit("room:update", rooms[roomName]);
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

    rooms[roomName].chat.unshift(`${socket.userName} has left`);

    io.to(roomName).emit("room:update", rooms[roomName]);

    socket.offAny();
  });

  socket.on(
    "chat:send",
    ({ roomName, message }: { roomName: string; message: string }) => {
      if (!(roomName in rooms)) {
        return;
      }

      if (message.trim() === "") {
        return;
      }

      console.log(socket.userName, "sent a message to", roomName);

      rooms[roomName].chat.unshift(`${socket.userName}: ${message}`);

      io.to(roomName).emit("room:update", rooms[roomName]);
    }
  );
});

server.listen(3000, "0.0.0.0", () => {
  console.log(`🚀 Backend server is up and running!`);
});
