import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Download, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { backendService as backend } from "../../services/backendService";
import { useAppStore } from "../../store/appStore";
import type { AppSettings } from "../../types";
import type { Variant_monthly_daily_weekly } from "../../types";
import {
  getMonthStart,
  getTodayString,
  getWeekStart,
} from "../../utils/habitUtils";
import { ConfirmDialog } from "../shared/ConfirmDialog";

export function SettingsTab() {
  const { settings, setSettings, habits, groups } = useAppStore();
  const [deleteConfirm, setDeleteConfirm] = useState<
    "day" | "week" | "month" | "all" | null
  >(null);

  const updateSetting = async <K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K],
  ) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    try {
      await backend.updateSettings(newSettings);
    } catch {
      toast.error("Failed to save setting");
      setSettings(settings); // revert
    }
  };

  const handleDeleteLogs = async (type: "day" | "week" | "month" | "all") => {
    try {
      const today = getTodayString();
      switch (type) {
        case "day":
          await backend.deleteLogsByRange({ __kind__: "day", day: today });
          break;
        case "week":
          await backend.deleteLogsByRange({
            __kind__: "week",
            week: getWeekStart(settings.mondayFirst),
          });
          break;
        case "month":
          await backend.deleteLogsByRange({
            __kind__: "month",
            month: getMonthStart(),
          });
          break;
        case "all":
          await backend.deleteLogsByRange({
            __kind__: "alltime",
            alltime: null,
          });
          break;
      }
      setDeleteConfirm(null);
      toast.success("Logs deleted");
    } catch {
      toast.error("Failed to delete logs");
    }
  };

  const handleExport = async () => {
    try {
      const [allHabits, allGroups] = await Promise.all([
        backend.getHabits(),
        backend.getGroups(),
      ]);
      const today = getTodayString();
      const logs = await backend.getLogsByDateRange("2000-01-01", today);
      const data = {
        exportDate: today,
        habits: allHabits,
        groups: allGroups,
        logs,
        settings,
      };
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `strictflow-export-${today}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Data exported!");
    } catch {
      toast.error("Export failed");
    }
  };

  const SettingRow = ({
    label,
    description,
    children,
    "data-ocid": dataOcid,
  }: {
    label: string;
    description?: string;
    children: React.ReactNode;
    "data-ocid"?: string;
  }) => (
    <div
      className="flex items-center justify-between py-3.5 border-b border-border last:border-0"
      data-ocid={dataOcid}
    >
      <div className="flex-1 min-w-0 mr-4">
        <p className="text-sm font-semibold">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
    </div>
  );

  const SectionHeader = ({ title }: { title: string }) => (
    <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground pt-5 pb-1 px-0.5">
      {title}
    </h3>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="text-2xl font-display font-bold tracking-tight">
          Settings
        </h1>
      </div>

      <ScrollArea className="flex-1 px-4">
        <div className="pb-8">
          {/* Behavior */}
          <SectionHeader title="Behavior" />
          <div className="bg-card rounded-2xl px-4 shadow-card">
            <SettingRow
              label="Confirm before deleting"
              description="Show confirmation dialog"
            >
              <Switch
                data-ocid="settings.confirm_delete_switch"
                checked={settings.confirmDelete}
                onCheckedChange={(v) => updateSetting("confirmDelete", v)}
              />
            </SettingRow>
            <SettingRow label="Monday first" description="First day of week">
              <Switch
                data-ocid="settings.monday_first_switch"
                checked={settings.mondayFirst}
                onCheckedChange={(v) => updateSetting("mondayFirst", v)}
              />
            </SettingRow>
            <SettingRow
              label="Pause timers when inactive"
              description="Stop timers when app is hidden"
            >
              <Switch
                data-ocid="settings.pause_timers_switch"
                checked={settings.pauseTimers}
                onCheckedChange={(v) => updateSetting("pauseTimers", v)}
              />
            </SettingRow>
          </div>

          {/* Notifications */}
          <SectionHeader title="Notifications" />
          <div className="bg-card rounded-2xl px-4 shadow-card">
            <SettingRow
              label="Notification lead time"
              description="Minutes before habit start"
            >
              <Input
                type="number"
                min={0}
                value={Number(settings.notificationLeadTime)}
                onChange={(e) =>
                  updateSetting(
                    "notificationLeadTime",
                    BigInt(Number.parseInt(e.target.value) || 0),
                  )
                }
                className="w-20 h-8 text-right"
              />
            </SettingRow>
          </div>

          {/* Appearance */}
          <SectionHeader title="Appearance" />
          <div className="bg-card rounded-2xl px-4 shadow-card">
            <SettingRow label="Dark mode" description="Toggle dark theme">
              <Switch
                data-ocid="settings.dark_mode_switch"
                checked={settings.darkMode}
                onCheckedChange={(v) => updateSetting("darkMode", v)}
              />
            </SettingRow>
          </div>

          {/* Goals */}
          <SectionHeader title="Goals" />
          <div className="bg-card rounded-2xl px-4 shadow-card">
            <div className="py-3.5 border-b border-border">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">Completion goal</p>
                  <p className="text-xs text-muted-foreground">
                    % of habits to complete
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">
                  {Number(settings.completionGoal)}%
                </span>
              </div>
              <Slider
                data-ocid="settings.completion_goal_slider"
                min={0}
                max={100}
                step={5}
                value={[Number(settings.completionGoal)]}
                onValueChange={([v]) =>
                  updateSetting("completionGoal", BigInt(v))
                }
                className="mt-1"
              />
            </div>
            <div className="py-3.5 border-b border-border">
              <div className="flex justify-between mb-2">
                <div>
                  <p className="text-sm font-semibold">Impact goal</p>
                  <p className="text-xs text-muted-foreground">
                    % of habits to complete
                  </p>
                </div>
                <span className="text-sm font-bold text-primary">
                  {Math.round(settings.impactGoal)}%
                </span>
              </div>
              <Slider
                data-ocid="settings.impact_goal_slider"
                min={0}
                max={100}
                step={5}
                value={[settings.impactGoal]}
                onValueChange={([v]) => updateSetting("impactGoal", v)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Default Views */}
          <SectionHeader title="Default Views" />
          <div className="bg-card rounded-2xl px-4 shadow-card">
            <SettingRow label="Habits view" description="Default time period">
              <Select
                value={settings.defaultHabitsView}
                onValueChange={(v) =>
                  updateSetting(
                    "defaultHabitsView",
                    v as Variant_monthly_daily_weekly,
                  )
                }
              >
                <SelectTrigger
                  className="w-28 h-8"
                  data-ocid="settings.habits_view_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
            <SettingRow label="Stats view" description="Default time period">
              <Select
                value={settings.defaultStatsView}
                onValueChange={(v) =>
                  updateSetting(
                    "defaultStatsView",
                    v as Variant_monthly_daily_weekly,
                  )
                }
              >
                <SelectTrigger
                  className="w-28 h-8"
                  data-ocid="settings.stats_view_select"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </SettingRow>
          </div>

          {/* Data Management */}
          <SectionHeader title="Data Management" />
          <div className="space-y-2">
            <button
              data-ocid="settings.export_button"
              type="button"
              onClick={handleExport}
              className="w-full h-12 rounded-xl bg-card shadow-card flex items-center gap-3 px-4 hover:bg-muted/50 transition-colors"
            >
              <Download className="h-4 w-4 text-primary" />
              <div className="text-left">
                <p className="text-sm font-semibold">Export Data</p>
                <p className="text-xs text-muted-foreground">
                  {habits.length} habits, {groups.length} groups
                </p>
              </div>
            </button>

            <div className="bg-card rounded-2xl p-4 shadow-card space-y-2">
              <p className="text-xs font-bold text-destructive uppercase tracking-wider mb-3">
                Delete Logs
              </p>
              {[
                {
                  label: "Delete Today's Logs",
                  type: "day" as const,
                  ocid: "settings.delete_day_button",
                },
                {
                  label: "Delete This Week's Logs",
                  type: "week" as const,
                  ocid: "settings.delete_week_button",
                },
                {
                  label: "Delete This Month's Logs",
                  type: "month" as const,
                  ocid: "settings.delete_month_button",
                },
                {
                  label: "Delete All Logs",
                  type: "all" as const,
                  ocid: "settings.delete_all_button",
                },
              ].map(({ label, type, ocid }) => (
                <button
                  key={type}
                  data-ocid={ocid}
                  type="button"
                  onClick={() => {
                    if (settings.confirmDelete) {
                      setDeleteConfirm(type);
                    } else {
                      handleDeleteLogs(type);
                    }
                  }}
                  className="w-full h-10 rounded-xl flex items-center gap-2 px-3 bg-destructive/10 hover:bg-destructive/20 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  <span className="text-sm font-medium text-destructive">
                    {label}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="text-center py-6 mt-2">
            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()}.{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-muted-foreground transition-colors"
              >
                Built with ♥ using caffeine.ai
              </a>
            </p>
          </div>
        </div>
      </ScrollArea>

      {/* Delete Confirm Dialog */}
      <ConfirmDialog
        open={!!deleteConfirm}
        onOpenChange={(o) => !o && setDeleteConfirm(null)}
        title="Delete Logs"
        description={`This will permanently delete all ${deleteConfirm === "all" ? "" : `${deleteConfirm}'s`} habit logs. This action cannot be undone.`}
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteConfirm && handleDeleteLogs(deleteConfirm)}
      />
    </div>
  );
}
