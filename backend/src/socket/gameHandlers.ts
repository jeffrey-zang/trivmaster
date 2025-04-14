import { Server } from "socket.io";
import { ISocket, Room } from "../types.ts";

const allQuestions = [
  {
    q: `What word is a unit of measurement for magnetic field strength and is also the
name of Elon Musk's car company?`,
    a: "Tesla",
    type: "blitz",
    value: 10,
  },
];

const pauseManager = {
  timer: {} as Record<string, NodeJS.Timeout | null>,
  wordQueue: {} as Record<string, { word: string; delay: number }[]>,
  isPaused: {} as Record<string, boolean>,
  lastProcessedIndex: {} as Record<string, number>,

  initRoom(roomName: string) {
    this.timer[roomName] = null;
    this.wordQueue[roomName] = [];
    this.isPaused[roomName] = false;
    this.lastProcessedIndex[roomName] = -1;
  },

  nextWord(roomName: string, room: Room, io: Server) {
    if (
      this.lastProcessedIndex[roomName] + 1 ==
      this.wordQueue[roomName].length
    ) {
      room.lastEventTimestamp = Date.now();
      io.to(roomName).emit("room:update", room);
      this.timer[roomName] = setTimeout(() => {
        room.state = "showAnswer";
        room.chat.unshift({
          author: "admin",
          text: `<span>Time! The correct answer was: "${room.currentQuestion?.a}"</span>`,
          timestamp: Date.now(),
          tsx: true,
        });
        io.to(roomName).emit("room:update", room);
      }, room.config.buzzTime);
      return;
    }

    if (!this.wordQueue[roomName] || this.isPaused[roomName]) return;

    const remainingWords = this.wordQueue[roomName].slice(
      this.lastProcessedIndex[roomName] + 1
    );

    const { word, delay } = remainingWords[0];
    if (room.currentQuestion && !this.isPaused[roomName]) {
      room.currentQuestion.q += word + " ";
      io.to(roomName).emit("room:update", room);
      this.lastProcessedIndex[roomName] = this.lastProcessedIndex[roomName] + 1;
    }

    this.timer[roomName] = setTimeout(
      () => this.nextWord(roomName, room, io),
      delay * 100
    );
  },
};

export const setupGameHandlers = (
  io: Server,
  socket: ISocket,
  rooms: Record<string, Room>
) => {
  socket.on(
    "game:start",
    async ({ roomName, userName }: { roomName: string; userName: string }) => {
      const room = rooms[roomName];

      console.log("Attempting to start game in Room " + roomName);

      if (!room) {
        socket.emit("room:error", "Room not found");
        console.log("Error, Room " + roomName + " was not found");
        return;
      }

      if (
        room.teams["Lobby"].members.filter(
          (member) => member.userName === userName
        ).length !== 0
      ) {
        socket.emit("room:error", "Lobby members cannot start games");
        console.log("A Lobby member attempted to start a game in " + roomName);
        return;
      }

      room.currentQuestion = {
        q: "",
        a: "",
        type: "",
        value: 0,
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

      pauseManager.nextWord(roomName, room, io);

      room.currentQuestion = {
        q: room.currentQuestion.q,
        a: question.a,
        type: question.type,
        value: question.value,
      };

      rooms[roomName].system.unshift({
        author: "admin",
        text: `<span>${userName} started the game</span>`,
        timestamp: Date.now(),
        tsx: true,
      });

      io.to(roomName).emit("room:update", room);
    }
  );

  socket.on(
    "game:next",
    ({ roomName, userName }: { roomName: string; userName: string }) => {
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

      if (
        room.teams["Lobby"].members.filter(
          (member) => member.userName === userName
        ).length !== 0
      ) {
        socket.emit(
          "room:error",
          "Lobby members cannot advance to next question"
        );
        console.log(
          "A Lobby member attempted to advance to next question in " + roomName
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
              delay: wordDelay,
            });
          });

          pauseManager.nextWord(roomName, room, io);

          rooms[roomName].system.unshift({
            author: "admin",
            text: `<span>${userName} began the next question</span>`,
            timestamp: Date.now(),
            tsx: true,
          });

          io.to(roomName).emit("room:update", room);
        }
      } else {
        room.state = "gameOver";
        io.to(roomName).emit("room:update", room);
      }
    }
  );

  socket.on(
    "game:pause",
    ({ roomName, userName }: { roomName: string; userName: string }) => {
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

      if (
        room.teams["Lobby"].members.filter(
          (member) => member.userName === userName
        ).length !== 0
      ) {
        socket.emit("room:error", "Lobby members cannot pause");
        console.log("A Lobby member attempted to pause in " + roomName);
        return;
      }

      if (pauseManager.isPaused[roomName]) {
        pauseManager.isPaused[roomName] = false;
        pauseManager.nextWord(roomName, room, io);
        console.log("Game resumed");
      } else {
        pauseManager.isPaused[roomName] = true;
        const buzzTimer = pauseManager.timer[roomName];
        if (buzzTimer) clearTimeout(buzzTimer);
        console.log("Game paused");
      }

      io.to(roomName).emit("room:update", {
        ...room,
        isPaused: pauseManager.isPaused[roomName],
      });
    }
  );

  socket.on(
    "game:buzz",
    ({ roomName, userName }: { roomName: string; userName: string }) => {
      const room = rooms[roomName];

      if (!room) {
        socket.emit("room:error", "Room not found");
        return;
      }

      if (room.state !== "reading") {
        socket.emit("room:error", "Game not in reading state");
        return;
      }

      if (
        room.teams["Lobby"].members.filter(
          (member) => member.userName === userName
        ).length !== 0
      ) {
        socket.emit("room:error", "Lobby members cannot buzz");
        console.log("A Lobby member attempted to buzz in " + roomName);
        return;
      }

      if (socket.teamName && room.teamsAttempted?.includes(socket.teamName)) {
        socket.emit(
          "room:error",
          "Your team has already attempted this question"
        );
        return;
      }

      if (
        Date.now() - room.lastEventTimestamp > room.config.buzzTime &&
        pauseManager.lastProcessedIndex[roomName] + 1 ==
          pauseManager.wordQueue[roomName].length
      ) {
        socket.emit("room:error", "Timed out before reaching the server");
        return;
      }

      if (pauseManager.timer[roomName])
        clearTimeout(pauseManager.timer[roomName]);

      pauseManager.isPaused[roomName] = true;

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
      room.lastEventTimestamp = Date.now();

      pauseManager.timer[roomName] = setTimeout(() => {
        room.chat.unshift({
          author: "admin",
          text: `<span>${socket.userName} took too long to answer</span>`,
          timestamp: Date.now(),
          tsx: true,
        });

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
            tsx: true,
          });
        } else {
          room.currentBuzzed = undefined;
          room.state = "reading";

          setTimeout(() => {
            if (roomName in rooms) {
              pauseManager.isPaused[roomName] = false;
              pauseManager.nextWord(roomName, room, io);
              io.to(roomName).emit("room:update", room);
            }
          }, 1500);
        }
        io.to(roomName).emit("room:update", room);
      }, room.config.answerTime);
      io.to(roomName).emit("room:update", room);
    }
  );

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

      if (Date.now() - room.lastEventTimestamp > room.config.answerTime) {
        socket.emit("room:error", "Timed out before reaching the server");
        return;
      }

      if (pauseManager.timer[roomName])
        clearTimeout(pauseManager.timer[roomName]);

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

      room.system.unshift({
        author: "admin",
        text: `<span>${socket.userName} answered: "${answer}" - ${
          isCorrect ? "Correct!" : "Incorrect!"
        }</span>`,
        timestamp: Date.now(),
        tsx: true,
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
          room.system.unshift({
            author: "admin",
            text: `<span>The correct answer was: "${room.currentQuestion?.a}"</span>`,
            timestamp: Date.now(),
            tsx: true,
          });
        } else {
          room.currentBuzzed = undefined;
          room.state = "reading";

          setTimeout(() => {
            if (roomName in rooms) {
              pauseManager.isPaused[roomName] = false;
              pauseManager.nextWord(roomName, room, io);
              io.to(roomName).emit("room:update", room);
            }
          }, 1500);
        }
      }

      io.to(roomName).emit("room:update", room);
    }
  );
};
