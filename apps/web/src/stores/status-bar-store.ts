import { create } from "zustand";

interface StatusBarState {
  notifications: number;
  errors: number;
  warnings: number;
  tasksRunning: number;
  customStatus?: string;
  setNotifications: (count: number) => void;
  setErrors: (count: number) => void;
  setWarnings: (count: number) => void;
  setTasksRunning: (count: number) => void;
  setCustomStatus: (status?: string) => void;
  incrementNotifications: () => void;
  decrementNotifications: () => void;
  clearNotifications: () => void;
  reset: () => void;
}

export const useStatusBar = create<StatusBarState>((set) => ({
  notifications: 0,
  errors: 0,
  warnings: 0,
  tasksRunning: 0,
  customStatus: undefined,

  setNotifications: (count) => set({ notifications: count }),
  setErrors: (count) => set({ errors: count }),
  setWarnings: (count) => set({ warnings: count }),
  setTasksRunning: (count) => set({ tasksRunning: count }),
  setCustomStatus: (status) => set({ customStatus: status }),

  incrementNotifications: () =>
    set((state) => ({ notifications: state.notifications + 1 })),
  decrementNotifications: () =>
    set((state) => ({ notifications: Math.max(0, state.notifications - 1) })),
  clearNotifications: () => set({ notifications: 0 }),

  reset: () =>
    set({
      notifications: 0,
      errors: 0,
      warnings: 0,
      tasksRunning: 0,
      customStatus: undefined,
    }),
}));
