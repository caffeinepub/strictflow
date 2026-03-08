import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";

interface ScrollDrumProps {
  items: number[];
  value: number;
  onChange: (v: number) => void;
  label: string;
  formatLabel?: (v: number) => string;
}

function ScrollDrum({
  items,
  value,
  onChange,
  label,
  formatLabel,
}: ScrollDrumProps) {
  const listRef = useRef<HTMLUListElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const ITEM_H = 56;
  const fmt = formatLabel ?? ((v: number) => String(v).padStart(2, "0"));
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // scroll to selected value without animation on mount
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally runs only on mount
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const idx = items.indexOf(value);
    if (idx < 0) return;
    el.scrollTop = idx * ITEM_H;
  }, []);

  // Sync scroll position when value changes externally
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const idx = items.indexOf(value);
    if (idx < 0) return;
    const expectedTop = idx * ITEM_H;
    if (Math.abs(el.scrollTop - expectedTop) > 2) {
      el.scrollTo({ top: expectedTop, behavior: "smooth" });
    }
  }, [value, items]);

  const scrollTo = (v: number) => {
    const el = listRef.current;
    if (!el) return;
    const idx = items.indexOf(v);
    if (idx >= 0) el.scrollTo({ top: idx * ITEM_H, behavior: "smooth" });
  };

  // Wheel: move exactly one step per wheel event
  const wheelAccum = useRef(0);
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    wheelAccum.current += e.deltaY;
    if (Math.abs(wheelAccum.current) >= 30) {
      const dir = wheelAccum.current > 0 ? 1 : -1;
      wheelAccum.current = 0;
      const curIdx = items.indexOf(value);
      const nextIdx = Math.max(0, Math.min(curIdx + dir, items.length - 1));
      if (nextIdx !== curIdx) {
        onChange(items[nextIdx]);
        scrollTo(items[nextIdx]);
      }
    }
  };

  // Keyboard: arrow up/down change by 1; Enter/click to enter edit mode
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const curIdx = items.indexOf(value);
      const nextIdx = Math.min(curIdx + 1, items.length - 1);
      if (nextIdx !== curIdx) {
        onChange(items[nextIdx]);
        scrollTo(items[nextIdx]);
      }
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const curIdx = items.indexOf(value);
      const nextIdx = Math.max(curIdx - 1, 0);
      if (nextIdx !== curIdx) {
        onChange(items[nextIdx]);
        scrollTo(items[nextIdx]);
      }
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      startEditing();
    }
  };

  const startEditing = () => {
    setInputVal(fmt(value));
    setIsEditing(true);
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const commitEdit = () => {
    const num = Number.parseInt(inputVal, 10);
    if (!Number.isNaN(num) && items.includes(num)) {
      onChange(num);
      scrollTo(num);
    }
    setIsEditing(false);
    containerRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") commitEdit();
    else if (e.key === "Escape") {
      setIsEditing(false);
      containerRef.current?.focus();
    }
  };

  // Native scroll (touch/trackpad momentum) -- snap on settle
  const snapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleScroll = () => {
    if (snapTimer.current) clearTimeout(snapTimer.current);
    snapTimer.current = setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      const idx = Math.round(el.scrollTop / ITEM_H);
      const clamped = Math.max(0, Math.min(idx, items.length - 1));
      el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
      if (items[clamped] !== value) onChange(items[clamped]);
    }, 100);
  };

  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
        {label}
      </span>
      {/* biome-ignore lint/a11y/noNoninteractiveTabindex: spinbutton role makes this interactive */}
      <div
        ref={containerRef}
        role="spinbutton"
        tabIndex={0}
        aria-valuenow={value}
        aria-valuemin={items[0]}
        aria-valuemax={items[items.length - 1]}
        aria-label={`${label}: ${fmt(value)}, click or press Enter to type, arrow keys to adjust`}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onClick={startEditing}
        className="relative overflow-hidden rounded-2xl border-2 border-primary/50 bg-card focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
        style={{ width: 80, height: ITEM_H }}
      >
        {/* selection highlight */}
        <div className="pointer-events-none absolute inset-0 z-20 bg-primary/10" />

        {isEditing ? (
          // inline text input overlay
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-card">
            <input
              ref={inputRef}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleInputKeyDown}
              onBlur={commitEdit}
              className="w-full text-center text-2xl font-bold bg-transparent outline-none text-primary"
              style={{ caretColor: "auto" }}
            />
          </div>
        ) : (
          <ul
            ref={listRef}
            onScroll={handleScroll}
            className="overflow-y-scroll h-full pointer-events-none"
            style={{
              scrollSnapType: "y mandatory",
              paddingTop: 0,
              paddingBottom: 0,
              scrollbarWidth: "none",
            }}
          >
            {items.map((v) => (
              <li
                key={v}
                style={{ scrollSnapAlign: "center", height: ITEM_H }}
                className={cn(
                  "flex items-center justify-center text-2xl font-bold transition-colors",
                  v === value ? "text-primary" : "text-foreground/50",
                )}
              >
                {fmt(v)}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

interface AnalogClockPickerProps {
  value: string; // HH:MM
  onChange: (value: string) => void;
  label?: string;
}

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 60 }, (_, i) => i); // 0..59

export function AnalogClockPicker({
  value,
  onChange,
  label,
}: AnalogClockPickerProps) {
  const parts = value.split(":").map(Number);
  const rawH = Number.isNaN(parts[0]) ? 8 : parts[0];
  const rawM = Number.isNaN(parts[1]) ? 0 : parts[1];

  const isPM = rawH >= 12;
  const display12 = rawH % 12 === 0 ? 12 : rawH % 12;

  const [period, setPeriod] = useState<"AM" | "PM">(isPM ? "PM" : "AM");

  const emit = (h12: number, m: number, p: "AM" | "PM") => {
    let h24 = h12 % 12;
    if (p === "PM") h24 += 12;
    onChange(`${String(h24).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  };

  const handleHour = (h12: number) => emit(h12, rawM, period);
  const handleMinute = (m: number) => emit(display12, m, period);
  const handlePeriod = (p: "AM" | "PM") => {
    setPeriod(p);
    emit(display12, rawM, p);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      {label && (
        <span className="text-sm font-semibold text-foreground">{label}</span>
      )}

      {/* Scroll drums — always visible, no preview */}
      <div className="flex items-center gap-2">
        <ScrollDrum
          items={HOURS_12}
          value={display12}
          onChange={handleHour}
          label="Hour"
        />
        <span className="text-3xl font-bold text-muted-foreground mt-6">:</span>
        <ScrollDrum
          items={MINUTES}
          value={rawM}
          onChange={handleMinute}
          label="Min"
        />
        {/* AM/PM toggle beside the drums */}
        <div className="flex flex-col gap-1 mt-6">
          {(["AM", "PM"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => handlePeriod(p)}
              className={cn(
                "text-xs px-2 py-1 rounded font-bold transition-colors",
                period === p
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/70",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
