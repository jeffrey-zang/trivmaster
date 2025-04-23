import { Server } from "socket.io";
import { Answer, ISocket, Room } from "./types.ts";
import { getColorWithOpacity } from "@/utils/getColorWithOpacity.ts";
import { allQuestions } from "../index.ts";
import {
  AnswerRow,
  PackRow,
  QuestionRow,
  SectionRow,
} from "@/supabase/types.ts";
import { validateAnswer } from "@/utils/validateAnswer.ts";

const pauseManager = {
  timer: {} as Record<string, NodeJS.Timeout | null>,
  wordQueue: {} as Record<string, { word: string; delay: number }[]>,
  isPaused: {} as Record<string, boolean>,
  lastProcessedIndex: {} as Record<string, number>,

  initRoom(roomName: string) {
    if (this.timer[roomName]) {
      clearTimeout(this.timer[roomName]);
    }
    this.timer[roomName] = null;
    this.wordQueue[roomName] = [];
    this.isPaused[roomName] = false;
    this.lastProcessedIndex[roomName] = -1;
  },

  nextWord(roomName: string, room: Room, io: Server) {
    if (!this.wordQueue[roomName] || this.isPaused[roomName]) {
      return;
    }

    if (
      this.lastProcessedIndex[roomName] + 1 ==
      this.wordQueue[roomName].length
    ) {
      room.lastEventTimestamp = Date.now();
      io.to(roomName).emit("room:update", room);

      if (this.timer[roomName]) {
        clearTimeout(this.timer[roomName]);
      }

      this.timer[roomName] = setTimeout(() => {
        room.state = "showAnswer";
        room.system.unshift({
          author: "admin",
          text: `<span>Time! The correct answer was: <span class="font-semibold">${room.currentQuestion?.a
            .map((a) => a.text)
            .join(" OR ")}</span></span>`,
          timestamp: Date.now(),
          tsx: true,
        });
        io.to(roomName).emit("room:update", room);
      }, room.config.buzzTime);
      return;
    }

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
        a: [],
        type: "",
        value: 0,
      };
      room.currentBuzzed = undefined;
      room.currentAnswered = false;
      room.state = "reading";
      room.teamsAttempted = [];

      pauseManager.initRoom(roomName);

      const pack: PackRow =
        allQuestions[Math.floor(Math.random() * allQuestions.length)];

      let section: SectionRow =
        pack.sections[Math.floor(Math.random() * pack.sections.length)];
      while (section.title === "Jackpot" || section.title === "Streak") {
        section =
          pack.sections[Math.floor(Math.random() * pack.sections.length)];
      }

      const question: QuestionRow =
        section.questions[Math.floor(Math.random() * section.questions.length)];

      const words = question.question.split(" ");
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
        a: question.answers.map((answer: any) => answer),
      };
      room.questions = [
        {
          q: room.currentQuestion.q,
          a: question.answers.map((answer: any) => answer),
        },
      ];

      let teamColour: string = "";
      Object.keys(room.teams).map((t) => {
        const f = room.teams[t].members.filter(
          (member) => member.userName === userName
        );

        if (f.length !== 0) {
          teamColour = room.teams[t].colour;
        }
      });

      rooms[roomName].system.unshift({
        author: "admin",
        text: `<span><span class="font-semibold" style="background-color: ${getColorWithOpacity(
          teamColour
        )}">${userName}</span> started the game</span>`,
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

      console.log("Next question");
      if (!room) {
        socket.emit("room:error", "Room not found");
        console.log("Room not found");
        return;
      }

      if (!["waiting", "showAnswer"].includes(room.state)) {
        socket.emit(
          "room:error",
          "Cannot advance to next question in current state"
        );
        console.log("Cannot advance to next question in current state");
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

      console.log("Next question", room.questions);
      const pack: PackRow =
        allQuestions[Math.floor(Math.random() * allQuestions.length)];

      let section: SectionRow =
        pack.sections[Math.floor(Math.random() * pack.sections.length)];
      while (section.title === "Jackpot" || section.title === "Streak") {
        section =
          pack.sections[Math.floor(Math.random() * pack.sections.length)];
      }

      const nextQuestion: QuestionRow =
        section.questions[Math.floor(Math.random() * section.questions.length)];

      if (nextQuestion) {
        console.log("Next question found");
        room.currentQuestion = {
          q: "",
          a: nextQuestion.answers.map((answer: any) => answer),
        };
        room.currentBuzzed = undefined;
        room.currentAnswered = false;
        room.state = "reading";
        room.teamsAttempted = [];

        pauseManager.initRoom(roomName);
        pauseManager.isPaused[roomName] = false;

        const words = nextQuestion.question.split(" ");
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

        let teamColour: string = "";
        Object.keys(room.teams).map((t) => {
          const f = room.teams[t].members.filter(
            (member) => member.userName === userName
          );

          if (f.length !== 0) {
            teamColour = room.teams[t].colour;
          }
        });

        rooms[roomName].system.unshift({
          author: "admin",
          text: `<span><span class="font-semibold" style="background-color: ${getColorWithOpacity(
            teamColour
          )}">${userName}</span> began the next question</span>`,
          timestamp: Date.now(),
          tsx: true,
        });

        io.to(roomName).emit("room:update", room);
      }
    }
  );

  socket.on(
    "game:clear",
    ({ roomName, userName }: { roomName: string; userName: string }) => {
      const room = rooms[roomName];

      console.log("Clearing game");

      if (!room) {
        socket.emit("room:error", "Room not found");
        return;
      }

      room.questions = [];
      room.currentQuestion = undefined;
      room.system = [];
      room.teamsAttempted = [];
      room.state = "waiting";

      Object.keys(room.teams).map((team) => {
        room.teams[team].points = 0;
        room.teams[team].members.map((member) => {
          member.points = 0;
        });
      });

      let teamColour: string = "";
      Object.keys(room.teams).map((t) => {
        const f = room.teams[t].members.filter(
          (member) => member.userName === userName
        );

        if (f.length !== 0) {
          teamColour = room.teams[t].colour;
        }
      });

      rooms[roomName].system.unshift({
        author: "admin",
        text: `<span><span class="font-semibold" style="background-color: ${getColorWithOpacity(
          teamColour
        )}">${userName}</span> cleared the room</span>`,
        timestamp: Date.now(),
        tsx: true,
      });

      io.to(roomName).emit("room:update", room);
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

        let teamColour: string = "";
        Object.keys(room.teams).map((t) => {
          const f = room.teams[t].members.filter(
            (member) => member.userName === userName
          );

          if (f.length !== 0) {
            teamColour = room.teams[t].colour;
          }
        });

        rooms[roomName].system.unshift({
          author: "admin",
          text: `<span><span class="font-semibold" style="background-color: ${getColorWithOpacity(
            teamColour
          )}">${userName}</span> resumed the game</span>`,
          timestamp: Date.now(),
          tsx: true,
        });
      } else {
        pauseManager.isPaused[roomName] = true;
        const buzzTimer = pauseManager.timer[roomName];
        if (buzzTimer) clearTimeout(buzzTimer);
        console.log("Game paused");

        let teamColour: string = "";
        Object.keys(room.teams).map((t) => {
          const f = room.teams[t].members.filter(
            (member) => member.userName === userName
          );

          if (f.length !== 0) {
            teamColour = room.teams[t].colour;
          }
        });

        rooms[roomName].system.unshift({
          author: "admin",
          text: `<span><span class="font-semibold" style="background-color: ${getColorWithOpacity(
            teamColour
          )}">${userName}</span> paused the game</span>`,
          timestamp: Date.now(),
          tsx: true,
        });
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

      let teamColour: string = "";
      Object.keys(room.teams).map((t) => {
        const f = room.teams[t].members.filter(
          (member) => member.userName === userName
        );

        if (f.length !== 0) {
          teamColour = room.teams[t].colour;
        }
      });

      if (socket.teamName && room.teams[socket.teamName]) {
        const userIndex = room.teams[socket.teamName].members.findIndex(
          (member) => member.userName === socket.userName
        );

        if (userIndex !== -1) {
          room.teams[socket.teamName].members[userIndex].buzzed = true;

          rooms[roomName].system.unshift({
            author: "admin",
            text: `<span><span class="font-semibold" style="background-color: ${getColorWithOpacity(
              teamColour
            )}">${userName}</span> buzzed!</span>`,
            timestamp: Date.now(),
            tsx: true,
          });
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
        rooms[roomName].system.unshift({
          author: "admin",
          text: `<span><span class="font-semibold" style="background-color: ${getColorWithOpacity(
            teamColour
          )}">${userName}</span> took too long to answer</span>`,
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
          room.system.unshift({
            author: "admin",
            text: `<span>The correct answer was: <span class="font-semibold">${room.currentQuestion?.a
              .map((a) => a.text)
              .join(" OR ")}</span></span>`,
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

      let isCorrect: boolean = validateAnswer(answer, {
        answers: room.currentQuestion?.a || [],
      });

      let teamColour: string = "";
      Object.keys(room.teams).map((t) => {
        const f = room.teams[t].members.filter(
          (member) => member.userName === socket.userName
        );

        if (f.length !== 0) {
          teamColour = room.teams[t].colour;
        }
      });

      room.system.unshift({
        author: "admin",
        text: `<span><span class="font-semibold" style="background-color: ${getColorWithOpacity(
          teamColour
        )}">${socket.userName}</span>  answered: "${answer}" - ${
          isCorrect ? "Correct!" : "Incorrect!"
        }</span>. The possible answers were: <span class="font-semibold">${room.currentQuestion?.a
          .map((a) => a.text)
          .join(" OR ")}</span>`,
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
        pauseManager.isPaused[roomName] = true;
        pauseManager.wordQueue[roomName] = [];
        pauseManager.lastProcessedIndex[roomName] = -1;
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
            text: `<span>The correct answer was: <span class="font-semibold">${room.currentQuestion?.a
              .map((a) => a.text)
              .join(" OR ")}</span></span>`,
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
