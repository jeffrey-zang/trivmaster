import { Room as RoomType, Question } from "@/backend/types";
import { useState, useEffect } from "react";
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
    console.log("Starting game");
    socket.emit("game:start", { roomName: data?.roomName });
  };

  return (
    <div className="flex flex-col gap-4 p-8">
      {data?.currentQuestion ? (
        <div>
          <div>Question #{data.questions.indexOf(currentQuestion) + 1}</div>
          <div>{currentQuestion.q}</div>
        </div>
      ) : (
        <div>
          <p>Game has not started, yet</p>
          <Button
            variant="secondary"
            className="flex items-center gap-2 mt-4"
            onClick={handleStartGame}
          >
            Start
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
