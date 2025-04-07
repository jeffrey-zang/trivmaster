import { Server } from "socket.io";
import { ISocket, Room, Team, Member } from "../types.ts";

export const setupRoomHandlers = (
  io: Server,
  socket: ISocket,
  rooms: Record<string, Room>
) => {
  socket.on("room:join", async ({ roomName }: { roomName: string }) => {
    const createRoom = !(roomName in rooms);
    let userName = "Guest";

    const defaultRoom: Room = {
      roomName: roomName,
      questions: [],
      teams: {
        Lobby: {
          teamName: "Lobby",
          members: [{ userName: userName, points: 0, buzzed: false }],
          points: 0,
          colour: "#808080",
        },
      },
      currentQuestion: undefined,
      currentBuzzed: undefined,
      currentAnswered: false,
      chat: [],
      system: [],
      createdBy: userName,
      lastEventTimestamp: 0,
      config: {
        readingSpeed: 1,
        buzzTime: 3000,
        answerTime: 3000,
      },
      state: "waiting",
    };

    if (createRoom) {
      rooms[roomName] = defaultRoom;

      await socket.join(roomName);

      socket.userName = userName;
      socket.teamName = "Lobby";

      console.log(roomName, "been created by", userName);
      console.log(
        `${userName} joined ${roomName} (${socket.id}, ${socket.userName})`
      );

      rooms[roomName].system.unshift({
        author: "admin",
        text: `<span><span class="font-bold">${roomName}</span> has been created by ${userName}</span>`,
        timestamp: Date.now(),
        tsx: true,
      });
      rooms[roomName].system.unshift({
        author: "admin",
        text: `<span>${userName} joined</span>`,
        timestamp: Date.now(),
        tsx: true,
      });
    } else {
      const existingMembers = Object.values(rooms[roomName].teams).flatMap(
        (team: Team) => team.members
      );
      const existingMemberNames = existingMembers.map(
        (member: Member) => member.userName
      );

      let i = 1;
      while (existingMemberNames.includes(userName)) {
        userName = `Guest ${i}`;
        i++;
      }

      if (!(roomName in rooms)) {
        rooms[roomName] = defaultRoom;
      } else {
        rooms[roomName].teams.Lobby.members.push({
          userName: userName,
          points: 0,
          buzzed: false,
        });
      }

      socket.userName = userName;
      socket.teamName = "Lobby";

      await socket.join(roomName);

      console.log(`${userName} joined ${roomName}`);
      rooms[roomName].system.unshift({
        author: "admin",
        text: `<span>${userName} joined</span>`,
        timestamp: Date.now(),
        tsx: true,
      });
    }

    socket.emit("room:update", rooms[roomName], {
      userName: userName,
      teamName: "Lobby",
    });

    socket.to(roomName).emit("room:update", rooms[roomName]);
  });

  socket.on("room:leave", async ({ roomName }: { roomName: string }) => {
    await socket.leave(roomName);

    if (!(roomName in rooms)) {
      return;
    }

    if (!socket.teamName || !socket.userName) {
      return;
    }

    const userTeamName = socket.teamName;

    if (userTeamName in rooms[roomName].teams) {
      rooms[roomName].teams[userTeamName].members = rooms[roomName].teams[
        userTeamName
      ].members.filter((member: Member) => member.userName !== socket.userName);

      if (
        rooms[roomName].teams[userTeamName].members.length === 0 &&
        userTeamName !== "Lobby"
      ) {
        delete rooms[roomName].teams[userTeamName];
      }
    }

    console.log(socket.userName, "has left", roomName);

    if (rooms[roomName].teams.Lobby.members.length === 0) {
      delete rooms[roomName];
      console.log(roomName, "has been deleted");
      return;
    }

    rooms[roomName].system.unshift({
      author: "admin",
      text: `<span>${socket.userName} has left</span>`,
      timestamp: Date.now(),
      tsx: true,
    });

    io.to(roomName).emit("room:update", rooms[roomName]);

    socket.offAny();
  });
};
