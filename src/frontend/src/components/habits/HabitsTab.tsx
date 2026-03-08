import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { backendService as backend } from "../../services/backendService";
import { useAppStore } from "../../store/appStore";
import type { HabitFormData, HabitLog } from "../../types";
import { Variant_onetime_daily, Variant_timer_normal } from "../../types";
import {
  generateId,
  getTodayString,
  isHabitScheduledToday,
} from "../../utils/habitUtils";
import { HabitForm } from "../shared/HabitForm";
import { HabitCard } from "./HabitCard";

export function HabitsTab() {
  const { habits, groups, settings, isLoading, setHabits } = useAppStore();
  const [todayLogs, setTodayLogs] = useState<HabitLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(true);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const today = getTodayString();

  const loadLogs = async () => {
    try {
      const logs = await backend.getLogsByDateRange(today, today);
      setTodayLogs(logs);
    } catch {
      // silent
    } finally {
      setLogsLoading(false);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: run once on mount
  useEffect(() => {
    loadLogs();
  }, []);

  const refreshHabits = async () => {
    try {
      const updated = await backend.getHabits();
      setHabits(updated);
    } catch {
      // silent
    }
  };

  const handleLogCreated = () => {
    loadLogs();
    refreshHabits();
  };

  const handleAddHabit = async (data: HabitFormData) => {
    setIsSaving(true);
    try {
      const id = generateId();
      await backend.createHabit(
        id,
        data.name,
        data.color,
        data.icon,
        BigInt(data.importance),
        data.mode === "timer"
          ? Variant_timer_normal.timer
          : Variant_timer_normal.normal,
        BigInt(data.timerDuration),
        data.startTime,
        data.dueTime,
        data.graceEnabled,
        BigInt(data.gracePeriod),
        data.repeatType === "onetime"
          ? Variant_onetime_daily.onetime
          : Variant_onetime_daily.daily,
        data.weekdays.map(BigInt),
        data.groupId || null,
        data.hidden,
      );
      await refreshHabits();
      setShowAddSheet(false);
      toast.success("Habit created!");
    } catch (err) {
      console.error("Failed to create habit:", err);
      toast.error("Failed to create habit");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter: non-hidden, scheduled for today
  const visibleHabits = habits.filter(
    (h) => !h.hidden && isHabitScheduledToday(h),
  );

  // Group by group
  const grouped = new Map<string, typeof visibleHabits>();
  const ungrouped: typeof visibleHabits = [];

  for (const habit of visibleHabits) {
    if (habit.groupId) {
      const arr = grouped.get(habit.groupId) || [];
      arr.push(habit);
      grouped.set(habit.groupId, arr);
    } else {
      ungrouped.push(habit);
    }
  }

  let habitIndex = 0;

  const formatDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 shrink-0">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{formatDate()}</span>
        </div>
        <h1 className="text-2xl font-display font-bold tracking-tight">
          Today
        </h1>
        <p className="text-sm text-muted-foreground">
          {visibleHabits.length} habit{visibleHabits.length !== 1 ? "s" : ""}{" "}
          scheduled
        </p>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-4">
        {isLoading || logsLoading ? (
          <div className="space-y-3 py-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : visibleHabits.length === 0 ? (
          <div
            data-ocid="habits.empty_state"
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div className="text-5xl mb-4">🎯</div>
            <p className="text-lg font-semibold">No habits today</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tap + to add your first habit
            </p>
          </div>
        ) : (
          <div className="space-y-3 py-2 pb-4">
            {/* Groups */}
            {Array.from(grouped.entries()).map(([groupId, groupHabits]) => {
              const group = groups.find((g) => g.id === groupId);
              return (
                <div key={groupId}>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: group?.color || "#888" }}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {group?.name || "Unknown Group"}
                    </span>
                  </div>
                  <div className="space-y-2.5">
                    {groupHabits.map((habit) => {
                      habitIndex++;
                      return (
                        <HabitCard
                          key={habit.id}
                          habit={habit}
                          todayLogs={todayLogs}
                          index={habitIndex}
                          onLogCreated={handleLogCreated}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Ungrouped */}
            {ungrouped.length > 0 && (
              <div>
                {grouped.size > 0 && (
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      Other
                    </span>
                  </div>
                )}
                <div className="space-y-2.5">
                  {ungrouped.map((habit) => {
                    habitIndex++;
                    return (
                      <HabitCard
                        key={habit.id}
                        habit={habit}
                        todayLogs={todayLogs}
                        index={habitIndex}
                        onLogCreated={handleLogCreated}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </ScrollArea>

      {/* FAB */}
      <button
        data-ocid="habits.add_button"
        type="button"
        onClick={() => setShowAddSheet(true)}
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-float flex items-center justify-center transition-transform active:scale-95 hover:scale-105 z-40"
        style={{
          bottom: "calc(6.5rem + 28px + env(safe-area-inset-bottom, 0px))",
        }}
      >
        <Plus className="h-6 w-6 font-bold" strokeWidth={2.5} />
      </button>

      {/* Add Sheet */}
      <Sheet open={showAddSheet} onOpenChange={setShowAddSheet}>
        <SheetContent side="bottom" className="h-[90vh] rounded-t-2xl p-0">
          <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
            <SheetTitle className="text-left">New Habit</SheetTitle>
          </SheetHeader>
          <HabitForm
            groups={groups}
            mondayFirst={settings.mondayFirst}
            onSave={handleAddHabit}
            onCancel={() => setShowAddSheet(false)}
            isSaving={isSaving}
          />
        </SheetContent>
      </Sheet>
    </div>
  );
}
