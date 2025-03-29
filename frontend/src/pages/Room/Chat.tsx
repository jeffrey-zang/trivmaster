import { KeyboardEvent, useRef, useState, useCallback, useEffect } from "react";
import { Input } from "@/components/ui";
import { toast } from "sonner";
import socket from "@/lib/socket";
import { Message } from "@/backend/types";
import { Room as RoomType } from "@/backend/types";
import { getColorWithOpacity } from "@/lib/utils";
import DOMPurify from "dompurify";

interface ChatProps {
  data: RoomType | null;
  roomName: string | undefined;
  chat: Message[];
  onFocusChange?: (isFocused: boolean) => void;
}

const ChatComponent = ({ roomName, chat, onFocusChange, data }: ChatProps) => {
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
    <div className="border-t border-gray-100 py-8 dark:border-gray-700 px-8 overflow-y-auto relative">
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
        className="sticky backdrop-blur-sm bg-white/60 border-b border-gray-100 dark:border-gray-700 top-0 left-0"
        onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
          setInputMessage(e.target.value)
        }
      />
      <div className="mt-2">
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
                        data?.teams[message.team || ""]?.colour || "gray"
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

export default ChatComponent;
