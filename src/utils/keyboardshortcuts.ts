const SHORTCUTS = {
  SEARCH_BAR: ["control", "m"],
};

type ShortcutHandler = () => void;

interface ShortcutEntry {
  keys: string[];
  handler: ShortcutHandler;
}

const shortcuts: ShortcutEntry[] = [];

export function registerShortcut(keys: string[], handler: ShortcutHandler) {
  shortcuts.push({ keys, handler });
}

function matchShortcut(e: KeyboardEvent, keys: string[]) {
  const keySet = new Set(keys.map((k) => k.toLowerCase()));
  const ctrl = keySet.has("control");
  const shift = keySet.has("shift");
  const alt = keySet.has("alt");
  const meta = keySet.has("meta");

  if (
    ctrl !== e.ctrlKey ||
    shift !== e.shiftKey ||
    alt !== e.altKey ||
    meta !== e.metaKey
  )
    return false;

  const mainKey = keys.find(
    (k) => !["control", "shift", "alt", "meta"].includes(k.toLowerCase()),
  );

  return mainKey?.toLowerCase() === e.key.toLowerCase();
}

export function initShortcuts() {
  document.addEventListener("keydown", (e) => {
    shortcuts.forEach(({ keys, handler }) => {
      if (matchShortcut(e, keys)) {
        e.preventDefault();
        handler();
      }
    });
  });
}

export function registerSearchBarShortcut(handler: ShortcutHandler) {
  registerShortcut(SHORTCUTS.SEARCH_BAR, handler);
}
