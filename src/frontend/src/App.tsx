import { Toaster } from "@/components/ui/sonner";
import { useEffect, useRef, useState } from "react";
import { EditHabitsTab } from "./components/edit/EditHabitsTab";
import { HabitsTab } from "./components/habits/HabitsTab";
import { SettingsTab } from "./components/settings/SettingsTab";
import { TabBar } from "./components/shared/TabBar";
import { StatsTab } from "./components/stats/StatsTab";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { backendService as backend, setActor } from "./services/backendService";
import { seedSampleData } from "./services/sampleData";
import { useAppStore } from "./store/appStore";
import type { ActiveTab } from "./types";

const TAB_ORDER: ActiveTab[] = ["habits", "edit", "stats", "settings"];

function LoadingScreen() {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-background">
      <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-4" />
      <p className="text-muted-foreground text-sm">Loading StrictFlow…</p>
    </div>
  );
}

function LoginScreen({
  login,
  isLoggingIn,
}: { login: () => void; isLoggingIn: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-full bg-background px-8 max-w-lg mx-auto">
      {/* Logo mark */}
      <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center mb-6 shadow-lg">
        <span className="text-4xl">🎯</span>
      </div>

      {/* App name */}
      <h1 className="text-4xl font-bold text-foreground tracking-tight mb-2">
        StrictFlow
      </h1>
      <p className="text-muted-foreground text-center text-base mb-10 leading-relaxed">
        Track your habits.
        <br />
        Build your discipline.
      </p>

      {/* Sign in button */}
      <button
        type="button"
        onClick={login}
        disabled={isLoggingIn}
        data-ocid="login.primary_button"
        className="w-full max-w-xs py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-lg shadow-md active:scale-95 transition-transform disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
      >
        {isLoggingIn ? (
          <>
            <span className="w-5 h-5 rounded-full border-2 border-primary-foreground border-t-transparent animate-spin" />
            Signing in…
          </>
        ) : (
          "Sign In to Continue"
        )}
      </button>

      <p className="text-xs text-muted-foreground mt-6 text-center">
        Uses Internet Identity — secure, private, no password needed.
      </p>
    </div>
  );
}

function AppInner() {
  const {
    activeTab,
    setActiveTab,
    setHabits,
    setGroups,
    setSettings,
    setLoading,
    settings,
  } = useAppStore();
  const { actor } = useActor();

  const tabIndex = TAB_ORDER.indexOf(activeTab);

  // Swipe support
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  // Keep actor in sync
  useEffect(() => {
    setActor(actor ?? null);
  }, [actor]);

  // Apply dark mode
  useEffect(() => {
    const root = document.documentElement;
    if (settings.darkMode) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [settings.darkMode]);

  // Load initial data when actor is ready
  // biome-ignore lint/correctness/useExhaustiveDependencies: only re-run when actor changes
  useEffect(() => {
    if (!actor) return;
    const loadData = async () => {
      setLoading(true);
      try {
        // Seed sample data on first run (no-op if data exists)
        await seedSampleData();
        const [habits, groups, appSettings] = await Promise.all([
          backend.getHabits(),
          backend.getGroups(),
          backend.getSettings(),
        ]);
        setHabits(habits);
        setGroups(groups);
        setSettings(appSettings);
      } catch {
        // Silent - use defaults
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [actor]);

  const handleTabChange = (tab: ActiveTab) => {
    setActiveTab(tab);
    setSwipeOffset(0);
    setIsSwiping(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const target = e.target as HTMLElement;
    const isInteractive = target.closest(
      "button, input, textarea, select, [role='slider'], [data-radix-scroll-area-viewport], [data-state='open']",
    );
    if (isInteractive) return;

    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.touches[0].clientX - touchStartX.current;
    const dy = e.touches[0].clientY - touchStartY.current;

    if (!isSwiping && Math.abs(dy) > Math.abs(dx) + 5) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }
    if (!isSwiping && Math.abs(dx) > 12) {
      setIsSwiping(true);
    }
    if (isSwiping) {
      setSwipeOffset(dx);
    }
  };

  const handleTouchEnd = () => {
    if (!isSwiping) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const threshold = window.innerWidth * 0.3;
    if (swipeOffset < -threshold && tabIndex < TAB_ORDER.length - 1) {
      handleTabChange(TAB_ORDER[tabIndex + 1]);
    } else if (swipeOffset > threshold && tabIndex > 0) {
      handleTabChange(TAB_ORDER[tabIndex - 1]);
    } else {
      setSwipeOffset(0);
      setIsSwiping(false);
    }

    touchStartX.current = null;
    touchStartY.current = null;
  };

  return (
    <div className="flex flex-col h-screen w-full overflow-hidden bg-background max-w-lg mx-auto">
      <div
        className="flex-1 overflow-hidden relative"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="flex h-full w-full"
          style={{
            transform: `translateX(calc(-${tabIndex * 100}% + ${isSwiping ? swipeOffset : 0}px))`,
            transition: isSwiping
              ? "none"
              : "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {TAB_ORDER.map((tab) => (
            <div
              key={tab}
              className="flex-shrink-0 w-full h-full overflow-hidden"
            >
              <div className="h-full tab-safe-bottom overflow-hidden flex flex-col">
                {tab === "habits" && <HabitsTab />}
                {tab === "edit" && <EditHabitsTab />}
                {tab === "stats" && <StatsTab />}
                {tab === "settings" && <SettingsTab />}
              </div>
            </div>
          ))}
        </div>
      </div>

      <TabBar activeTab={activeTab} onTabChange={handleTabChange} />
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default function App() {
  const { identity, login, isInitializing, isLoggingIn } =
    useInternetIdentity();

  if (isInitializing) return <LoadingScreen />;

  if (!identity || identity.getPrincipal().isAnonymous()) {
    return <LoginScreen login={login} isLoggingIn={isLoggingIn} />;
  }

  return <AppInner />;
}
