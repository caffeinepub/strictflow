import { cn } from "@/lib/utils";
import { BarChart2, Home, Pencil, Settings } from "lucide-react";
import type { ActiveTab } from "../../types";

interface TabBarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
}

const tabs: {
  id: ActiveTab;
  label: string;
  icon: typeof Home;
  ocid: string;
}[] = [
  { id: "habits", label: "Habits", icon: Home, ocid: "habits.tab" },
  { id: "edit", label: "Edit", icon: Pencil, ocid: "edit.tab" },
  { id: "stats", label: "Stats", icon: BarChart2, ocid: "stats.tab" },
  { id: "settings", label: "Settings", icon: Settings, ocid: "settings.tab" },
];

export function TabBar({ activeTab, onTabChange }: TabBarProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-border"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="flex items-stretch h-16 max-w-lg mx-auto px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              data-ocid={tab.ocid}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 rounded-xl mx-0.5 my-1.5 transition-all",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "transition-all",
                  isActive ? "h-5 w-5" : "h-5 w-5",
                )}
                strokeWidth={isActive ? 2.5 : 1.8}
              />
              <span
                className={cn(
                  "text-[10px] font-semibold leading-none tracking-wide",
                  isActive ? "text-primary" : "",
                )}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
