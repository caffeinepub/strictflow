import { Variant_onetime_daily, Variant_timer_normal } from "../types";
import { backendService as backend } from "./backendService";

/**
 * Seeds the app with sample habits if no habits exist.
 */
export async function seedSampleData(): Promise<void> {
  try {
    const existing = await backend.getHabits();
    if (existing.length > 0) return; // Already has data

    // Sample groups
    const groupIds = {
      fitness: "group-fitness",
      work: "group-work",
    };

    await Promise.all([
      backend.createGroup(groupIds.fitness, "Fitness", "#22c55e"),
      backend.createGroup(groupIds.work, "Deep Work", "#3b82f6"),
    ]);

    // 4 sample habits showcasing all features:
    // 1. Morning Run — timer, high importance (5), green, Mon-Fri
    // 2. Evening Journal — normal, low importance (1), pink, all week
    // 3. Deep Work Session — timer, importance 4, blue, Mon-Fri
    // 4. Take Vitamins — normal, importance 3, orange, all week
    const habits = [
      {
        id: "habit-morning-run",
        name: "Morning Run",
        color: "#22c55e",
        icon: "🏃",
        importance: BigInt(5),
        mode: Variant_timer_normal.timer,
        timerDuration: BigInt(30),
        startTime: "06:30",
        dueTime: "07:00", // 30 min to complete
        graceEnabled: true,
        gracePeriod: BigInt(10),
        repeatType: Variant_onetime_daily.daily,
        weekdays: [1, 2, 3, 4, 5].map(BigInt),
        groupId: groupIds.fitness,
        hidden: false,
      },
      {
        id: "habit-evening-journal",
        name: "Evening Journal",
        color: "#ec4899",
        icon: "✍️",
        importance: BigInt(1),
        mode: Variant_timer_normal.normal,
        timerDuration: BigInt(0),
        startTime: "20:00",
        dueTime: "20:15", // 15 min to complete
        graceEnabled: true,
        gracePeriod: BigInt(30),
        repeatType: Variant_onetime_daily.daily,
        weekdays: [0, 1, 2, 3, 4, 5, 6].map(BigInt),
        groupId: null,
        hidden: false,
      },
      {
        id: "habit-deep-work",
        name: "Deep Work Session",
        color: "#3b82f6",
        icon: "💻",
        importance: BigInt(4),
        mode: Variant_timer_normal.timer,
        timerDuration: BigInt(45),
        startTime: "09:00",
        dueTime: "09:45", // 45 min to complete
        graceEnabled: false,
        gracePeriod: BigInt(0),
        repeatType: Variant_onetime_daily.daily,
        weekdays: [1, 2, 3, 4, 5].map(BigInt),
        groupId: groupIds.work,
        hidden: false,
      },
      {
        id: "habit-vitamins",
        name: "Take Vitamins",
        color: "#f97316",
        icon: "💊",
        importance: BigInt(3),
        mode: Variant_timer_normal.normal,
        timerDuration: BigInt(0),
        startTime: "08:00",
        dueTime: "08:05", // 5 min to complete
        graceEnabled: true,
        gracePeriod: BigInt(60),
        repeatType: Variant_onetime_daily.daily,
        weekdays: [0, 1, 2, 3, 4, 5, 6].map(BigInt),
        groupId: null,
        hidden: false,
      },
    ];

    await Promise.all(
      habits.map((h) =>
        backend.createHabit(
          h.id,
          h.name,
          h.color,
          h.icon,
          h.importance,
          h.mode,
          h.timerDuration,
          h.startTime,
          h.dueTime,
          h.graceEnabled,
          h.gracePeriod,
          h.repeatType,
          h.weekdays,
          h.groupId,
          h.hidden,
        ),
      ),
    );
  } catch {
    // Silently fail — sample data is optional
  }
}
