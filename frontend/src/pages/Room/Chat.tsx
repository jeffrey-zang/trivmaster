import { KeyboardEvent, useRef, useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui";
import { toast } from "sonner";
import socket from "@/lib/socket";
import { Message } from "@/backend/src/types";
import { Room as RoomType } from "@/backend/src/types";
import { getColorWithOpacity } from "@/lib/utils";
import DOMPurify from "dompurify";

interface ChatProps {
  data: RoomType;
  roomName: string | undefined;
  chat: Message[];
  onFocusChange?: (isFocused: boolean) => void;
}

export const Chat = ({ roomName, chat, onFocusChange, data }: ChatProps) => {
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
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      // Handle Enter to focus
      if (e.key === "Enter" && inputRef.current !== document.activeElement) {
        e.preventDefault();
        inputRef.current?.focus();
      }

      // Handle Escape to unfocus
      if (e.key === "Escape" && inputRef.current === document.activeElement) {
        e.preventDefault();
        unfocusInput();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [unfocusInput]);

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
      e.preventDefault();
      unfocusInput();
    }
  };

  // Function to render message content based on whether it's TSX or plain text
  const renderMessageContent = (message: Message) => {
    if (message.tsx) {
      return (
        <div
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(message.text) }}
        />
      );
    }
    return <>{message.text}</>;
  };

  return (
    <div className="h-1/2 border-t border-gray-100 py-8 dark:border-gray-700">
      <div className="px-8">
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
      </div>
      <div className="overflow-y-scroll h-full px-8 pb-8 pt-4">
        {chat?.map((message: Message, i: number) => {
          return (
            <div key={`chat-${i}`}>
              {message.author === "admin" && (
                <div className="text-sm text-gray-500">
                  {renderMessageContent(message)}
                </div>
              )}
              {message.author !== "admin" && (
                <div className="text-sm">
                  <span
                    className={`font-bold mr-2`}
                    style={{
                      backgroundColor: getColorWithOpacity(
                        data?.teams[message.team]?.colour
                      )
                    }}
                  >
                    {message.author}
                  </span>
                  {renderMessageContent(message)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
