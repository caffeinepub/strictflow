import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { backendService as backend } from "../../services/backendService";
import { useAppStore } from "../../store/appStore";
import type { Group, Habit, HabitFormData } from "../../types";
import { Variant_onetime_daily, Variant_timer_normal } from "../../types";
import { PRESET_COLORS } from "../../types";
import { generateId } from "../../utils/habitUtils";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { HabitForm } from "../shared/HabitForm";
import { StarRating } from "../shared/StarRating";

type EditSubTab = "tasks" | "groups";

export function EditHabitsTab() {
  const { habits, groups, settings, isLoading, setHabits, setGroups } =
    useAppStore();
  const [subTab, setSubTab] = useState<EditSubTab>("tasks");
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [groupDeleteTarget, setGroupDeleteTarget] = useState<string | null>(
    null,
  );
  const [groupName, setGroupName] = useState("");
  const [groupColor, setGroupColor] = useState(PRESET_COLORS[0]);

  const refreshHabits = async () => {
    const updated = await backend.getHabits();
    setHabits(updated);
  };

  const refreshGroups = async () => {
    const updated = await backend.getGroups();
    setGroups(updated);
  };

  const handleSaveHabit = async (data: HabitFormData) => {
    if (!editingHabit) return;
    setIsSaving(true);
    try {
      await backend.updateHabit(
        editingHabit.id,
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
      setEditingHabit(null);
      toast.success("Habit updated!");
    } catch {
      toast.error("Failed to update habit");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteHabit = async (id: string) => {
    try {
      await backend.deleteHabit(id);
      await refreshHabits();
      setDeleteTarget(null);
      toast.success("Habit deleted");
    } catch {
      toast.error("Failed to delete habit");
    }
  };

  const handleToggleHide = async (habit: Habit) => {
    try {
      await backend.updateHabit(
        habit.id,
        habit.name,
        habit.color,
        habit.icon,
        habit.importance,
        habit.mode,
        habit.timerDuration,
        habit.startTime,
        habit.dueTime,
        habit.graceEnabled,
        habit.gracePeriod,
        habit.repeatType,
        habit.weekdays,
        habit.groupId || null,
        !habit.hidden,
      );
      await refreshHabits();
      toast.success(habit.hidden ? "Habit shown" : "Habit hidden");
    } catch {
      toast.error("Failed to update habit");
    }
  };

  const handleSaveGroup = async () => {
    if (!groupName.trim()) return;
    try {
      if (editingGroup) {
        await backend.updateGroup(editingGroup.id, groupName, groupColor);
        toast.success("Group updated");
      } else {
        await backend.createGroup(generateId(), groupName, groupColor);
        toast.success("Group created");
      }
      await refreshGroups();
      setShowGroupForm(false);
      setEditingGroup(null);
      setGroupName("");
      setGroupColor(PRESET_COLORS[0]);
    } catch {
      toast.error("Failed to save group");
    }
  };

  const handleDeleteGroup = async (id: string) => {
    try {
      await backend.deleteGroup(id);
      await refreshGroups();
      setGroupDeleteTarget(null);
      toast.success("Group deleted");
    } catch {
      toast.error("Failed to delete group");
    }
  };

  const openGroupEdit = (group: Group) => {
    setEditingGroup(group);
    setGroupName(group.name);
    setGroupColor(group.color);
    setShowGroupForm(true);
  };

  const getHabitFormData = (habit: Habit): Partial<HabitFormData> => {
    const [sh, sm] = habit.startTime.split(":").map(Number);
    const [dh, dm] = habit.dueTime.split(":").map(Number);
    const startMins = sh * 60 + sm;
    let dueMins = dh * 60 + dm;
    if (dueMins <= startMins) dueMins += 24 * 60; // next day
    const timeToComplete = Math.max(1, dueMins - startMins);

    return {
      name: habit.name,
      color: habit.color,
      icon: habit.icon,
      importance: Number(habit.importance),
      mode: habit.mode === Variant_timer_normal.timer ? "timer" : "normal",
      timerDuration: Number(habit.timerDuration),
      startTime: habit.startTime,
      dueTime: habit.dueTime,
      timeToComplete,
      graceEnabled: habit.graceEnabled,
      gracePeriod: Number(habit.gracePeriod),
      repeatType:
        habit.repeatType === Variant_onetime_daily.onetime
          ? "onetime"
          : "daily",
      weekdays: habit.weekdays.map(Number),
      groupId: habit.groupId || "",
      hidden: habit.hidden,
    };
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 shrink-0">
        <h1 className="text-2xl font-display font-bold tracking-tight">
          Edit Habits
        </h1>
      </div>

      {/* Sub-tabs */}
      <div className="flex px-4 gap-1 mb-3 shrink-0">
        <button
          data-ocid="edit.tasks_tab"
          type="button"
          onClick={() => setSubTab("tasks")}
          className={cn(
            "flex-1 h-9 rounded-xl text-sm font-semibold transition-colors",
            subTab === "tasks"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          Tasks
        </button>
        <button
          data-ocid="edit.groups_tab"
          type="button"
          onClick={() => setSubTab("groups")}
          className={cn(
            "flex-1 h-9 rounded-xl text-sm font-semibold transition-colors",
            subTab === "groups"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          Groups
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 px-4">
        {subTab === "tasks" && (
          <div className="space-y-2 py-1 pb-4">
            {isLoading ? (
              [1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))
            ) : habits.length === 0 ? (
              <div
                data-ocid="edit.tasks.empty_state"
                className="text-center py-12 text-muted-foreground"
              >
                <p className="text-lg font-semibold">No habits yet</p>
                <p className="text-sm mt-1">Go to Habits tab to add one</p>
              </div>
            ) : (
              habits.map((habit, idx) => (
                <div
                  key={habit.id}
                  data-ocid={`edit.item.${idx + 1}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card"
                  style={{ borderLeft: `3px solid ${habit.color}` }}
                >
                  <span className="text-xl">{habit.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">
                        {habit.name}
                      </p>
                      {habit.hidden && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] px-1.5 py-0"
                        >
                          Hidden
                        </Badge>
                      )}
                    </div>
                    <StarRating value={Number(habit.importance)} size="sm" />
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleToggleHide(habit)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/70 transition-colors"
                      title={habit.hidden ? "Show" : "Hide"}
                    >
                      {habit.hidden ? (
                        <Eye className="h-4 w-4 text-foreground" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-foreground" />
                      )}
                    </button>
                    <button
                      data-ocid={`edit.edit_button.${idx + 1}`}
                      type="button"
                      onClick={() => setEditingHabit(habit)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/70 transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-foreground" />
                    </button>
                    <button
                      data-ocid={`edit.delete_button.${idx + 1}`}
                      type="button"
                      onClick={() => {
                        if (settings.confirmDelete) {
                          setDeleteTarget(habit.id);
                        } else {
                          handleDeleteHabit(habit.id);
                        }
                      }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {subTab === "groups" && (
          <div className="space-y-2 py-1 pb-4">
            <button
              type="button"
              onClick={() => {
                setEditingGroup(null);
                setGroupName("");
                setGroupColor(PRESET_COLORS[0]);
                setShowGroupForm(true);
              }}
              className="w-full h-10 rounded-xl border-2 border-dashed border-border text-sm font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Group
            </button>

            {groups.length === 0 ? (
              <div
                data-ocid="edit.groups.empty_state"
                className="text-center py-12 text-muted-foreground"
              >
                <p className="text-lg font-semibold">No groups</p>
                <p className="text-sm mt-1">
                  Create groups to organize your habits
                </p>
              </div>
            ) : (
              groups.map((group, idx) => (
                <div
                  key={group.id}
                  data-ocid={`edit.group.item.${idx + 1}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-card shadow-card"
                >
                  <div
                    className="w-8 h-8 rounded-full shrink-0"
                    style={{ backgroundColor: group.color }}
                  />
                  <p className="flex-1 text-sm font-semibold">{group.name}</p>
                  <div className="flex items-center gap-1.5">
                    <button
                      data-ocid={`edit.group.edit_button.${idx + 1}`}
                      type="button"
                      onClick={() => openGroupEdit(group)}
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted hover:bg-muted/70 transition-colors"
                    >
                      <Pencil className="h-4 w-4 text-foreground" />
                    </button>
                    <button
                      data-ocid={`edit.group.delete_button.${idx + 1}`}
                      type="button"
                      onClick={() => {
                        if (settings.confirmDelete) {
                          setGroupDeleteTarget(group.id);
                        } else {
                          handleDeleteGroup(group.id);
                        }
                      }}
                      className="w-9 h-9 rounded-lg flex items-center justify-center bg-destructive/10 hover:bg-destructive/20 transition-colors"
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>

      {/* Edit Habit Sheet */}
      <Sheet
        open={!!editingHabit}
        onOpenChange={(o) => !o && setEditingHabit(null)}
      >
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-2xl p-0 flex flex-col"
        >
          <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
            <SheetTitle className="text-left">Edit Habit</SheetTitle>
          </SheetHeader>
          {editingHabit && (
            <div className="flex-1 min-h-0">
              <HabitForm
                initialData={getHabitFormData(editingHabit)}
                groups={groups}
                mondayFirst={settings.mondayFirst}
                onSave={handleSaveHabit}
                onCancel={() => setEditingHabit(null)}
                isSaving={isSaving}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Group Form Sheet */}
      <Sheet open={showGroupForm} onOpenChange={setShowGroupForm}>
        <SheetContent side="bottom" className="h-auto rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>{editingGroup ? "Edit Group" : "New Group"}</SheetTitle>
          </SheetHeader>
          <div className="flex flex-col gap-4 mt-4 pb-6">
            <div className="space-y-1.5">
              <label
                htmlFor="group-name-input"
                className="text-sm font-semibold"
              >
                Name
              </label>
              <Input
                id="group-name-input"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Group name"
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-semibold">Color</p>
              <div className="grid grid-cols-8 gap-2">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setGroupColor(c)}
                    className={cn(
                      "w-8 h-8 rounded-full border-2 transition-transform",
                      groupColor === c
                        ? "scale-110 border-foreground"
                        : "border-transparent",
                    )}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setShowGroupForm(false);
                  setEditingGroup(null);
                }}
                className="flex-1 h-11 rounded-xl bg-muted text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveGroup}
                className="flex-1 h-11 rounded-xl bg-primary text-primary-foreground text-sm font-semibold"
              >
                Save
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Habit Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title="Delete Habit"
        description="This will permanently delete this habit and all its logs."
        confirmLabel="Delete"
        destructive
        onConfirm={() => deleteTarget && handleDeleteHabit(deleteTarget)}
      />

      {/* Delete Group Confirm */}
      <ConfirmDialog
        open={!!groupDeleteTarget}
        onOpenChange={(o) => !o && setGroupDeleteTarget(null)}
        title="Delete Group"
        description="This will delete the group. Habits in this group will become ungrouped."
        confirmLabel="Delete"
        destructive
        onConfirm={() =>
          groupDeleteTarget && handleDeleteGroup(groupDeleteTarget)
        }
      />
    </div>
  );
}
