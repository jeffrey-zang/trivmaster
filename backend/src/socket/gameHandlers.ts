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

const pauseManager = {
  timers: {} as Record<string, NodeJS.Timeout[]>,
  wordQueue: {} as Record<string, { word: string; delay: number }[]>,
  isPaused: {} as Record<string, boolean>,
  lastProcessedIndex: {} as Record<string, number>,

  clearTimers(roomName: string) {
    if (this.timers[roomName]) {
      this.timers[roomName].forEach((timer) => clearTimeout(timer));
      this.timers[roomName] = [];
    }
  },

  initRoom(roomName: string) {
    this.timers[roomName] = [];
    this.wordQueue[roomName] = [];
    this.isPaused[roomName] = false;
    this.lastProcessedIndex[roomName] = -1;
  },

  processWords(roomName: string, room: Room, io: Server) {
    if (!this.wordQueue[roomName] || this.isPaused[roomName]) return;

    const remainingWords = this.wordQueue[roomName].slice(
      this.lastProcessedIndex[roomName] + 1
    );

    let cumulativeDelay = 0;
    remainingWords.forEach((item, index) => {
      const { word, delay } = item;
      cumulativeDelay += delay;

      const timer = setTimeout(() => {
        if (room.currentQuestion && !this.isPaused[roomName]) {
          room.currentQuestion.q += word + " ";
          io.to(roomName).emit("room:update", room);
          this.lastProcessedIndex[roomName] =
            this.lastProcessedIndex[roomName] + 1;
        }
      }, cumulativeDelay * 100);

      this.timers[roomName].push(timer);
    });
  }
};

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
    room.state = "reading";
    room.teamsAttempted = [];

    pauseManager.initRoom(roomName);

    const question =
      allQuestions[Math.floor(Math.random() * allQuestions.length)];

    const words = question.q.split(" ");
    words.forEach((word) => {
      let wordDelay = Math.log(word.length) + 1;

      if (
        word.endsWith(".") ||
        word.endsWith(",") ||
        word.endsWith("!") ||
        word.endsWith("?")
      ) {
        wordDelay += 1;
      }

      wordDelay = wordDelay * room.config.readingSpeed;
      pauseManager.wordQueue[roomName].push({ word, delay: wordDelay });
    });

    pauseManager.processWords(roomName, room, io);

    room.currentQuestion = {
      q: room.currentQuestion.q,
      a: question.a,
      type: question.type,
      value: question.value
    };

    io.to(roomName).emit("room:update", room);
  });

  socket.on("game:next", ({ roomName }: { roomName: string }) => {
    const room = rooms[roomName];

    if (!room) {
      socket.emit("room:error", "Room not found");
      return;
    }

    if (!["waiting", "showAnswer"].includes(room.state)) {
      socket.emit(
        "room:error",
        "Cannot advance to next question in current state"
      );
      return;
    }

    if (room.questions.length > 0) {
      const nextQuestion = room.questions.shift();

      if (nextQuestion) {
        room.currentQuestion = nextQuestion;
        room.currentBuzzed = undefined;
        room.currentAnswered = false;
        room.state = "reading";
        room.teamsAttempted = [];

        pauseManager.initRoom(roomName);

        const words = nextQuestion.q.split(" ");
        words.forEach((word) => {
          let wordDelay = Math.log(word.length) + 1;

          if (
            word.endsWith(".") ||
            word.endsWith(",") ||
            word.endsWith("!") ||
            word.endsWith("?")
          ) {
            wordDelay += 1;
          }

          wordDelay = wordDelay * room.config.readingSpeed;
          pauseManager.wordQueue[roomName].push({
            word,
            delay: wordDelay
          });
        });

        pauseManager.processWords(roomName, room, io);

        io.to(roomName).emit("room:update", room);
      }
    } else {
      room.state = "gameOver";
      io.to(roomName).emit("room:update", room);
    }
  });

  socket.on("game:pause", ({ roomName }: { roomName: string }) => {
    const room = rooms[roomName];

    console.log("Pausing game");

    if (!room) {
      socket.emit("room:error", "Room not found");
      return;
    }

    if (room.state !== "reading") {
      socket.emit("room:error", "Game not in reading state");
      return;
    }

    if (pauseManager.isPaused[roomName]) {
      pauseManager.isPaused[roomName] = false;
      pauseManager.clearTimers(roomName);
      pauseManager.processWords(roomName, room, io);
      console.log("Game resumed");
    } else {
      pauseManager.isPaused[roomName] = true;
      pauseManager.clearTimers(roomName);
      console.log("Game paused");
    }

    io.to(roomName).emit("room:update", {
      ...room,
      isPaused: pauseManager.isPaused[roomName]
    });
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

    if (socket.teamName && room.teamsAttempted?.includes(socket.teamName)) {
      socket.emit(
        "room:error",
        "Your team has already attempted this question"
      );
      return;
    }

    pauseManager.isPaused[roomName] = true;
    pauseManager.clearTimers(roomName);

    if (socket.teamName && room.teams[socket.teamName]) {
      const userIndex = room.teams[socket.teamName].members.findIndex(
        (member) => member.userName === socket.userName
      );

      if (userIndex !== -1) {
        room.teams[socket.teamName].members[userIndex].buzzed = true;
      }

      if (!room.teamsAttempted) {
        room.teamsAttempted = [];
      }
      room.teamsAttempted.push(socket.teamName);
    }

    room.currentBuzzed = socket.id;
    room.state = "buzzing";
    io.to(roomName).emit("room:update", room);
  });

  socket.on(
    "game:answer",
    ({ roomName, answer }: { roomName: string; answer: string }) => {
      const room = rooms[roomName];

      if (!room) {
        socket.emit("room:error", "Room not found");
        return;
      }

      if (room.state !== "buzzing") {
        socket.emit("room:error", "Game not in buzzing state");
        return;
      }

      if (room.currentBuzzed !== socket.id) {
        socket.emit("room:error", "You are not the current buzzer");
        return;
      }

      if (socket.teamName && room.teams[socket.teamName]) {
        const userIndex = room.teams[socket.teamName].members.findIndex(
          (member) => member.userName === socket.userName
        );

        if (userIndex !== -1) {
          room.teams[socket.teamName].members[userIndex].buzzed = false;
        }
      }

      const isCorrect =
        room.currentQuestion?.a.toLowerCase() === answer.toLowerCase();

      room.chat.unshift({
        author: "admin",
        text: `<span>${socket.userName} answered: "${answer}" - ${
          isCorrect ? "Correct!" : "Incorrect!"
        }</span>`,
        timestamp: Date.now(),
        tsx: true
      });

      if (isCorrect) {
        if (socket.teamName && room.teams[socket.teamName]) {
          room.teams[socket.teamName].points +=
            room.currentQuestion?.value || 0;

          const userIndex = room.teams[socket.teamName].members.findIndex(
            (member) => member.userName === socket.userName
          );

          if (userIndex !== -1) {
            room.teams[socket.teamName].members[userIndex].points +=
              room.currentQuestion?.value || 0;
          }
        }

        room.currentAnswered = true;
        room.state = "waiting";
      } else {
        const teamNames = Object.keys(room.teams).filter(
          (name) => name !== "Lobby"
        );
        const allTeamsAttempted =
          teamNames.length > 0 &&
          teamNames.every((team) => room.teamsAttempted?.includes(team));

        if (allTeamsAttempted || teamNames.length <= 1) {
          room.state = "showAnswer";
          room.chat.unshift({
            author: "admin",
            text: `<span>The correct answer was: "${room.currentQuestion?.a}"</span>`,
            timestamp: Date.now(),
            tsx: true
          });
        } else {
          room.currentBuzzed = undefined;
          room.state = "reading";

          setTimeout(() => {
            if (roomName in rooms) {
              pauseManager.isPaused[roomName] = false;
              pauseManager.processWords(roomName, room, io);
              io.to(roomName).emit("room:update", room);
            }
          }, 1500);
        }
      }

      io.to(roomName).emit("room:update", room);
    }
  );
};
