import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Share2, Target, TrendingUp } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { backendService as backend } from "../../services/backendService";
import { useAppStore } from "../../store/appStore";
import type { HabitLog } from "../../types";
import { Variant_ontime_late_failed } from "../../types";
import {
  getMonthStart,
  getTodayString,
  getWeekStart,
} from "../../utils/habitUtils";

type TimeFilter = "day" | "week" | "month" | "alltime";
type StatsSubTab = "overview" | "insights";

interface OverviewStats {
  failedCount: number;
  onTimeCount: number;
  maxPoints: number;
  totalCompletions: number;
  totalPoints: number;
  lateCount: number;
}

interface HabitStatsData {
  streak: number;
  failedCount: number;
  completionCount: number;
  totalPoints: number;
  lateCount: number;
}

export function StatsTab() {
  const { habits, settings } = useAppStore();
  const [subTab, setSubTab] = useState<StatsSubTab>("overview");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("day");
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<HabitLog[]>([]);
  const [dailyHistory, setDailyHistory] = useState<
    Array<{ date: string; count: number; points: number }>
  >([]);
  const [selectedHabitId, setSelectedHabitId] = useState<string>("");
  const [habitStats, setHabitStats] = useState<HabitStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);

  const getDateRange = (): [string, string] => {
    const today = getTodayString();
    switch (timeFilter) {
      case "day":
        return [today, today];
      case "week":
        return [getWeekStart(settings.mondayFirst), today];
      case "month":
        return [getMonthStart(), today];
      case "alltime":
        return ["2000-01-01", today];
    }
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const [start, end] = getDateRange();
      const [overview, logs] = await Promise.all([
        backend.getOverviewStats(start, end),
        backend.getLogsByDateRange(start, end),
      ]);
      setStats({
        failedCount: Number(overview.failedCount),
        onTimeCount: Number(overview.onTimeCount),
        maxPoints: overview.maxPoints,
        totalCompletions: Number(overview.totalCompletions),
        totalPoints: overview.totalPoints,
        lateCount: Number(overview.lateCount),
      });
      // Sort logs by date descending, filter failed/late for recent misses
      const sorted = [...logs].sort(
        (a, b) => Number(b.completedAt) - Number(a.completedAt),
      );
      setRecentLogs(
        sorted
          .filter(
            (l) =>
              l.status === Variant_ontime_late_failed.failed ||
              l.status === Variant_ontime_late_failed.late,
          )
          .slice(0, 10),
      );
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const [start, end] = getDateRange();
      const history = await backend.getDailyCompletionHistory(start, end);
      setDailyHistory(
        history.map(([date, count, points]) => ({
          date: date.slice(5), // MM-DD
          count: Number(count),
          points,
        })),
      );
    } catch {
      // silent
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadHabitStats = async (id: string) => {
    if (!id) return;
    try {
      const s = await backend.getHabitStats(id);
      setHabitStats({
        streak: Number(s.streak),
        failedCount: Number(s.failedCount),
        completionCount: Number(s.completionCount),
        totalPoints: s.totalPoints,
        lateCount: Number(s.lateCount),
      });
    } catch {
      toast.error("Failed to load habit stats");
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run on filter/tab change
  useEffect(() => {
    loadStats();
    if (subTab === "insights") loadHistory();
  }, [timeFilter, subTab]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when habit selection changes
  useEffect(() => {
    if (selectedHabitId) loadHabitStats(selectedHabitId);
  }, [selectedHabitId]);

  const handleShare = async () => {
    if (!stats) return;
    const impactScore =
      stats.maxPoints > 0
        ? Math.round((stats.totalPoints / stats.maxPoints) * 100)
        : 0;
    const text = `📊 StrictFlow Progress (${timeFilter})\n✅ On Time: ${stats.onTimeCount}\n⚠️ Late: ${stats.lateCount}\n❌ Failed: ${stats.failedCount}\n⭐ Impact Score: ${impactScore}%\n\nBuilt with StrictFlow`;
    if (navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // Cancelled
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Copied to clipboard!");
    }
  };

  const impactScore =
    stats && stats.maxPoints > 0
      ? Math.round((stats.totalPoints / stats.maxPoints) * 100)
      : 0;

  const pieData1 = stats
    ? [
        {
          name: "On Time",
          value: stats.onTimeCount,
          color: "oklch(0.65 0.18 145)",
        },
        { name: "Late", value: stats.lateCount, color: "oklch(0.72 0.2 85)" },
        {
          name: "Failed",
          value: stats.failedCount,
          color: "oklch(0.58 0.22 25)",
        },
      ].filter((d) => d.value > 0)
    : [];

  const pieData2 =
    stats && stats.maxPoints > 0
      ? [
          {
            name: "Earned",
            value: stats.totalPoints,
            color: "oklch(0.58 0.18 210)",
          },
          {
            name: "Missed",
            value: Math.max(0, stats.maxPoints - stats.totalPoints),
            color: "oklch(0.5 0.01 240 / 0.3)",
          },
        ]
      : [];

  const getHabitName = (habitId: string) =>
    habits.find((h) => h.id === habitId)?.name || habitId;

  const completionGoal = Number(settings.completionGoal);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="text-2xl font-display font-bold tracking-tight">
          Stats
        </h1>
      </div>

      {/* Sub-tabs */}
      <div className="flex px-4 gap-1 mb-3 shrink-0">
        <button
          data-ocid="stats.overview_tab"
          type="button"
          onClick={() => setSubTab("overview")}
          className={cn(
            "flex-1 h-9 rounded-xl text-sm font-semibold transition-colors",
            subTab === "overview"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          Overview
        </button>
        <button
          data-ocid="stats.insights_tab"
          type="button"
          onClick={() => setSubTab("insights")}
          className={cn(
            "flex-1 h-9 rounded-xl text-sm font-semibold transition-colors",
            subTab === "insights"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          Insights
        </button>
      </div>

      {/* Time Filter */}
      <div className="flex gap-1.5 px-4 mb-3 shrink-0">
        {(["day", "week", "month", "alltime"] as const).map((f) => (
          <button
            key={f}
            type="button"
            data-ocid={`stats.${f}_tab`}
            onClick={() => setTimeFilter(f)}
            className={cn(
              "flex-1 h-8 rounded-lg text-xs font-bold transition-colors",
              timeFilter === f
                ? "bg-foreground text-background"
                : "bg-muted text-muted-foreground",
            )}
          >
            {f === "alltime" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <ScrollArea className="flex-1 px-4">
        {subTab === "overview" && (
          <div className="space-y-4 pb-8">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-24 rounded-2xl" />
              </div>
            ) : (
              <>
                {/* Charts row */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Completion Status Chart */}
                  <div className="bg-card rounded-2xl p-3 shadow-card">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Completion
                    </p>
                    {pieData1.length > 0 ? (
                      <ResponsiveContainer width="100%" height={110}>
                        <PieChart>
                          <Pie
                            data={pieData1}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {pieData1.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              background: "oklch(var(--card))",
                              border: "1px solid oklch(var(--border))",
                              borderRadius: "8px",
                              fontSize: "11px",
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[110px] flex items-center justify-center text-xs text-muted-foreground">
                        No data
                      </div>
                    )}
                    <div className="space-y-0.5 mt-1">
                      <p className="text-[10px] text-green-500">
                        ✅ {stats?.onTimeCount ?? 0} on time
                      </p>
                      <p className="text-[10px] text-yellow-500">
                        ⚠️ {stats?.lateCount ?? 0} late
                      </p>
                      <p className="text-[10px] text-red-500">
                        ❌ {stats?.failedCount ?? 0} failed
                      </p>
                    </div>
                  </div>

                  {/* Impact Score Chart */}
                  <div className="bg-card rounded-2xl p-3 shadow-card">
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2">
                      Impact
                    </p>
                    {pieData2.length > 0 ? (
                      <ResponsiveContainer width="100%" height={110}>
                        <PieChart>
                          <Pie
                            data={pieData2}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={50}
                            dataKey="value"
                            strokeWidth={0}
                          >
                            {pieData2.map((entry) => (
                              <Cell key={entry.name} fill={entry.color} />
                            ))}
                          </Pie>
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-[110px] flex items-center justify-center text-xs text-muted-foreground">
                        No data
                      </div>
                    )}
                    <div className="mt-1">
                      <p className="text-lg font-bold text-primary">
                        {impactScore}%
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Impact score
                      </p>
                      {settings.impactGoal > 0 && (
                        <p className="text-[10px] text-muted-foreground">
                          Goal: {settings.impactGoal}%
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-3 gap-2">
                  {[
                    {
                      label: "Completions",
                      value: stats?.totalCompletions ?? 0,
                      icon: "✅",
                    },
                    {
                      label: "Points",
                      value: stats?.totalPoints?.toFixed(0) ?? 0,
                      icon: "⭐",
                    },
                    { label: "Impact %", value: `${impactScore}%`, icon: "🎯" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="bg-card rounded-xl p-3 shadow-card text-center"
                    >
                      <p className="text-xl">{item.icon}</p>
                      <p className="text-lg font-bold mt-0.5">{item.value}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {item.label}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Share Button */}
                <button
                  data-ocid="stats.share_button"
                  type="button"
                  onClick={handleShare}
                  className="w-full h-11 rounded-xl bg-primary/10 text-primary font-semibold text-sm flex items-center justify-center gap-2 hover:bg-primary/20 transition-colors"
                >
                  <Share2 className="h-4 w-4" />
                  Share Progress
                </button>

                {/* Recent Misses */}
                {recentLogs.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">
                      Recent Misses
                    </h3>
                    {recentLogs.map((log, i) => (
                      <div
                        key={log.id}
                        data-ocid={`stats.miss.item.${i + 1}`}
                        className="flex items-center justify-between p-3 bg-card rounded-xl shadow-card"
                      >
                        <div>
                          <p className="text-sm font-medium">
                            {getHabitName(log.habitId)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {log.date}
                          </p>
                        </div>
                        <span
                          className={cn(
                            "text-[10px] font-bold px-2 py-1 rounded-full",
                            log.status === Variant_ontime_late_failed.failed
                              ? "bg-status-failed"
                              : "bg-status-late",
                          )}
                        >
                          {log.status === Variant_ontime_late_failed.failed
                            ? "Failed"
                            : "Late"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {subTab === "insights" && (
          <div className="space-y-4 pb-8">
            {historyLoading ? (
              <div className="space-y-3">
                <Skeleton className="h-48 rounded-2xl" />
                <Skeleton className="h-48 rounded-2xl" />
              </div>
            ) : (
              <>
                {/* Daily Completions Chart */}
                <div className="bg-card rounded-2xl p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold">Daily Completions</h3>
                  </div>
                  {dailyHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <BarChart
                        data={dailyHistory}
                        margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="oklch(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{
                            fontSize: 10,
                            fill: "oklch(var(--muted-foreground))",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: "oklch(var(--muted-foreground))",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "oklch(var(--card))",
                            border: "1px solid oklch(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        {completionGoal > 0 && (
                          <ReferenceLine
                            y={completionGoal}
                            stroke="oklch(0.72 0.2 85)"
                            strokeDasharray="4 4"
                            label={{
                              value: "Goal",
                              position: "right",
                              fontSize: 10,
                              fill: "oklch(0.72 0.2 85)",
                            }}
                          />
                        )}
                        <Bar
                          dataKey="count"
                          fill="oklch(var(--primary))"
                          radius={[3, 3, 0, 0]}
                          name="Completions"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                      No data for this period
                    </div>
                  )}
                </div>

                {/* Impact Score Chart */}
                <div className="bg-card rounded-2xl p-4 shadow-card">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-bold">
                      Impact Score Over Time
                    </h3>
                  </div>
                  {dailyHistory.length > 0 ? (
                    <ResponsiveContainer width="100%" height={160}>
                      <LineChart
                        data={dailyHistory}
                        margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                      >
                        <CartesianGrid
                          strokeDasharray="3 3"
                          stroke="oklch(var(--border))"
                        />
                        <XAxis
                          dataKey="date"
                          tick={{
                            fontSize: 10,
                            fill: "oklch(var(--muted-foreground))",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tick={{
                            fontSize: 10,
                            fill: "oklch(var(--muted-foreground))",
                          }}
                          tickLine={false}
                          axisLine={false}
                        />
                        <Tooltip
                          contentStyle={{
                            background: "oklch(var(--card))",
                            border: "1px solid oklch(var(--border))",
                            borderRadius: "8px",
                            fontSize: "12px",
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="points"
                          stroke="oklch(0.72 0.2 195)"
                          strokeWidth={2}
                          dot={{ r: 3, fill: "oklch(0.72 0.2 195)" }}
                          name="Points"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">
                      No data for this period
                    </div>
                  )}
                </div>

                {/* Habit-Specific Stats */}
                <div className="bg-card rounded-2xl p-4 shadow-card space-y-3">
                  <h3 className="text-sm font-bold">Habit Details</h3>
                  <Select
                    value={selectedHabitId}
                    onValueChange={setSelectedHabitId}
                  >
                    <SelectTrigger data-ocid="stats.habit_select">
                      <SelectValue placeholder="Choose a habit..." />
                    </SelectTrigger>
                    <SelectContent>
                      {habits.map((h) => (
                        <SelectItem key={h.id} value={h.id}>
                          {h.icon} {h.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {habitStats && selectedHabitId && (
                    <div className="grid grid-cols-2 gap-2 animate-slide-up">
                      {[
                        {
                          label: "Completions",
                          value: habitStats.completionCount,
                          icon: "✅",
                        },
                        {
                          label: "Streak",
                          value: `${habitStats.streak} days`,
                          icon: "🔥",
                        },
                        {
                          label: "Late",
                          value: habitStats.lateCount,
                          icon: "⚠️",
                        },
                        {
                          label: "Failed",
                          value: habitStats.failedCount,
                          icon: "❌",
                        },
                        {
                          label: "Points",
                          value: habitStats.totalPoints.toFixed(0),
                          icon: "⭐",
                        },
                      ].map((item) => (
                        <div
                          key={item.label}
                          className="bg-muted/50 rounded-xl p-3"
                        >
                          <p className="text-base">{item.icon}</p>
                          <p className="text-lg font-bold">{item.value}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {item.label}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
