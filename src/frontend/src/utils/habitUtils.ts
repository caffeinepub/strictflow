import type { Habit, HabitLog, HabitStatus } from "../types";
import { Variant_ontime_late_failed } from "../types";

export function getTodayString(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export function getWeekStart(mondayFirst: boolean): string {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const diff = mondayFirst ? (day === 0 ? -6 : 1 - day) : -day;
  const start = new Date(now);
  start.setDate(now.getDate() + diff);
  return `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`;
}

export function getMonthStart(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function formatTime(timeStr: string): string {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const hour = Number.parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(":").map(Number);
  return h * 60 + m;
}

export function getHabitStatus(
  habit: Habit,
  todayLogs: HabitLog[],
  now: Date = new Date(),
): HabitStatus {
  const todayStr = getTodayString();

  // Check if completed today
  const completionLog = todayLogs.find(
    (l) => l.habitId === habit.id && l.date === todayStr,
  );
  if (completionLog) {
    if (completionLog.status === Variant_ontime_late_failed.late)
      return "done_late";
    return "done";
  }

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = parseTimeToMinutes(habit.startTime);
  const dueMinutes = parseTimeToMinutes(habit.dueTime);
  const graceMinutes = habit.graceEnabled ? Number(habit.gracePeriod) : 0;

  if (nowMinutes < startMinutes) return "upcoming";
  if (nowMinutes <= dueMinutes) return "active";
  if (habit.graceEnabled && nowMinutes <= dueMinutes + graceMinutes)
    return "active"; // late but can still complete
  return "failed";
}

export function isHabitScheduledToday(habit: Habit): boolean {
  if (habit.repeatType === "onetime") return true; // show until completed or hidden
  const today = new Date().getDay(); // 0=Sun
  return habit.weekdays.map(Number).includes(today);
}

export function getPointsForStatus(
  importance: number,
  status: Variant_ontime_late_failed,
): number {
  if (status === Variant_ontime_late_failed.ontime) return importance;
  if (status === Variant_ontime_late_failed.late) return importance * 0.5;
  return 0;
}

export function getCompletionStatus(
  habit: Habit,
  nowMinutes: number,
): Variant_ontime_late_failed {
  const dueMinutes = parseTimeToMinutes(habit.dueTime);
  const graceMinutes = habit.graceEnabled ? Number(habit.gracePeriod) : 0;

  if (nowMinutes <= dueMinutes) return Variant_ontime_late_failed.ontime;
  if (habit.graceEnabled && nowMinutes <= dueMinutes + graceMinutes)
    return Variant_ontime_late_failed.late;
  return Variant_ontime_late_failed.failed;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function statusLabel(status: HabitStatus): string {
  switch (status) {
    case "upcoming":
      return "Upcoming";
    case "active":
      return "Pending";
    case "in_progress":
      return "In Progress";
    case "done":
      return "Done";
    case "done_late":
      return "Done Late";
    case "failed":
      return "Failed";
  }
}

export function statusClass(status: HabitStatus): string {
  switch (status) {
    case "done":
      return "bg-status-ontime";
    case "done_late":
      return "bg-status-late";
    case "failed":
      return "bg-status-failed";
    case "active":
      return "bg-blue-500/15 text-blue-500";
    case "in_progress":
      return "bg-primary/15 text-primary";
    case "upcoming":
      return "bg-muted text-muted-foreground";
  }
}
