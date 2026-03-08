import { create } from "zustand";
import type {
  ActiveTab,
  ActiveTimer,
  AppSettings,
  Group,
  Habit,
} from "../types";
import { DEFAULT_SETTINGS } from "../types";

interface AppState {
  habits: Habit[];
  groups: Group[];
  settings: AppSettings;
  activeTab: ActiveTab;
  activeTimers: Map<string, ActiveTimer>;
  isLoading: boolean;

  setHabits: (habits: Habit[]) => void;
  setGroups: (groups: Group[]) => void;
  setSettings: (settings: AppSettings) => void;
  setActiveTab: (tab: ActiveTab) => void;
  startTimer: (habitId: string, durationSeconds: number) => void;
  stopTimer: (habitId: string) => void;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  habits: [],
  groups: [],
  settings: DEFAULT_SETTINGS,
  activeTab: "habits",
  activeTimers: new Map(),
  isLoading: true,

  setHabits: (habits) => set({ habits }),
  setGroups: (groups) => set({ groups }),
  setSettings: (settings) => set({ settings }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  startTimer: (habitId, durationSeconds) =>
    set((state) => {
      const newTimers = new Map(state.activeTimers);
      newTimers.set(habitId, {
        habitId,
        startedAt: Date.now(),
        durationSeconds,
      });
      return { activeTimers: newTimers };
    }),
  stopTimer: (habitId) =>
    set((state) => {
      const newTimers = new Map(state.activeTimers);
      newTimers.delete(habitId);
      return { activeTimers: newTimers };
    }),
  setLoading: (loading) => set({ isLoading: loading }),
}));
