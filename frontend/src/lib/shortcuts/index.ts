import { Socket } from "socket.io-client";
import React from "react";

export interface KeyboardShortcutConfig {
  key: string;
  modifier?: "meta" | "ctrl" | "alt" | "shift";
  description: string;
  condition?: (event: KeyboardEvent) => boolean;
  action: () => void;
}

export interface ShortcutManagerOptions {
  excludeWhenInputFocused?: boolean;
}

export class ShortcutManager {
  private shortcuts: KeyboardShortcutConfig[] = [];
  private excludeWhenInputFocused: boolean;

  constructor(options: ShortcutManagerOptions = {}) {
    this.excludeWhenInputFocused = options.excludeWhenInputFocused ?? true;
  }

  registerShortcut(config: KeyboardShortcutConfig): ShortcutManager {
    this.shortcuts.push(config);
    return this;
  }

  registerShortcuts(configs: KeyboardShortcutConfig[]): ShortcutManager {
    this.shortcuts.push(...configs);
    return this;
  }

  handleKeyDown = (e: KeyboardEvent): void => {
    if (this.excludeWhenInputFocused && this.isInputFocused()) {
      return;
    }

    this.shortcuts.forEach((shortcut) => {
      const modifierPressed = this.checkModifier(shortcut.modifier, e);
      const keyPressed = e.key.toLowerCase() === shortcut.key.toLowerCase();

      if (modifierPressed && keyPressed) {
        if (shortcut.condition && !shortcut.condition(e)) {
          return;
        }

        e.preventDefault();
        shortcut.action();
      }
    });
  };

  private checkModifier(
    modifier: string | undefined,
    e: KeyboardEvent
  ): boolean {
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
  }

  private isInputFocused(): boolean {
    const activeElement = document.activeElement;
    return (
      activeElement instanceof HTMLInputElement ||
      activeElement instanceof HTMLTextAreaElement ||
      activeElement?.getAttribute("contenteditable") === "true"
    );
  }

  startListening(): void {
    document.addEventListener("keydown", this.handleKeyDown);
  }

  stopListening(): void {
    document.removeEventListener("keydown", this.handleKeyDown);
  }

  getRegisteredShortcuts(): KeyboardShortcutConfig[] {
    return [...this.shortcuts];
  }
}

// Predefined shortcuts
export const createRoomShortcuts = (
  setIsZenMode: React.Dispatch<React.SetStateAction<boolean>>,
  setIsCommandOpen: React.Dispatch<React.SetStateAction<boolean>>,
  socket: Socket,
  roomName?: string
): KeyboardShortcutConfig[] => [
  {
    key: "z",
    description: "Toggle zen mode",
    action: () => setIsZenMode((prev) => !prev)
  },
  {
    key: "k",
    modifier: "meta",
    description: "Open command palette",
    action: () => setIsCommandOpen((prev) => !prev)
  },
  {
    key: "Enter",
    description: "Focus chat input",
    condition: () => !(document.activeElement instanceof HTMLInputElement),
    action: () => {
      const chatInput = document.querySelector(
        'input[placeholder*="Press enter to type"]'
      ) as HTMLInputElement;
      if (chatInput) chatInput.focus();
    }
  },
  {
    key: "Escape",
    description: "Unfocus chat input",
    condition: () => document.activeElement instanceof HTMLInputElement,
    action: () => {
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement) activeElement.blur();
    }
  },
  {
    key: "p",
    description: "Play/Pause game",
    condition: () => !!roomName && !!socket,
    action: () => {
      if (!roomName || !socket) return;
      socket.emit("game:pause", { roomName });
    }
  },
  {
    key: " ", // space
    description: "Buzz",
    condition: () => !!roomName && !!socket,
    action: () => {
      if (!roomName || !socket) return;
      socket.emit("game:buzz", { roomName });
    }
  }
];

export default ShortcutManager;
