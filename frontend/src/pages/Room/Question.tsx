import { useState, useEffect, useMemo, useRef, FormEvent } from "react";

import { Room as RoomType, Question } from "@/backend/types";
import { Button } from "@/components/ui/button";
import socket from "@/lib/socket";
import { useRegisterShortcuts } from "@/hooks/shortcut";
import { ShortcutConfig } from "@/hooks/shortcut";
import { useParams } from "react-router-dom";
import { Pause, Play, ArrowRight, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

interface QuestionProps {
  data: RoomType | null;
}

const QuestionComponent = ({ data }: QuestionProps) => {
  const { roomName } = useParams();
  const answerInputRef = useRef<HTMLInputElement>(null);
  const [answer, setAnswer] = useState("");

  const [currentQuestion, setCurrentQuestion] = useState<Question>({
    q: "Loading...",
    a: "",
    type: "",
    value: 0
  });

  const handleStartGame = () => {
    socket.emit("game:start", { roomName: data?.roomName });
  };

  const handleBuzz = () => {
    socket.emit("game:buzz", { roomName: data?.roomName });
  };

  const handlePauseGame = () => {
    socket.emit("game:pause", { roomName: data?.roomName });
  };

  const handleNextQuestion = () => {
    socket.emit("game:next", { roomName: data?.roomName });
  };

  const handleSubmitAnswer = (e: FormEvent) => {
    e.preventDefault();
    if (answer.trim()) {
      socket.emit("game:answer", { roomName: data?.roomName, answer });
      setAnswer("");
    }
  };

  const gameShortcuts = useMemo(
    (): ShortcutConfig[] => [
      {
        key: "p",
        condition: () => !!roomName && !!socket,
        action: handlePauseGame,
        description: "Pause/resume game"
      },
      {
        key: "s",
        condition: () => !!roomName && !!socket && !data?.currentQuestion,
        action: handleStartGame,
        description: "Start game"
      },
      {
        key: " ",
        condition: () => !!roomName && !!socket && data?.state !== "buzzing",
        action: handleBuzz,
        description: "Buzz"
      },
      {
        key: "n",
        condition: () =>
          !!roomName &&
          !!socket &&
          (data?.state === "waiting" || data?.state === "showAnswer"),
        action: handleNextQuestion,
        description: "Next question"
      }
    ],
    [roomName, data]
  );

  useRegisterShortcuts(gameShortcuts, [gameShortcuts, roomName, data]);

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

  useEffect(() => {
    if (data?.state === "buzzing" && answerInputRef.current) {
      answerInputRef.current.focus();
    }
  }, [data?.state]);

  // Show the correct team in the given state
  const renderQuestionStateUI = () => {
    if (data?.state === "buzzing" && data.currentBuzzed === socket.id) {
      return (
        <form onSubmit={handleSubmitAnswer} className="mt-4">
          <div className="flex flex-col gap-2">
            <label htmlFor="answer" className="text-sm font-medium">
              Your Answer:
            </label>
            <div className="flex gap-2">
              <Input
                id="answer"
                ref={answerInputRef}
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder="Type your answer..."
                className="flex-1"
                autoComplete="off"
              />
              <Button type="submit">Submit</Button>
            </div>
          </div>
        </form>
      );
    } else if (data?.state === "buzzing") {
      return (
        <div className="mt-4">
          <p className="text-sm text-yellow-500 font-medium">
            {Object.values(data.teams)
              .flatMap((team) => team.members)
              .find((member) => member.buzzed)?.userName || "Someone"}{" "}
            is answering...
          </p>
        </div>
      );
    } else if (data?.state === "waiting") {
      // Correct answer shown
      return (
        <div className="mt-4">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <CheckCircle className="h-5 w-5" />
            <p className="font-medium">Correct Answer!</p>
          </div>
          <Button
            onClick={handleNextQuestion}
            className="flex items-center gap-2"
          >
            Next Question
            <ArrowRight className="h-4 w-4" />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">n</span>
            </kbd>
          </Button>
        </div>
      );
    } else if (data?.state === "showAnswer") {
      // Show correct answer when all teams have tried
      return (
        <div className="mt-4">
          <p className="text-sm font-medium mb-2">
            The correct answer was:{" "}
            <span className="text-primary">{currentQuestion.a}</span>
          </p>
          <Button
            onClick={handleNextQuestion}
            className="flex items-center gap-2"
          >
            Next Question
            <ArrowRight className="h-4 w-4" />
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">n</span>
            </kbd>
          </Button>
        </div>
      );
    } else if (data?.state === "gameOver") {
      return (
        <div className="mt-4">
          <p className="text-lg font-medium">Game Over!</p>
          <p className="text-sm text-muted-foreground">
            No more questions available.
          </p>
        </div>
      );
    } else {
      // Default state (reading)
      return (
        <div className="flex gap-2">
          <Button
            className="flex items-center gap-2 mt-4"
            onClick={handleBuzz}
            disabled={(data?.state as string) === "buzzing"}
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
            {data?.isPaused ? (
              <>
                Resume
                <Play className="h-3 w-3" />
              </>
            ) : (
              <>
                Pause
                <Pause className="h-3 w-3" />
              </>
            )}
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">p</span>
            </kbd>
          </Button>
        </div>
      );
    }
  };

  return (
    <div className="flex flex-col gap-4 p-8">
      {data?.state}
      {data?.currentQuestion ? (
        <div>
          <div className="text-sm text-muted-foreground">
            Question #{data?.questions?.indexOf(currentQuestion) ?? 0 + 1}
          </div>
          <div className="text-lg mt-1">
            {currentQuestion.q}
            {data.isPaused && (data.state as string) === "reading" && (
              <span className="ml-2 text-xs text-yellow-500 font-semibold">
                (Paused)
              </span>
            )}
          </div>

          {renderQuestionStateUI()}
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
              <span className="text-xs">s</span>
            </kbd>
          </Button>
        </div>
      )}
    </div>
  );
};

export default QuestionComponent;
