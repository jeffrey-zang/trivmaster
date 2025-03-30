import { Server } from "socket.io";
import { ISocket, Room } from "../types.ts";

const allQuestions = [
  {
    q: `What word is a unit of measurement for magnetic field strength and is also the
name of Elon Musk's car company?`,
    a: "Tesla",
    type: "blitz",
    value: 10
  }
];

export const setupGameHandlers = (
  io: Server,
  socket: ISocket,
  rooms: Record<string, Room>
) => {
  socket.on("game:start", async ({ roomName }: { roomName: string }) => {
    const room = rooms[roomName];

    console.log("Starting game");

    if (!room) {
      socket.emit("room:error", "Room not found");
      return;
    }

    room.currentQuestion = {
      q: "",
      a: "",
      type: "",
      value: 0
    };
    room.currentBuzzed = undefined;
    room.currentAnswered = false;

    const question =
      allQuestions[Math.floor(Math.random() * allQuestions.length)];

    let cumulativeDelay = 0;
    for (let word of question.q.split(" ")) {
      let wordDelay = Math.log(word.length) + 1;
      console.log(wordDelay);

      if (
        word.endsWith(".") ||
        word.endsWith(",") ||
        word.endsWith("!") ||
        word.endsWith("?")
      ) {
        wordDelay += 1;
      }

      wordDelay = wordDelay * room.config.readingSpeed;
      cumulativeDelay += wordDelay;

      setTimeout(() => {
        if (room.currentQuestion) {
          room.currentQuestion.q += word + " ";
          io.to(roomName).emit("room:update", room);
        }
      }, cumulativeDelay * 100);
    }

    room.currentQuestion = {
      q: room.currentQuestion.q,
      a: question.a,
      type: question.type,
      value: question.value
    };

    io.to(roomName).emit("room:update", room);
  });

  socket.on("game:buzz", ({ roomName }: { roomName: string }) => {
    const room = rooms[roomName];

    if (!room) {
      socket.emit("room:error", "Room not found");
      return;
    }

    if (room.state !== "reading") {
      socket.emit("room:error", "Game not in reading state");
      return;
    }

    room.currentBuzzed = socket.id;
    io.to(roomName).emit("room:update", room);
  });
};
