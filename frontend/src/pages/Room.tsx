import { useParams } from "react-router-dom";
import socket from "../lib/socket";
import { useEffect, useState, useRef, KeyboardEvent, useCallback } from "react";
import type { Room as RoomType, Team, Member } from "@/backend/types";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Room = () => {
  const { roomName } = useParams();
  const [data, setData] = useState<RoomType | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTargetRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isZenMode, setIsZenMode] = useState(false);

  const [inputMessage, setInputMessage] = useState<string>("");

  useEffect(() => {
    if (!roomName) return;

    console.log("Joining room:", roomName);
    socket.emit("room:join", { roomName });

    return () => {
      console.log("Leaving room:", roomName);
      socket.emit("room:leave", { roomName });
    };
  }, [roomName]);

  useEffect(() => {
    const onRoomUpdate = (roomData: RoomType, userNameFromServer?: string) => {
      setData(roomData);

      if (userNameFromServer) {
        setUserName(userNameFromServer);
      }

      console.log("Room updated:", roomData);
    };

    socket.on("room:update", onRoomUpdate);

    return () => {
      socket.off("room:update", onRoomUpdate);
    };
  }, []);

  const unfocusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
    setIsFocused(false);
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomName) {
        socket.emit("room:leave", { roomName });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      if (e.key === "z" || e.key === "Z") {
        e.preventDefault();
        console.log("Zen mode");
        setIsZenMode((prev) => !prev);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("keydown", handleKeyDown as any);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("keydown", handleKeyDown as any);
    };
  }, [roomName, isFocused, setIsZenMode]);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (isFocused) {
        if (!inputMessage) {
          toast.error("Message cannot be empty");
          unfocusInput();
          return;
        }

        socket.emit("chat:send", { roomName, message: inputMessage });
        setInputMessage("");
        unfocusInput();
      }
    }

    if (e.key === "Escape") {
      unfocusInput();
    }
  };

  return (
    <div className="flex h-screen">
      <div
        className={`w-1/5 bg-gray-100 p-8 border-r border-gray-300 transition-opacity duration-150 h-full ${
          isZenMode ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <h1 className="text-2xl font-bold">Room {roomName}</h1>
        <h2 className="text-xl font-bold">Teams</h2>
        {data?.teams?.map((team: Team, i: number) => (
          <div key={`team-${i}`}>
            <h3>{team.teamName}</h3>
            <div>
              {team.members.map((member: Member, j: number) => (
                <div
                  key={`member-${j}`}
                  className={`${
                    member.userName === userName ? "bg-green-500" : ""
                  }`}
                >
                  {member.userName}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="w-3/5 p-8">
        <div>Question {data?.questions ? data.questions.length : 0}</div>
        <Input
          type="text"
          placeholder={`${
            isFocused ? "Press esc to unfocus" : "Press enter to type"
          }`}
          ref={inputRef}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleInputKeyDown}
          value={inputMessage}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setInputMessage(e.target.value)
          }
        />
        <div>
          {data?.chat.map((message: string, i: number) => (
            <div key={`chat-${i}`}>{message}</div>
          ))}
        </div>
        <div ref={blurTargetRef} tabIndex={-1} style={{ outline: "none" }} />
      </div>

      <div
        className={`w-1/5 p-8 border-l border-gray-300 h-full bg-gray-100 transition-opacity duration-150 ${
          isZenMode ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <h2 className="text-xl font-bold">Config</h2>
        {data?.teams?.map((team: Team, i: number) => (
          <div key={`team-${i}`}>
            <h3>{team.teamName}</h3>
            <div>
              {team.members.map((member: Member, j: number) => (
                <div
                  key={`member-${j}`}
                  className={`${
                    member.userName === userName ? "bg-green-500" : ""
                  }`}
                >
                  {member.userName}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Room;
