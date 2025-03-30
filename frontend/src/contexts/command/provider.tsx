import { createContext, useContext, ReactNode } from "react";

import {
  CommandComponent,
  CommandSection,
  CommandItem
} from "@/hooks/command/CommandComponent";
import { useCommands } from "@/hooks/command/useCommands";

interface CommandContextValue {
  isCommandOpen: boolean;
  setIsCommandOpen: (isOpen: boolean | ((prev: boolean) => boolean)) => void;
  openCommandPalette: () => void;
  closeCommandPalette: () => void;
  commandSections: CommandSection[];
  registerSection: (section: CommandSection) => void;
  registerCommand: (sectionHeading: string, command: CommandItem) => void;
  unregisterSection: (sectionHeading: string) => void;
  unregisterCommand: (sectionHeading: string, commandName: string) => void;
}

const CommandContext = createContext<CommandContextValue | undefined>(
  undefined
);

export const CommandProvider = ({ children }: { children: ReactNode }) => {
  const commandsState = useCommands();

  return (
    <CommandContext.Provider value={commandsState}>
      <CommandComponent
        isCommandOpen={commandsState.isCommandOpen}
        setIsCommandOpen={commandsState.setIsCommandOpen}
        commandSections={commandsState.commandSections}
      />
      {children}
    </CommandContext.Provider>
  );
};

export const useCommandContext = () => {
  const context = useContext(CommandContext);
  if (context === undefined) {
    throw new Error("useCommandContext must be used within a CommandProvider");
  }
  return context;
};
