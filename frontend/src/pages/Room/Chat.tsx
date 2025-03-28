import { KeyboardEvent, useRef, useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui";
import { toast } from "sonner";
import socket from "@/lib/socket";
import { Message } from "@/backend/src/types";

interface ChatProps {
  roomName: string | undefined;
  chat: string[];
  onFocusChange?: (isFocused: boolean) => void;
}

export const Chat = ({ roomName, chat, onFocusChange }: ChatProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [inputMessage, setInputMessage] = useState<string>("");

  const unfocusInput = useCallback(() => {
    if (inputRef.current) {
      inputRef.current.blur();
    }
    setIsFocused(false);
  }, []);

  useEffect(() => {
    onFocusChange?.(isFocused);
  }, [isFocused, onFocusChange]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isFocused) {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown as any);
    return () => {
      document.removeEventListener("keydown", handleKeyDown as any);
    };
  }, [isFocused]);

  const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      if (isFocused) {
        if (!inputMessage) {
          toast.error("Message cannot be empty");
          unfocusInput();
          return;
        }

        socket.emit("chat:send", { roomName, text: inputMessage });
        setInputMessage("");
        unfocusInput();
      }
    }

    if (e.key === "Escape") {
      unfocusInput();
    }
  };

  return (
    <div className="h-1/2 border-t border-gray-100 dark:border-gray-700 p-8">
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
        {chat?.map((message: Message, i: number) => {
          return (
            <div key={`chat-${i}`}>
              {message.author === "admin" && (
                <div className="text-sm text-gray-500">{message.text}</div>
              )}
              {message.author !== "admin" && (
                <div className="text-sm">
                  <span className="font-bold mr-2">{message.author}</span>
                  {message.text}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
