import { useParams } from "react-router-dom";
import socket from "../lib/socket";
import { useEffect, useState } from "react";
import { Room as RoomType, Team } from "@/backend/types";

const Room = () => {
  const { roomId } = useParams();
  const [data, setData] = useState<RoomType | null>(null);

  useEffect(() => {
    socket.emit("join-room", { roomId });

    socket.on("success", (data: RoomType) => {
      console.log(data);
      setData(data);
    });
  }, []);

  return (
    <div>
      <h1>Room {roomId}</h1>
      <div>
        <h2>Teams</h2>
        {data?.teams.map((team: Team) => (
          <div key={team.teamName}>
            <h3>{team.teamName}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Room;
