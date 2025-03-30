import { useState, useCallback } from "react";
import { CommandItem, CommandSection } from "./CommandComponent";

export const useCommands = () => {
  const [isCommandOpen, setIsCommandOpen] = useState<boolean>(false);
  const [commandSections, setCommandSections] = useState<CommandSection[]>([]);

  const registerSection = useCallback((section: CommandSection) => {
    setCommandSections((prev) => {
      const existingIndex = prev.findIndex(
        (s) => s.heading === section.heading
      );

      if (existingIndex >= 0) {
        const newSections = [...prev];
        newSections[existingIndex] = section;
        return newSections;
      } else {
        return [...prev, section];
      }
    });
  }, []);

  const registerCommand = useCallback(
    (sectionHeading: string, command: CommandItem) => {
      setCommandSections((prev) => {
        const existingIndex = prev.findIndex(
          (s) => s.heading === sectionHeading
        );

        if (existingIndex >= 0) {
          const newSections = [...prev];
          const existingSection = newSections[existingIndex];

          const commandIndex = existingSection.items.findIndex(
            (item) => item.name === command.name
          );

          if (commandIndex >= 0) {
            const newItems = [...existingSection.items];
            newItems[commandIndex] = command;
            newSections[existingIndex] = {
              ...existingSection,
              items: newItems
            };
          } else {
            newSections[existingIndex] = {
              ...existingSection,
              items: [...existingSection.items, command]
            };
          }

          return newSections;
        } else {
          return [
            ...prev,
            {
              heading: sectionHeading,
              items: [command]
            }
          ];
        }
      });
    },
    []
  );

  const unregisterSection = useCallback((sectionHeading: string) => {
    setCommandSections((prev) =>
      prev.filter((s) => s.heading !== sectionHeading)
    );
  }, []);

  const unregisterCommand = useCallback(
    (sectionHeading: string, commandName: string) => {
      setCommandSections((prev) => {
        const sectionIndex = prev.findIndex(
          (s) => s.heading === sectionHeading
        );
        if (sectionIndex < 0) return prev;

        const section = prev[sectionIndex];
        const newItems = section.items.filter(
          (item) => item.name !== commandName
        );

        if (newItems.length === 0) {
          return prev.filter((s) => s.heading !== sectionHeading);
        }

        const newSections = [...prev];
        newSections[sectionIndex] = { ...section, items: newItems };
        return newSections;
      });
    },
    []
  );

  const openCommandPalette = useCallback(() => setIsCommandOpen(true), []);
  const closeCommandPalette = useCallback(() => setIsCommandOpen(false), []);

  return {
    isCommandOpen,
    setIsCommandOpen,
    openCommandPalette,
    closeCommandPalette,
    commandSections,
    registerSection,
    registerCommand,
    unregisterSection,
    unregisterCommand
  };
};
