import { useEffect, useMemo } from "react";
import { CommandItem } from "./CommandComponent";
import { useCommandContext } from "../../contexts/command/provider";

export const useRegisterCommands = (
  sectionHeading: string,
  commands: CommandItem[],
  deps: any[] = []
) => {
  const { registerCommand, unregisterCommand } = useCommandContext();

  const memoizedCommands = useMemo(() => commands, [...deps]);

  useEffect(() => {
    memoizedCommands.forEach((command) => {
      registerCommand(sectionHeading, command);
    });

    return () => {
      memoizedCommands.forEach((command) => {
        unregisterCommand(sectionHeading, command.name);
      });
    };
  }, [sectionHeading, memoizedCommands, registerCommand, unregisterCommand]);

  return {
    registerCommand: (command: CommandItem) =>
      registerCommand(sectionHeading, command),
    unregisterCommand: (commandName: string) =>
      unregisterCommand(sectionHeading, commandName)
  };
};
