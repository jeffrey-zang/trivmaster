import { useParams } from "react-router-dom";
import socket from "@/lib/socket";
import { useEffect, useState, useRef, KeyboardEvent } from "react";
import type { Room as RoomType, ISocket } from "@/backend/src/types";
import { CommandComponent } from "@/components/command";
import { useTheme } from "@/components/theme/provider";
import { TeamComponent, Team, Member } from "./Team";
import { Chat } from "./Chat";

const Room = () => {
  const { roomName } = useParams();
  const { theme, setTheme } = useTheme();

  const blurTargetRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<RoomType | null>(null);
  const [member, setMember] = useState<ISocket | null>(null);

  const [isZenMode, setIsZenMode] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isChatFocused, setIsChatFocused] = useState(false);

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
    const onRoomUpdate = (roomData: RoomType, memberFromServer: ISocket) => {
      setData(roomData);
      setMember(memberFromServer);

      console.log("Room updated:", roomData);
    };

    socket.on("room:update", onRoomUpdate);

    return () => {
      socket.off("room:update", onRoomUpdate);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomName) {
        socket.emit("room:leave", { roomName });
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        (e.key === "z" || e.key === "Z") &&
        !isChatFocused &&
        !isCommandOpen
      ) {
        e.preventDefault();
        setIsZenMode((prev) => !prev);
      }

      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsCommandOpen((open) => !open);
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("keydown", handleKeyDown as any);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("keydown", handleKeyDown as any);
    };
  }, [roomName, setIsZenMode, isCommandOpen, isChatFocused]);

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
        userName={member?.userName || undefined}
        socket={socket}
      />
      <p
        className="text-sm text-muted-foreground fixed left-16 bottom-6 z-10"
        onClick={() => setIsCommandOpen(true)}
      >
        Press{" "}
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </p>

      <div
        className={`w-1/5 light:bg-gray-200 dark:bg-gray-900 p-8 border-r light:border-gray-300 dark:border-gray-700 transition-opacity duration-150 h-full ${
          isZenMode ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <h1 className="text-xl">
          Room <span className="font-semibold">{roomName}</span>
        </h1>
        <p className="text-xs text-muted-foreground">
          Created by <span className="font-semibold">{data?.createdBy}</span>
        </p>

        {data && (
          <TeamComponent
            teams={data.teams || []}
            roomName={roomName}
            userName={member?.userName}
            socket={socket}
            currentBuzzed={data.currentBuzzed}
            currentTeam={member?.teamName}
          />
        )}
      </div>

      <div className="w-3/5">
        <div className="h-1/2 p-8">
          <div>Question {data?.questions ? data.questions.length : 0}</div>
        </div>
        <Chat
          roomName={roomName}
          chat={data?.chat || []}
          onFocusChange={setIsChatFocused}
        />
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
                    member.userName === member?.userName ? "bg-green-500" : ""
                  }`}
                >
                  {member.userName}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div ref={blurTargetRef} tabIndex={-1} style={{ outline: "none" }} />
    </div>
  );
};

export default Room;
