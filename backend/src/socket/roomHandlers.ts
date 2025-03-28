import { Server } from "socket.io";
import { ISocket, Room } from "../types.ts";

export const setupRoomHandlers = (
  io: Server,
  socket: ISocket,
  rooms: Record<string, Room>
) => {
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
            points: 0,
            colour: "#808080"
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
};
