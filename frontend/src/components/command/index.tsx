import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut
} from "../ui/command";

import { Send, Cloud, SunMoon } from "lucide-react";

export type Command = {
  name: string;
  shortcut?: string;
  icon: React.ReactNode;
  action?: () => void;
};

export const CommandComponent = ({
  isCommandOpen,
  setIsCommandOpen,
  setIsZenMode,
  toggleTheme
}: {
  isCommandOpen: boolean;
  setIsCommandOpen: (isOpen: boolean) => void;
  setIsZenMode?: (isZen: boolean | ((prev: boolean) => boolean)) => void;
  toggleTheme?: () => void;
  roomName?: string;
  userName?: string;
  socket?: any;
}) => {
  const commands = [
    "Suggestions",
    {
      name: "Type in chat",
      shortcut: "Enter",
      icon: <Send className="mr-2 h-4 w-4" />,
      action: () => {
        setIsCommandOpen(false);
        document.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter" }));
      }
    },
    {
      name: "Toggle Zen mode",
      shortcut: "z",
      icon: <Cloud className="mr-2 h-4 w-4" />,
      action: () => {
        setIsCommandOpen(false);
        if (setIsZenMode) {
          setIsZenMode((prev) => !prev);
        }
      }
    },
    {
      name: "Toggle theme",
      icon: <SunMoon className="mr-2 h-4 w-4" />,
      action: () => {
        setIsCommandOpen(false);
        if (toggleTheme) {
          toggleTheme();
        }
      }
    }
  ] as (Command | string)[];

  const handleSelect = (command: Command) => {
    if (command.action) {
      command.action();
    }
    setIsCommandOpen(false);
  };

  return (
    <>
      <CommandDialog open={isCommandOpen} onOpenChange={setIsCommandOpen}>
        <CommandInput placeholder="Type a command or search..." />

        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          {commands.map((command, index) => {
            if (typeof command === "string") {
              return (
                <div key={`command-heading-${index}`}>
                  {index !== 0 && <CommandSeparator />}
                  <CommandGroup heading={command} />
                </div>
              );
            }

            return (
              <CommandItem
                key={`command-${index}`}
                className="flex items-center"
                onSelect={() => handleSelect(command)}
              >
                {command.icon}
                {command.name}
                {command.shortcut && (
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            );
          })}
        </CommandList>
      </CommandDialog>
    </>
  );
};
