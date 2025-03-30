import { useState, useEffect } from "react";

import { Room as RoomType, Question } from "@/backend/types";
import { Button } from "@/components/ui/button";
import socket from "@/lib/socket";

interface QuestionProps {
  data: RoomType | null;
}

const QuestionComponent = ({ data }: QuestionProps) => {
  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    q: "Loading...",
    a: "",
    type: "",
    value: 0
  });

  useEffect(() => {
    if (data) {
      setCurrentQuestion(
        data.currentQuestion || {
          q: "Loading...",
          a: "",
          type: "",
          value: 0
        }
      );
    }
  }, [data]);

  const handleStartGame = () => {
    socket.emit("game:start", { roomName: data?.roomName });
  };

  const handleBuzz = () => {
    socket.emit("game:buzz", { roomName: data?.roomName });
  };

  const handlePauseGame = () => {
    socket.emit("game:pause", { roomName: data?.roomName });
  };

  return (
    <div className="flex flex-col gap-4 p-8">
      {data?.currentQuestion ? (
        <div>
          <div className="text-sm text-muted-foreground">
            Question #{data?.questions?.indexOf(currentQuestion) ?? 0 + 1}
          </div>
          <div className="text-lg mt-1">{currentQuestion.q}</div>
          <div className="flex gap-2">
            <Button
              className="flex items-center gap-2 mt-4"
              onClick={handleBuzz}
            >
              Buzz
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">space</span>
              </kbd>
            </Button>

            <Button
              variant="secondary"
              className="flex items-center gap-2 mt-4"
              onClick={handlePauseGame}
            >
              Pause
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                <span className="text-xs">p</span>
              </kbd>
            </Button>
          </div>
        </div>
      ) : (
        <div>
          <p>Game has not started, yet</p>
          <Button
            variant="secondary"
            className="flex items-center gap-2 mt-4"
            onClick={handleStartGame}
          >
            Play
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">p</span>
            </kbd>
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionComponent;
