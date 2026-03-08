import { cn } from "@/lib/utils";
import { CheckCircle, Clock, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { backendService as backend } from "../../services/backendService";
import { useAppStore } from "../../store/appStore";
import type { Habit, HabitLog } from "../../types";
import { Variant_ontime_late_failed, Variant_timer_normal } from "../../types";
import type { ActiveTimer } from "../../types";
import {
  formatDuration,
  formatTime,
  generateId,
  getCompletionStatus,
  getHabitStatus,
  getPointsForStatus,
  getTodayString,
  parseTimeToMinutes,
  statusClass,
  statusLabel,
} from "../../utils/habitUtils";
import { StarRating } from "../shared/StarRating";

interface HabitCardProps {
  habit: Habit;
  todayLogs: HabitLog[];
  index: number;
  onLogCreated: () => void;
}

export function HabitCard({
  habit,
  todayLogs,
  index,
  onLogCreated,
}: HabitCardProps) {
  const { activeTimers, startTimer, stopTimer, settings } = useAppStore();
  const activeTimer = activeTimers.get(habit.id);
  const [remaining, setRemaining] = useState<number>(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | undefined>(
    undefined,
  );

  const status = getHabitStatus(habit, todayLogs);
  const isCompleted = status === "done" || status === "done_late";
  const isFailed = status === "failed";
  const isTimer = habit.mode === Variant_timer_normal.timer;

  useEffect(() => {
    if (!activeTimer) {
      clearInterval(intervalRef.current);
      return;
    }

    const updateRemaining = () => {
      const elapsed = (Date.now() - activeTimer.startedAt) / 1000;
      const rem = Math.max(0, activeTimer.durationSeconds - elapsed);
      setRemaining(Math.ceil(rem));

      if (rem <= 0) {
        clearInterval(intervalRef.current);
        handleTimerComplete();
      }
    };

    updateRemaining();
    intervalRef.current = setInterval(updateRemaining, 1000);
    return () => clearInterval(intervalRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTimer]);

  // Pause timer when settings say so and app is hidden
  useEffect(() => {
    if (!settings.pauseTimers || !activeTimer) return;
    const handleVisibility = () => {
      if (document.hidden) {
        clearInterval(intervalRef.current);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [settings.pauseTimers, activeTimer]);

  const handleTimerComplete = useCallback(async () => {
    stopTimer(habit.id);
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const completionStatus = getCompletionStatus(habit, nowMinutes);
    const points = getPointsForStatus(
      Number(habit.importance),
      completionStatus,
    );
    try {
      await backend.logHabitCompletion(
        generateId(),
        habit.id,
        getTodayString(),
        completionStatus,
        BigInt(Date.now()),
        points,
      );
      onLogCreated();
      toast.success(`${habit.name} completed! +${points} pts`);
    } catch {
      toast.error("Failed to log completion");
    }
  }, [habit, stopTimer, onLogCreated]);

  const handleStartTimer = () => {
    if (isCompleted || activeTimer) return;
    const durationSecs = Number(habit.timerDuration) * 60;
    startTimer(habit.id, durationSecs);
    toast.info(`Timer started for ${habit.name}`);
  };

  const handleDone = async () => {
    if (isCompleted || isFailed) return;
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const completionStatus = getCompletionStatus(habit, nowMinutes);
    const points = getPointsForStatus(
      Number(habit.importance),
      completionStatus,
    );
    try {
      await backend.logHabitCompletion(
        generateId(),
        habit.id,
        getTodayString(),
        completionStatus,
        BigInt(Date.now()),
        points,
      );
      onLogCreated();
      const lateMsg =
        completionStatus === Variant_ontime_late_failed.late ? " (late)" : "";
      toast.success(`${habit.name} done${lateMsg}! +${points} pts`);
    } catch {
      toast.error("Failed to log completion");
    }
  };

  const dueMinutes = parseTimeToMinutes(habit.dueTime);
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const isLateWindow =
    habit.graceEnabled &&
    nowMinutes > dueMinutes &&
    nowMinutes <= dueMinutes + Number(habit.gracePeriod);

  return (
    <div
      data-ocid={`habit.item.${index}`}
      className={cn(
        "rounded-2xl overflow-hidden bg-card shadow-card transition-all animate-slide-up",
        isCompleted && "opacity-70",
        isFailed && !isCompleted && "opacity-60",
      )}
      style={{
        borderLeft: `4px solid ${habit.color}`,
      }}
    >
      <div className="p-3.5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 mt-0.5"
            style={{ backgroundColor: `${habit.color}22` }}
          >
            {habit.icon}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p
                  className={cn(
                    "font-semibold text-[15px] leading-tight truncate",
                    isCompleted && "line-through text-muted-foreground",
                  )}
                >
                  {habit.name}
                </p>
                <StarRating
                  value={Number(habit.importance)}
                  size="sm"
                  className="mt-0.5"
                />
              </div>

              {/* Status badge */}
              <span
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap shrink-0",
                  statusClass(status),
                )}
              >
                {statusLabel(status)}
              </span>
            </div>

            {/* Times */}
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>
                  {formatTime(habit.startTime)} – {formatTime(habit.dueTime)}
                </span>
              </div>
              {isLateWindow && !isCompleted && (
                <span className="text-xs font-medium text-yellow-500">
                  Late window
                </span>
              )}
            </div>

            {/* Active timer display */}
            {activeTimer && (
              <div className="mt-2 flex items-center gap-2">
                <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${(remaining / activeTimer.durationSeconds) * 100}%`,
                    }}
                  />
                </div>
                <span
                  className={cn(
                    "text-sm font-mono font-bold",
                    remaining <= 10
                      ? "text-destructive animate-timer-pulse"
                      : "text-primary",
                  )}
                >
                  {formatDuration(remaining)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Action button */}
        {!isCompleted && !isFailed && (
          <div className="mt-3 flex justify-end">
            {isTimer ? (
              activeTimer ? (
                <span className="text-xs text-muted-foreground italic">
                  Timer running...
                </span>
              ) : (
                <button
                  data-ocid={`habit.start_button.${index}`}
                  type="button"
                  onClick={handleStartTimer}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform active:scale-95"
                  style={{ backgroundColor: habit.color }}
                >
                  <Play className="h-3.5 w-3.5 fill-white" />
                  Start
                </button>
              )
            ) : (
              <button
                data-ocid={`habit.done_button.${index}`}
                type="button"
                onClick={handleDone}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold text-white transition-transform active:scale-95"
                style={{ backgroundColor: habit.color }}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Done
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
