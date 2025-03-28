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
  socket.on("join-room", async ({ roomName }: { roomName: string }) => {
    const createRoom = !(roomName in rooms);

    if (createRoom) {
      rooms[roomName] = {
        roomName: roomName,
        questions: [],
        teams: [
          {
            teamName: "Lobby",
            members: [{ userName: "Guest", points: 0, buzzed: false }],
            points: 0
          }
        ],
        currentQuestion: undefined,
        currentBuzzed: undefined,
        currentAnswered: false
      };

      await socket.join(roomName);

      io.in(roomName).emit("chat:message", {
        roomId: roomName,
        author: "Room Master",
        type: "system",
        content: `Room ${roomName} has been created.`
      });

      console.log("Room has been created ", roomName);
    } else {
      rooms[roomName].teams[0].members.push({
        userName: "Guest",
        points: 0,
        buzzed: false
      });

      await socket.join(roomName);

      io.in(roomName).emit("chat:message", {
        roomId: roomName,
        author: "Guest",
        type: "system",
        content: `Guest has joined.`
      });

      console.log("Guest has joined ", roomName);
    }

    socket.userName = "Guest";
    socket.roomName = roomName;

    socket.emit("success", rooms[roomName]);
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log(`🚀 Backend server is up and running!`);
});
