import { useState, useCallback, useEffect } from "react";
import { ShortcutConfig, ShortcutManagerOptions } from "./types";

export const useShortcuts = (options: ShortcutManagerOptions = {}) => {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const excludeWhenInputFocused = options.excludeWhenInputFocused ?? true;

  const registerShortcut = useCallback((shortcut: ShortcutConfig) => {
    setShortcuts((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.key === shortcut.key && item.modifier === shortcut.modifier
      );

      if (existingIndex >= 0) {
        const newShortcuts = [...prev];
        newShortcuts[existingIndex] = shortcut;
        return newShortcuts;
      } else {
        return [...prev, shortcut];
      }
    });
  }, []);

  const unregisterShortcut = useCallback((key: string, modifier?: string) => {
    setShortcuts((prev) =>
      prev.filter(
        (shortcut) => !(shortcut.key === key && shortcut.modifier === modifier)
      )
    );
  }, []);

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

      for (const shortcut of shortcuts) {
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
    },
    [shortcuts, excludeWhenInputFocused, isInputFocused, checkModifier]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);

  return {
    shortcuts,
    registerShortcut,
    unregisterShortcut
  };
};
