import { toast } from "sonner";
import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";

import socket from "@/lib/socket";
import type { ISocket, Room as RoomType } from "@/backend/types";
import { ShortcutConfig, useRegisterShortcuts } from "@/hooks/shortcut";
import MetaData from "@/components/MetaData";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui";

import ChatComponent from "./Chat";
import QuestionComponent from "./Question";
import TeamComponent from "./Team";

const Room = () => {
  const { roomName } = useParams();

  const blurTargetRef = useRef<HTMLDivElement>(null);

  const [data, setData] = useState<RoomType | null>(null);
  const [member, setMember] = useState<ISocket | null>(null);

  const [isZenMode, setIsZenMode] = useState(false);

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
    const onRoomUpdate = (roomData: RoomType, memberFromServer?: ISocket) => {
      console.log("Room updated:", roomData);
      setData(roomData);

      if (memberFromServer) {
        setMember(memberFromServer);
      }
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

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [roomName]);

  const roomShortcuts = useMemo(
    (): ShortcutConfig[] => [
      {
        key: "z",
        action: () => setIsZenMode((prev) => !prev),
        description: "Toggle zen mode",
      },
    ],
    [setIsZenMode]
  );

  useRegisterShortcuts(roomShortcuts, [setIsZenMode]);

  return (
    <div className="flex h-screen">
      <MetaData
        title={`Room: ${roomName}`}
        description={`Join the trivia room ${roomName} on Trivmaster`}
      />

      <div
        className={`w-1/4 min-w-80 dark:bg-gray-900 border-r border-gray-300 dark:border-gray-700 transition-opacity duration-150 ${
          isZenMode ? "opacity-0 pointer-events-none" : "opacity-100"
        }`}
      >
        <div className="h-1/2 overflow-y-auto relative">
          <div className="sticky top-0 left-0 p-8 pb-4 border-b border-gray-300 dark:border-gray-700">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  {" "}
                  <Link className="text-xl" to="/">
                    Room <span className="font-semibold">{roomName}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Back to home</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

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
        <QuestionComponent data={data} userName={member?.userName} />
      </div>

      <div ref={blurTargetRef} tabIndex={-1} style={{ outline: "none" }} />
    </div>
  );
};

export default Room;
