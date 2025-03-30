import { useParams } from "react-router-dom";
import socket from "@/lib/socket";
import { useEffect, useState, useRef } from "react";
import type { Room as RoomType, ISocket } from "@/backend/types";
import { CommandComponent } from "@/components/command";
import { useTheme } from "@/components/theme/provider";
import { toast } from "sonner";
import TeamComponent from "./Team";
import QuestionComponent from "./Question";
import ChatComponent from "./Chat";
import ShortcutManager, { createRoomShortcuts } from "@/lib/shortcuts";

const Room = () => {
  const { roomName } = useParams();
  const { theme, setTheme } = useTheme();

  const blurTargetRef = useRef<HTMLDivElement>(null);
  const shortcutManagerRef = useRef<ShortcutManager | null>(null);

  const [data, setData] = useState<RoomType | null>(null);
  const [member, setMember] = useState<ISocket | null>(null);

  const [isZenMode, setIsZenMode] = useState(false);
  const [isCommandOpen, setIsCommandOpen] = useState(false);

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
      console.log("Room updated:", roomData);
      setData(roomData);
      setMember(memberFromServer);
    };

    const onRoomError = (error: string) => {
      console.error("Room error:", error);
      toast.error(error);
    };

    socket.on("room:update", onRoomUpdate);

    socket.on("room:error", onRoomError);

    return () => {
      socket.off("room:update", onRoomUpdate);
      socket.off("room:error", onRoomError);
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (roomName) {
        socket.emit("room:leave", { roomName });
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    shortcutManagerRef.current = new ShortcutManager();
    const shortcuts = createRoomShortcuts(
      setIsZenMode,
      setIsCommandOpen,
      socket,
      roomName
    );
    shortcutManagerRef.current.registerShortcuts(shortcuts);
    shortcutManagerRef.current.startListening();

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      shortcutManagerRef.current?.stopListening();
    };
  }, [roomName]);

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
      />
      <p
        className="text-sm text-muted-foreground fixed right-16 bottom-6 z-10"
        onClick={() => setIsCommandOpen(true)}
      >
        Press{" "}
        <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
          <span className="text-xs">⌘</span>K
        </kbd>
      </p>

      <div
        className={`w-1/4 min-w-80 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 transition-opacity duration-150 ${
          isZenMode ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="h-1/2 overflow-y-auto relative">
          <div className="sticky top-0 left-0 p-8 pb-4 border-b border-gray-300 dark:border-gray-700">
            <h1 className="text-xl">
              Room <span className="font-semibold">{roomName}</span>
            </h1>
            <p className="text-xs text-muted-foreground">
              Created by{" "}
              <span className="font-semibold">{data?.createdBy}</span>
            </p>
          </div>

          {data && (
            <TeamComponent
              teams={data.teams || {}}
              roomName={roomName}
              userName={member?.userName}
              socket={socket}
              currentBuzzed={data.currentBuzzed || null}
              currentTeam={member?.teamName}
            />
          )}
        </div>

        <div className="h-1/2 overflow-y-auto relative">
          <ChatComponent
            data={data}
            roomName={roomName}
            chat={data?.chat || []}
          />
        </div>
      </div>

      <div className="w-4/5">
        <QuestionComponent data={data} />
      </div>

      <div ref={blurTargetRef} tabIndex={-1} style={{ outline: "none" }} />
    </div>
  );
};

export default Room;
