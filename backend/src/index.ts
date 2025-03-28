import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { ISocket, Question, Room, RoundSettings } from "./types.ts";

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
        id: roomName,
        members: ["Room Master"],
        owner: "Room Master",
        questions: [],
        team1: [],
        team2: [],
        settings: {
          duration: {
            minutes: 5,
            seconds: 0
          },
          questionDuration: 5
        }
      };

      await socket.join(roomName);

      io.in(roomName).emit("chat:message", {
        roomId: roomName,
        author: "Room Master",
        type: "system",
        content: `Room ${roomName} has been created.`
      });
    } else {
      rooms[roomName].members.push("Guest");

      await socket.join(roomName);

      io.in(roomName).emit("chat:message", {
        roomId: roomName,
        author: "Guest",
        type: "system",
        content: `Guest has joined.`
      });
    }

    socket.username = "Guest";
    socket.roomName = roomName;

    socket.emit(
      "update-data",
      {
        username: "Guest",
        roomName,
        isAdmin: false
      },
      rooms[socket.roomName].questions,
      rooms[socket.roomName].team1,
      rooms[socket.roomName].team2,
      rooms[socket.roomName].settings
    );
  });

  socket.on("chat:message", async (content: string) => {
    io.to(socket.roomId).emit("chat:message", {
      content,
      author: socket.username
    });
  });

  socket.on("questions:add", () => {
    if (rooms[socket.roomId].owner === socket.username) {
      rooms[socket.roomId].questions.push({
        question: "",
        answer: ""
      });
      socket.emit("update-questions", rooms[socket.roomId].questions);
    }
  });

  socket.on("questions:update", (index: number, question: Question) => {
    if (rooms[socket.roomId].owner === socket.username) {
      rooms[socket.roomId].questions[index] = question;
      socket.emit("update-questions", rooms[socket.roomId].questions);
    }
  });

  socket.on("questions:delete", (index: number) => {
    if (rooms[socket.roomId].owner === socket.username) {
      rooms[socket.roomId].questions.splice(index, 1);
      socket.emit("update-questions", rooms[socket.roomId].questions);
    }
  });

  socket.on("teams:change", (newTeam: 1 | 2) => {
    rooms[socket.roomId][`team${newTeam}`].push(socket.username);
    if (socket.currentTeam) {
      const index = rooms[socket.roomId][`team${socket.currentTeam}`].findIndex(
        (uname) => uname === socket.username
      );
      rooms[socket.roomId][`team${socket.currentTeam}`].splice(index, 1);
    }
    socket.currentTeam = newTeam;
    io.in(socket.roomId).emit(
      `update-teams`,
      rooms[socket.roomId].team1,
      rooms[socket.roomId].team2
    );
  });

  socket.on("round-settings:update", (newSettings: RoundSettings) => {
    if (rooms[socket.roomId].owner === socket.username) {
      rooms[socket.roomId].settings = newSettings;
      socket.emit("update-round-settings", rooms[socket.roomId].settings);
    }
  });

  const getWinnerMessage = (room: Room) => {
    if (room.currentRound.team1Score === room.currentRound.team2Score) {
      return "GG to everyone, the game was a tie!";
    }
    if (room.currentRound.team1Score > room.currentRound.team2Score) {
      return "Congrats to Team 1 who won!";
    } else {
      return "Congrats to Team 2 who won!";
    }
  };

  const newQuestion = () => {
    if (!rooms[socket.roomId].currentRound) {
      return;
    }

    const nextQuestion = rooms[socket.roomId].questions.pop();
    console.log(nextQuestion);

    if (!nextQuestion) {
      io.in(socket.roomId).emit("round:end");
      io.in(socket.roomId).emit("chat:message", {
        type: "system",
        content: `Wow, all of the questions have been played! ${getWinnerMessage(
          rooms[socket.roomId]
        )}`
      });
      delete rooms[socket.roomId].currentRound;
    } else {
      io.in(socket.roomId).emit("round:new-question", nextQuestion.question);
      rooms[socket.roomId].currentRound.currentQuestion = nextQuestion;
      rooms[socket.roomId].currentRound.currentAnswered = false;

      setTimeout(() => {
        if (!rooms[socket.roomId].currentRound.currentAnswered) {
          io.emit(
            "round:answered",
            undefined,
            nextQuestion.answer.split(/\s+\s/)
          );
          setTimeout(newQuestion, 2000);
        }
      }, rooms[socket.roomId].settings.questionDuration * 1000);
    }
  };

  socket.on("round:start", () => {
    if (rooms[socket.roomId].owner === socket.username) {
      const duration =
        rooms[socket.roomId].settings.duration.minutes * 60000 +
        rooms[socket.roomId].settings.duration.seconds * 1000;

      rooms[socket.roomId].currentRound = {
        dateFinished: new Date(Date.now() + duration),
        inProgress: true,
        team1Score: 0,
        team2Score: 0,
        currentAnswered: false
      };

      io.in(socket.roomId).emit(
        "round:start",
        rooms[socket.roomId].currentRound
      );
      io.in(socket.roomId).emit("chat:message", {
        type: "system",
        content: `A new round is starting!`
      });

      setTimeout(() => {
        if (rooms[socket.roomId].currentRound) {
          io.in(socket.roomId).emit("round:end");
          io.in(socket.roomId).emit("chat:message", {
            type: "system",
            content: `Time's up, the round has finished! ${getWinnerMessage(
              rooms[socket.roomId]
            )}`
          });
          delete rooms[socket.roomId].currentRound;
        }
      }, duration);

      newQuestion();
    }
  });

  socket.on("round:answer", (answer: string) => {
    const answers =
      rooms[socket.roomId].currentRound.currentQuestion.answer.split(/\s,\s/);
    answers.forEach((potentialAnswer) => {
      if (answer === potentialAnswer) {
        rooms[socket.roomId].currentRound.currentAnswered = true;
        if (rooms[socket.roomId].team1.includes(socket.username)) {
          rooms[socket.roomId].currentRound.team1Score += 1;
          io.emit("round:answered", socket.username, answers, 1);
        } else {
          rooms[socket.roomId].currentRound.team2Score += 1;
          io.emit("round:answered", socket.username, answers, 2);
        }
        setTimeout(newQuestion, 2000);
      }
    });
  });

  socket.on("disconnect", () => {
    io.in(socket.roomId).emit("chat:message", {
      roomId: socket.roomId,
      author: socket.username,
      type: "system",
      content: `${socket.username} has left.`
    });

    if (rooms[socket.roomId]) {
      if (socket.id === rooms[socket.roomId].owner) {
        io.in(socket.roomId).emit("error:room-deleted");
        io.socketsLeave(socket.roomId);
        delete rooms[socket.roomId];
      } else {
        const index = rooms[socket.roomId].members.findIndex(
          (uname) => uname === socket.username
        );
        rooms[socket.roomId].members.splice(index, 1);
      }
    }
  });
});

server.listen(3000, "0.0.0.0", () => {
  console.log(`🚀 Backend server is up and running!`);
});
