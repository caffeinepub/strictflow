import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface Habit {
    id: string;
    startTime: string;
    repeatType: Variant_onetime_daily;
    graceEnabled: boolean;
    timerDuration: bigint;
    weekdays: Array<bigint>;
    icon: string;
    mode: Variant_timer_normal;
    name: string;
    createdAt: bigint;
    color: string;
    hidden: boolean;
    importance: bigint;
    gracePeriod: bigint;
    dueTime: string;
    groupId?: string;
}
export interface HabitLog {
    id: string;
    status: Variant_ontime_late_failed;
    completedAt: bigint;
    date: string;
    habitId: string;
    pointsEarned: number;
}
export interface Group {
    id: string;
    name: string;
    color: string;
}
export interface UserProfile {
    name: string;
}
export interface AppSettings {
    defaultStatsView: Variant_monthly_daily_weekly;
    impactGoal: number;
    notificationLeadTime: bigint;
    pauseTimers: boolean;
    completionGoal: bigint;
    darkMode: boolean;
    defaultHabitsView: Variant_monthly_daily_weekly;
    confirmDelete: boolean;
    mondayFirst: boolean;
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum Variant_monthly_daily_weekly {
    monthly = "monthly",
    daily = "daily",
    weekly = "weekly"
}
export enum Variant_onetime_daily {
    onetime = "onetime",
    daily = "daily"
}
export enum Variant_ontime_late_failed {
    ontime = "ontime",
    late = "late",
    failed = "failed"
}
export enum Variant_timer_normal {
    timer = "timer",
    normal = "normal"
}
export interface backendInterface {
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createGroup(id: string, name: string, color: string): Promise<void>;
    createHabit(id: string, name: string, color: string, icon: string, importance: bigint, mode: Variant_timer_normal, timerDuration: bigint, startTime: string, dueTime: string, graceEnabled: boolean, gracePeriod: bigint, repeatType: Variant_onetime_daily, weekdays: Array<bigint>, groupId: string | null, hidden: boolean): Promise<void>;
    deleteGroup(id: string): Promise<void>;
    deleteHabit(id: string): Promise<void>;
    deleteLogsByRange(rangeType: {
        __kind__: "day";
        day: string;
    } | {
        __kind__: "month";
        month: string;
    } | {
        __kind__: "week";
        week: string;
    } | {
        __kind__: "alltime";
        alltime: null;
    }): Promise<void>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDailyCompletionHistory(startDate: string, endDate: string): Promise<Array<[string, bigint, number]>>;
    getGroups(): Promise<Array<Group>>;
    getHabit(id: string): Promise<Habit>;
    getHabitStats(habitId: string): Promise<{
        streak: bigint;
        failedCount: bigint;
        completionCount: bigint;
        totalPoints: number;
        lateCount: bigint;
    }>;
    getHabits(): Promise<Array<Habit>>;
    getLogsByDateRange(startDate: string, endDate: string): Promise<Array<HabitLog>>;
    getLogsByHabit(habitId: string): Promise<Array<HabitLog>>;
    getOverviewStats(_startDate: string, _endDate: string): Promise<{
        failedCount: bigint;
        onTimeCount: bigint;
        maxPoints: number;
        totalCompletions: bigint;
        totalPoints: number;
        lateCount: bigint;
    }>;
    getSettings(): Promise<AppSettings>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    logHabitCompletion(id: string, habitId: string, date: string, status: Variant_ontime_late_failed, completedAt: bigint, pointsEarned: number): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateGroup(id: string, name: string, color: string): Promise<void>;
    updateHabit(id: string, name: string, color: string, icon: string, importance: bigint, mode: Variant_timer_normal, timerDuration: bigint, startTime: string, dueTime: string, graceEnabled: boolean, gracePeriod: bigint, repeatType: Variant_onetime_daily, weekdays: Array<bigint>, groupId: string | null, hidden: boolean): Promise<void>;
    updateSettings(newSettings: AppSettings): Promise<void>;
}
