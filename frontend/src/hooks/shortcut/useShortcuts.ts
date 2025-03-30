import { useState, useCallback, useEffect } from "react";
import {
  ShortcutConfig,
  ShortcutSection,
  ShortcutManagerOptions
} from "./types";

export const useShortcuts = (options: ShortcutManagerOptions = {}) => {
  const [shortcutSections, setShortcutSections] = useState<ShortcutSection[]>(
    []
  );
  const excludeWhenInputFocused = options.excludeWhenInputFocused ?? true;

  const registerSection = useCallback((section: ShortcutSection) => {
    setShortcutSections((prev) => {
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

  const registerShortcut = useCallback(
    (sectionHeading: string, shortcut: ShortcutConfig) => {
      setShortcutSections((prev) => {
        const existingIndex = prev.findIndex(
          (s) => s.heading === sectionHeading
        );

        if (existingIndex >= 0) {
          const newSections = [...prev];
          const existingSection = newSections[existingIndex];

          const shortcutIndex = existingSection.shortcuts.findIndex(
            (item) =>
              item.key === shortcut.key && item.modifier === shortcut.modifier
          );

          if (shortcutIndex >= 0) {
            const newShortcuts = [...existingSection.shortcuts];
            newShortcuts[shortcutIndex] = shortcut;
            newSections[existingIndex] = {
              ...existingSection,
              shortcuts: newShortcuts
            };
          } else {
            newSections[existingIndex] = {
              ...existingSection,
              shortcuts: [...existingSection.shortcuts, shortcut]
            };
          }

          return newSections;
        } else {
          return [
            ...prev,
            {
              heading: sectionHeading,
              shortcuts: [shortcut]
            }
          ];
        }
      });
    },
    []
  );

  const unregisterSection = useCallback((sectionHeading: string) => {
    setShortcutSections((prev) =>
      prev.filter((s) => s.heading !== sectionHeading)
    );
  }, []);

  const unregisterShortcut = useCallback(
    (sectionHeading: string, key: string, modifier?: string) => {
      setShortcutSections((prev) => {
        const sectionIndex = prev.findIndex(
          (s) => s.heading === sectionHeading
        );
        if (sectionIndex < 0) return prev;

        const section = prev[sectionIndex];
        const newShortcuts = section.shortcuts.filter(
          (shortcut) =>
            !(shortcut.key === key && shortcut.modifier === modifier)
        );

        if (newShortcuts.length === 0) {
          return prev.filter((s) => s.heading !== sectionHeading);
        }

        const newSections = [...prev];
        newSections[sectionIndex] = { ...section, shortcuts: newShortcuts };
        return newSections;
      });
    },
    []
  );

  const checkModifier = useCallback(
    (modifier: string | undefined, e: KeyboardEvent): boolean => {
      if (!modifier) return true;

      switch (modifier) {
        case "meta":
          return e.metaKey;
        case "ctrl":
          return e.ctrlKey;
        case "alt":
          return e.altKey;
        case "shift":
          return e.shiftKey;
        default:
          return true;
      }
    },
    []
  );

  const isInputFocused = useCallback((): boolean => {
    const activeElement = document.activeElement;
    return (
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement?.getAttribute("contenteditable") === "true"
    );
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent): void => {
      if (excludeWhenInputFocused && isInputFocused()) {
        return;
      }

      for (const section of shortcutSections) {
        for (const shortcut of section.shortcuts) {
          const modifierPressed = checkModifier(shortcut.modifier, e);
          const keyPressed = e.key.toLowerCase() === shortcut.key.toLowerCase();

          if (modifierPressed && keyPressed) {
            if (shortcut.condition && !shortcut.condition(e)) {
              continue;
            }

            e.preventDefault();
            shortcut.action();
            return;
          }
        }
      }
    },
    [shortcutSections, excludeWhenInputFocused, isInputFocused, checkModifier]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcutSections,
    registerSection,
    registerShortcut,
    unregisterSection,
    unregisterShortcut
  };
};
