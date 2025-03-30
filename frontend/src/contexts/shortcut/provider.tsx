import { createContext, useContext, ReactNode } from "react";
import {
  ShortcutConfig,
  ShortcutSection,
  ShortcutManagerOptions
} from "@/hooks/shortcut/types";
import { useShortcuts } from "@/hooks/shortcut/useShortcuts";

interface ShortcutContextValue {
  shortcutSections: ShortcutSection[];
  registerSection: (section: ShortcutSection) => void;
  registerShortcut: (sectionHeading: string, shortcut: ShortcutConfig) => void;
  unregisterSection: (sectionHeading: string) => void;
  unregisterShortcut: (
    sectionHeading: string,
    key: string,
    modifier?: string
  ) => void;
}

const ShortcutContext = createContext<ShortcutContextValue | undefined>(
  undefined
);

export const ShortcutProvider = ({
  children,
  options = {}
}: {
  children: ReactNode;
  options?: ShortcutManagerOptions;
}) => {
  const shortcutsState = useShortcuts(options);

  return (
    <ShortcutContext.Provider value={shortcutsState}>
      {children}
    </ShortcutContext.Provider>
  );
};

export const useShortcutContext = () => {
  const context = useContext(ShortcutContext);
  if (context === undefined) {
    throw new Error(
      "useShortcutContext must be used within a ShortcutProvider"
    );
  }
  return context;
};
