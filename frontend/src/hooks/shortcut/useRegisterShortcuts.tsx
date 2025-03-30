import { useEffect, useMemo } from "react";
import { ShortcutConfig } from "./types";
import { useShortcutContext } from "../../contexts/shortcut/provider";

export const useRegisterShortcuts = (
  sectionHeading: string,
  shortcuts: ShortcutConfig[],
  deps: any[] = []
) => {
  const { registerShortcut, unregisterShortcut } = useShortcutContext();

  const memoizedShortcuts = useMemo(() => shortcuts, [...deps]);

  useEffect(() => {
    memoizedShortcuts.forEach((shortcut) => {
      registerShortcut(sectionHeading, shortcut);
    });

    return () => {
      memoizedShortcuts.forEach((shortcut) => {
        unregisterShortcut(sectionHeading, shortcut.key, shortcut.modifier);
      });
    };
  }, [sectionHeading, memoizedShortcuts, registerShortcut, unregisterShortcut]);

  return {
    registerShortcut: (shortcut: ShortcutConfig) =>
      registerShortcut(sectionHeading, shortcut),
    unregisterShortcut: (key: string, modifier?: string) =>
      unregisterShortcut(sectionHeading, key, modifier)
  };
};
