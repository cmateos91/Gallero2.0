import { useState, useCallback } from "react";

const STORAGE_KEY = "gallos_settings";

interface Settings {
  sound: boolean;
  navStyle: "grid" | "wheel";
  tutorialsSeen: Record<string, boolean>;
}

const defaults: Settings = {
  sound: true,
  navStyle: "wheel",
  tutorialsSeen: {},
};

function load(): Settings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaults };
    return { ...defaults, ...(JSON.parse(raw) as Partial<Settings>) };
  } catch {
    return { ...defaults };
  }
}

function persist(settings: Settings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

let cached: Settings | null = null;

function getSettings(): Settings {
  cached ??= load();
  return cached;
}

export function useSettings() {
  const [settings, setSettings] = useState<Settings>(getSettings);

  const updateSetting = useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => {
        const next = { ...prev, [key]: value };
        persist(next);
        cached = next;
        return next;
      });
    },
    [],
  );

  const markTutorialSeen = useCallback(
    (scene: string) => {
      setSettings((prev) => {
        const next = {
          ...prev,
          tutorialsSeen: { ...prev.tutorialsSeen, [scene]: true },
        };
        persist(next);
        cached = next;
        return next;
      });
    },
    [],
  );

  return { settings, updateSetting, markTutorialSeen };
}
