export interface ShortcutConfig {
  key: string;
  modifier?: "meta" | "ctrl" | "alt" | "shift";
  condition?: (event: KeyboardEvent) => boolean;
  action: () => void;
  description?: string;
}

export interface ShortcutSection {
  heading: string;
  shortcuts: ShortcutConfig[];
}

export interface ShortcutManagerOptions {
  excludeWhenInputFocused?: boolean;
}
