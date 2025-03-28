import { useParams } from "react-router-dom";
import socket from "../lib/socket";
import { useEffect, useState, useRef, KeyboardEvent, useCallback } from "react";
import type {
  Room as RoomType,
  Team,
  Member
} from "../../../backend/src/types";
import { Input } from "../components/ui/input";
import { toast } from "sonner";
import { CommandComponent } from "../components/command";
import { useTheme } from "../components/theme/provider";
import { Zap } from "lucide-react";

const Room = () => {
  const { roomName } = useParams();
  const [data, setData] = useState<RoomType | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTargetRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const { theme, setTheme } = useTheme();
  const [isZenMode, setIsZenMode] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
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

      if ((e.key === "z" || e.key === "Z") && !isFocused && !isCommandOpen) {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      }

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen((open) => !open);
      }

      // if ((e.key === "b" || e.key === "B") && !isFocused && !isCommandOpen) {
      //   e.preventDefault();
      //   if (roomName) {
      //     socket.emit("buzz:in", { roomName });
      //   }
      // }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("keydown", handleKeyDown as any);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("keydown", handleKeyDown as any);
    };
  }, [roomName, isFocused, setIsZenMode, isCommandOpen]);

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

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <div className="flex h-screen">
      <CommandComponent
        isCommandOpen={isCommandOpen}
        setIsCommandOpen={setIsCommandOpen}
        setIsZenMode={setIsZenMode}
        toggleTheme={toggleTheme}
        roomName={roomName || undefined}
        userName={userName || undefined}
        socket={socket}
      />
      {/* <p className="text-sm text-muted-foreground">
        Press{" "}
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>J
        </kbd>
      </p> */}

      <div
        className={`w-1/5 light:bg-gray-100 dark:bg-gray-900 p-8 border-r light:border-gray-300 dark:border-gray-700 transition-opacity duration-150 h-full ${
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
                  className={`flex items-center p-2 rounded ${
                    member.userName === userName ? "bg-green-500" : ""
                  } ${member.buzzed ? "bg-yellow-400" : ""} ${
                    data.currentBuzzed === member.userName
                      ? "animate-pulse bg-red-500"
                      : ""
                  }`}
                >
                  {member.userName}
                  {(member.buzzed ||
                    data.currentBuzzed === member.userName) && (
                    <Zap className="ml-2 h-4 w-4" />
                  )}
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
        className={`w-1/5 p-8 border-l light:border-gray-300 dark:border-gray-700 h-full light:bg-gray-100 dark:bg-gray-900 transition-opacity duration-150 ${
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
