import { useEffect, useMemo } from "react";
import { ShortcutConfig } from "./types";
import { useShortcutContext } from "@/contexts/shortcut/provider";

export const useRegisterShortcuts = (
  shortcuts: ShortcutConfig[],
  deps: any[] = []
) => {
  const { registerShortcut, unregisterShortcut } = useShortcutContext();

  const memoizedShortcuts = useMemo(() => shortcuts, [...deps]);

  useEffect(() => {
    memoizedShortcuts.forEach((shortcut) => {
      registerShortcut(shortcut);
    });

    return () => {
      memoizedShortcuts.forEach((shortcut) => {
        unregisterShortcut(shortcut.key, shortcut.modifier);
      });
    };
  }, [memoizedShortcuts, registerShortcut, unregisterShortcut]);

  return {
    registerShortcut,
    unregisterShortcut
  };
};
