import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Group, HabitFormData } from "../../types";
import {
  HABIT_ICONS,
  PRESET_COLORS,
  WEEKDAYS_MON_FIRST,
  WEEKDAYS_SUN_FIRST,
  WEEKDAY_VALUES_MON_FIRST,
  WEEKDAY_VALUES_SUN_FIRST,
} from "../../types";
import { AnalogClockPicker } from "./AnalogClockPicker";
import { StarRating } from "./StarRating";

interface HabitFormProps {
  initialData?: Partial<HabitFormData>;
  groups: Group[];
  mondayFirst: boolean;
  onSave: (data: HabitFormData) => Promise<void>;
  onCancel: () => void;
  isSaving?: boolean;
}

const defaultData: HabitFormData = {
  name: "",
  color: "#3b82f6",
  icon: "✅",
  importance: 3,
  mode: "normal",
  timerDuration: 25,
  startTime: "08:00",
  dueTime: "09:00",
  timeToComplete: 30,
  graceEnabled: true,
  gracePeriod: 15,
  repeatType: "daily",
  weekdays: [1, 2, 3, 4, 5],
  groupId: "",
  hidden: false,
};

export function HabitForm({
  initialData,
  groups,
  mondayFirst,
  onSave,
  onCancel,
  isSaving,
}: HabitFormProps) {
  const [data, setData] = useState<HabitFormData>({
    ...defaultData,
    ...initialData,
  });
  const [showStartClock, setShowStartClock] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColor, setCustomColor] = useState("");

  const weekdayLabels = mondayFirst ? WEEKDAYS_MON_FIRST : WEEKDAYS_SUN_FIRST;
  const weekdayValues = mondayFirst
    ? WEEKDAY_VALUES_MON_FIRST
    : WEEKDAY_VALUES_SUN_FIRST;

  const toggleWeekday = (val: number) => {
    setData((d) => ({
      ...d,
      weekdays: d.weekdays.includes(val)
        ? d.weekdays.filter((w) => w !== val)
        : [...d.weekdays, val],
    }));
  };

  const handleSave = async () => {
    if (!data.name.trim()) return;
    // Compute dueTime from startTime + timeToComplete
    const [sh, sm] = data.startTime.split(":").map(Number);
    const totalMins = sh * 60 + sm + data.timeToComplete;
    const dh = Math.floor(totalMins / 60) % 24;
    const dm = totalMins % 60;
    const computedDueTime = `${String(dh).padStart(2, "0")}:${String(dm).padStart(2, "0")}`;
    await onSave({ ...data, dueTime: computedDueTime });
  };

  const formatTime12 = (time: string) => {
    if (!time) return "";
    const [h, m] = time.split(":").map(Number);
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h % 12 || 12;
    return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
  };

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-5 p-4 pb-8">
        {/* Name */}
        <div className="space-y-1.5">
          <Label htmlFor="habit-name" className="text-sm font-semibold">
            Name
          </Label>
          <Input
            id="habit-name"
            data-ocid="habit_form.name_input"
            value={data.name}
            onChange={(e) => setData((d) => ({ ...d, name: e.target.value }))}
            placeholder="e.g. Morning Run"
            className="h-11"
          />
        </div>

        {/* Icon Picker — expandable */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Icon</Label>
          <button
            type="button"
            onClick={() => setShowIconPicker(!showIconPicker)}
            className="flex items-center gap-3 w-full h-12 px-4 rounded-xl bg-muted hover:bg-muted/70 transition-colors"
          >
            <span className="text-2xl">{data.icon}</span>
            <span className="text-sm font-medium text-muted-foreground flex-1 text-left">
              {showIconPicker ? "Hide icons" : "Change icon"}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                showIconPicker && "rotate-180",
              )}
            />
          </button>
          {showIconPicker && (
            <div className="grid grid-cols-8 gap-1.5 p-3 bg-muted/40 rounded-xl">
              {HABIT_ICONS.map((icon) => (
                <button
                  key={icon}
                  type="button"
                  onClick={() => {
                    setData((d) => ({ ...d, icon }));
                    setShowIconPicker(false);
                  }}
                  className={cn(
                    "text-2xl h-10 w-10 rounded-lg flex items-center justify-center transition-all",
                    data.icon === icon
                      ? "bg-primary/20 ring-2 ring-primary scale-110"
                      : "bg-card hover:bg-primary/10",
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Color Picker — expandable */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Color</Label>
          <button
            type="button"
            onClick={() => setShowColorPicker(!showColorPicker)}
            className="flex items-center gap-3 w-full h-12 px-4 rounded-xl bg-muted hover:bg-muted/70 transition-colors"
          >
            <div
              className="w-6 h-6 rounded-full border-2 border-border shrink-0"
              style={{ backgroundColor: data.color }}
            />
            <span className="text-sm font-medium text-muted-foreground flex-1 text-left">
              {showColorPicker ? "Hide colors" : "Change color"}
            </span>
            <ChevronDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                showColorPicker && "rotate-180",
              )}
            />
          </button>
          {showColorPicker && (
            <div className="p-3 bg-muted/40 rounded-xl space-y-3">
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setData((d) => ({ ...d, color }))}
                    className={cn(
                      "h-8 w-8 rounded-full transition-transform border-2",
                      data.color === color
                        ? "scale-110 border-foreground"
                        : "border-transparent hover:scale-105",
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Custom hex #ffffff"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="h-9 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (/^#[0-9a-fA-F]{6}$/.test(customColor)) {
                      setData((d) => ({ ...d, color: customColor }));
                    }
                  }}
                  className="h-9 px-3 rounded-lg bg-muted text-sm font-medium hover:bg-accent"
                >
                  Apply
                </button>
                <div
                  className="h-8 w-8 rounded-full border-2 border-border shrink-0"
                  style={{ backgroundColor: data.color }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Importance — full width centered */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold text-center block">
            Importance
          </Label>
          <div className="flex justify-center">
            <StarRating
              value={data.importance}
              onChange={(v) => setData((d) => ({ ...d, importance: v }))}
              size="xl"
            />
          </div>
        </div>

        {/* Mode */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Mode</Label>
          <div className="flex gap-2">
            {(["normal", "timer"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setData((d) => ({ ...d, mode }))}
                className={cn(
                  "flex-1 h-10 rounded-lg text-sm font-medium capitalize transition-colors",
                  data.mode === mode
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {mode === "timer" ? "⏱ Timer" : "✓ Normal"}
              </button>
            ))}
          </div>
          {data.mode === "timer" && (
            <div className="flex items-center gap-2 mt-2">
              <Label className="text-sm shrink-0">Duration (min)</Label>
              <Input
                type="number"
                min={1}
                value={data.timerDuration}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    timerDuration: Number.parseInt(e.target.value) || 1,
                  }))
                }
                className="h-9 w-24"
              />
            </div>
          )}
        </div>

        {/* Start Time */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Start Time</Label>
          <button
            type="button"
            onClick={() => setShowStartClock(!showStartClock)}
            className={cn(
              "w-full h-10 px-3 rounded-lg border text-sm font-mono text-left transition-colors",
              showStartClock
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:bg-muted",
            )}
          >
            {formatTime12(data.startTime)}
          </button>
        </div>

        {showStartClock && (
          <div className="flex justify-center animate-slide-up">
            <AnalogClockPicker
              value={data.startTime}
              onChange={(v) => setData((d) => ({ ...d, startTime: v }))}
              label="Start Time"
            />
          </div>
        )}

        {/* Time to Complete */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Time to Complete</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={1}
              max={720}
              value={data.timeToComplete}
              onChange={(e) =>
                setData((d) => ({
                  ...d,
                  timeToComplete: Number.parseInt(e.target.value) || 1,
                }))
              }
              className="h-10 w-24"
            />
            <span className="text-sm text-muted-foreground">
              minutes to finish
            </span>
          </div>
        </div>

        {/* Grace Period */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Checkbox
              id="grace-enabled"
              checked={data.graceEnabled}
              onCheckedChange={(checked) =>
                setData((d) => ({ ...d, graceEnabled: !!checked }))
              }
            />
            <Label
              htmlFor="grace-enabled"
              className="text-sm font-semibold cursor-pointer"
            >
              Grace Period
            </Label>
          </div>
          {data.graceEnabled && (
            <div className="flex items-center gap-2 ml-6">
              <Input
                type="number"
                min={1}
                value={data.gracePeriod}
                onChange={(e) =>
                  setData((d) => ({
                    ...d,
                    gracePeriod: Number.parseInt(e.target.value) || 1,
                  }))
                }
                className="h-9 w-20"
              />
              <span className="text-sm text-muted-foreground">
                minutes after due time
              </span>
            </div>
          )}
        </div>

        {/* Repeat */}
        <div className="space-y-2">
          <Label className="text-sm font-semibold">Repeat</Label>
          <div className="flex gap-2">
            {(["onetime", "daily"] as const).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setData((d) => ({ ...d, repeatType: type }))}
                className={cn(
                  "flex-1 h-10 rounded-lg text-sm font-medium transition-colors",
                  data.repeatType === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/70",
                )}
              >
                {type === "onetime" ? "One-Time" : "Daily"}
              </button>
            ))}
          </div>

          {data.repeatType === "daily" && (
            <div className="flex gap-1.5 mt-2">
              {weekdayLabels.map((label, i) => {
                const val = weekdayValues[i];
                const selected = data.weekdays.includes(val);
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => toggleWeekday(val)}
                    className={cn(
                      "flex-1 h-9 rounded-lg text-xs font-bold transition-colors",
                      selected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-muted/70",
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Group */}
        <div className="space-y-1.5">
          <Label className="text-sm font-semibold">Group</Label>
          <Select
            value={data.groupId || "none"}
            onValueChange={(v) =>
              setData((d) => ({ ...d, groupId: v === "none" ? "" : v }))
            }
          >
            <SelectTrigger className="h-10" data-ocid="habit_form.select">
              <SelectValue placeholder="No group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No group</SelectItem>
              {groups.map((g) => (
                <SelectItem key={g.id} value={g.id}>
                  <span className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: g.color }}
                    />
                    {g.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Hidden */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-muted/50">
          <div>
            <p className="text-sm font-semibold">Hide Habit</p>
            <p className="text-xs text-muted-foreground">
              Hidden from main screen
            </p>
          </div>
          <Switch
            checked={data.hidden}
            onCheckedChange={(checked) =>
              setData((d) => ({ ...d, hidden: checked }))
            }
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onCancel}
            data-ocid="habit_form.cancel_button"
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleSave}
            disabled={isSaving || !data.name.trim()}
            data-ocid="habit_form.save_button"
          >
            {isSaving ? "Saving..." : "Save Habit"}
          </Button>
        </div>
      </div>
    </ScrollArea>
  );
}
