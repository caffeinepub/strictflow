import { cn } from "@/lib/utils";
import { useCallback, useRef, useState } from "react";

interface AnalogClockPickerProps {
  value: string; // HH:MM
  onChange: (value: string) => void;
  label?: string;
}

type PickStep = "hour" | "minute";

export function AnalogClockPicker({
  value,
  onChange,
  label,
}: AnalogClockPickerProps) {
  const [step, setStep] = useState<PickStep>("hour");
  const svgRef = useRef<SVGSVGElement>(null);

  const parts = value.split(":").map(Number);
  const hours = Number.isNaN(parts[0]) ? 0 : parts[0];
  const minutes = Number.isNaN(parts[1]) ? 0 : parts[1];

  const getAngleFromEvent = useCallback(
    (e: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) => {
      const svg = svgRef.current;
      if (!svg) return 0;
      const rect = svg.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      let clientX: number;
      let clientY: number;
      if ("touches" in e) {
        clientX = e.touches[0].clientX - rect.left;
        clientY = e.touches[0].clientY - rect.top;
      } else {
        clientX = e.clientX - rect.left;
        clientY = e.clientY - rect.top;
      }
      const dx = clientX - cx;
      const dy = clientY - cy;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angle < 0) angle += 360;
      return angle;
    },
    [],
  );

  // Prevent double-firing on touch devices (onTouchStart + onClick both fire)
  const lastTouchRef = useRef(false);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<SVGSVGElement>) => {
      e.preventDefault();
      lastTouchRef.current = true;
      const angle = getAngleFromEvent(e);
      setStep((currentStep) => {
        if (currentStep === "hour") {
          // Step 1: set hour → advance to minute
          const hour = Math.round(angle / 30) % 12;
          const newHour = hour === 0 ? 12 : hour;
          const finalHour = hours >= 12 ? newHour + 12 : newHour;
          onChange(
            `${String(finalHour % 24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
          );
          return "minute";
        }
        // Step 2: set minute → go back to hour for next interaction
        const minute = Math.round(angle / 6) % 60;
        onChange(
          `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        );
        return "hour";
      });
    },
    [hours, minutes, onChange, getAngleFromEvent],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<SVGSVGElement>) => {
      // Skip if this click was triggered by a touch event
      if (lastTouchRef.current) {
        lastTouchRef.current = false;
        return;
      }
      const angle = getAngleFromEvent(e);
      setStep((currentStep) => {
        if (currentStep === "hour") {
          // Step 1: set hour → advance to minute
          const hour = Math.round(angle / 30) % 12;
          const newHour = hour === 0 ? 12 : hour;
          const finalHour = hours >= 12 ? newHour + 12 : newHour;
          onChange(
            `${String(finalHour % 24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
          );
          return "minute";
        }
        // Step 2: set minute → go back to hour for next interaction
        const minute = Math.round(angle / 6) % 60;
        onChange(
          `${String(hours).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
        );
        return "hour";
      });
    },
    [hours, minutes, onChange, getAngleFromEvent],
  );

  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r = 92;

  const display12 = hours % 12 === 0 ? 12 : hours % 12;

  // Hour hand angle
  const hourAngle =
    ((display12 / 12) * 360 + (minutes / 60) * 30 - 90) * (Math.PI / 180);
  const minAngle = ((minutes / 60) * 360 - 90) * (Math.PI / 180);
  const handR = r * 0.55;
  const minHandR = r * 0.75;

  const hourHandX = cx + Math.cos(hourAngle) * handR;
  const hourHandY = cy + Math.sin(hourAngle) * handR;
  const minHandX = cx + Math.cos(minAngle) * minHandR;
  const minHandY = cy + Math.sin(minAngle) * minHandR;

  // Number radius slightly inside the ring
  const numR = r - 6;

  // Hour markers (1–12)
  const hourMarkers = Array.from({ length: 12 }, (_, i) => {
    const angle = ((i + 1) / 12) * 2 * Math.PI - Math.PI / 2;
    const mx = cx + Math.cos(angle) * numR;
    const my = cy + Math.sin(angle) * numR;
    return { x: mx, y: my, label: i + 1 };
  });

  // Minute markers (every 5 min: 0, 5, 10 … 55)
  const minuteMarkers = Array.from({ length: 12 }, (_, i) => {
    const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
    const mx = cx + Math.cos(angle) * numR;
    const my = cy + Math.sin(angle) * numR;
    return { x: mx, y: my, label: i * 5 };
  });

  const markers = step === "hour" ? hourMarkers : minuteMarkers;

  // Highlight the currently selected value
  const selectedAngle =
    step === "hour"
      ? (display12 / 12) * 2 * Math.PI - Math.PI / 2
      : (minutes / 60) * 2 * Math.PI - Math.PI / 2;
  const selectedX = cx + Math.cos(selectedAngle) * numR;
  const selectedY = cy + Math.sin(selectedAngle) * numR;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col items-center gap-3 w-full max-w-xs">
      {label && (
        <span className="text-sm font-semibold text-foreground">{label}</span>
      )}

      {/* Digital display */}
      <div className="flex items-center gap-1 text-2xl font-bold">
        <button
          type="button"
          onClick={() => setStep("hour")}
          className={cn(
            "px-2 py-1 rounded-lg transition-colors",
            step === "hour"
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted",
          )}
        >
          {String(display12).padStart(2, "0")}
        </button>
        <span className="text-foreground">:</span>
        <button
          type="button"
          onClick={() => setStep("minute")}
          className={cn(
            "px-2 py-1 rounded-lg transition-colors",
            step === "minute"
              ? "bg-primary text-primary-foreground"
              : "text-foreground hover:bg-muted",
          )}
        >
          {String(minutes).padStart(2, "0")}
        </button>
        <div className="flex flex-col gap-0.5 ml-1">
          <button
            type="button"
            onClick={() => {
              const newHour = hours < 12 ? hours : hours - 12;
              onChange(
                `${String(newHour).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
              );
            }}
            className={cn(
              "text-xs px-1.5 py-0.5 rounded transition-colors",
              hours < 12
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            AM
          </button>
          <button
            type="button"
            onClick={() => {
              const newHour = hours >= 12 ? hours : hours + 12;
              onChange(
                `${String(newHour % 24).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
              );
            }}
            className={cn(
              "text-xs px-1.5 py-0.5 rounded transition-colors",
              hours >= 12
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/70",
            )}
          >
            PM
          </button>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span
          className={cn(
            "px-2 py-0.5 rounded-full transition-colors",
            step === "hour"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          1. Hour
        </span>
        <span className="text-muted-foreground">→</span>
        <span
          className={cn(
            "px-2 py-0.5 rounded-full transition-colors",
            step === "minute"
              ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          2. Minute
        </span>
      </div>

      {/* Clock face — SVG with CSS currentColor for theme compatibility */}
      {/* biome-ignore lint/a11y/noSvgWithoutTitle: interactive clock face */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: touch-only clock face */}
      <svg
        ref={svgRef}
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        onClick={handleClick}
        onTouchStart={handleTouchStart}
        className="cursor-pointer select-none clock-face"
        role="img"
        aria-label="Clock time picker"
        style={{ touchAction: "none" }}
      >
        {/* Outer ring */}
        <circle cx={cx} cy={cy} r={r + 20} className="clock-outer-ring" />
        <circle
          cx={cx}
          cy={cy}
          r={r + 19}
          fill="none"
          className="clock-ring-stroke"
          strokeWidth="1.5"
        />

        {/* Inner face background */}
        <circle cx={cx} cy={cy} r={r + 4} className="clock-face-bg" />

        {/* Tick marks for all 60 minutes (subtle) — keyed by minute value */}
        {step === "minute" &&
          Array.from({ length: 60 }, (_, i) => {
            const angle = (i / 60) * 2 * Math.PI - Math.PI / 2;
            const innerR = r - 2;
            const outerR = i % 5 === 0 ? r + 2 : r;
            return (
              <line
                key={`min-tick-${i * 1}`}
                x1={cx + Math.cos(angle) * innerR}
                y1={cy + Math.sin(angle) * innerR}
                x2={cx + Math.cos(angle) * outerR}
                y2={cy + Math.sin(angle) * outerR}
                className="clock-tick"
                strokeWidth={i % 5 === 0 ? 2 : 1}
              />
            );
          })}

        {/* Tick marks for 12 hours — keyed by hour value */}
        {step === "hour" &&
          Array.from({ length: 12 }, (_, i) => {
            const angle = (i / 12) * 2 * Math.PI - Math.PI / 2;
            const hourVal = i === 0 ? 12 : i;
            return (
              <line
                key={`hr-tick-${hourVal}`}
                x1={cx + Math.cos(angle) * (r - 2)}
                y1={cy + Math.sin(angle) * (r - 2)}
                x2={cx + Math.cos(angle) * (r + 2)}
                y2={cy + Math.sin(angle) * (r + 2)}
                className="clock-tick"
                strokeWidth={2}
              />
            );
          })}

        {/* Selected highlight line from center */}
        <line
          x1={cx}
          y1={cy}
          x2={selectedX}
          y2={selectedY}
          className="clock-accent"
          strokeWidth="2"
          strokeOpacity="0.3"
          strokeLinecap="round"
        />

        {/* Number labels */}
        {markers.map((m) => {
          const isSelected =
            (step === "hour" && m.label === display12) ||
            (step === "minute" && m.label === minutes);
          return (
            <g key={m.label}>
              {/* Highlight circle behind selected number */}
              {isSelected && (
                <circle cx={m.x} cy={m.y} r={16} className="clock-accent" />
              )}
              <text
                x={m.x}
                y={m.y + 4.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fontWeight="700"
                fontFamily="inherit"
                className={
                  isSelected ? "clock-number-selected" : "clock-number"
                }
              >
                {m.label}
              </text>
            </g>
          );
        })}

        {/* Hour hand */}
        <line
          x1={cx}
          y1={cy}
          x2={hourHandX}
          y2={hourHandY}
          className={cn(
            "clock-accent",
            step === "hour" ? "" : "clock-hand-dim",
          )}
          strokeWidth={step === "hour" ? 4 : 2.5}
          strokeLinecap="round"
          opacity={step === "hour" ? 1 : 0.45}
        />

        {/* Minute hand */}
        <line
          x1={cx}
          y1={cy}
          x2={minHandX}
          y2={minHandY}
          className={cn(
            "clock-accent",
            step === "minute" ? "" : "clock-hand-dim",
          )}
          strokeWidth={step === "minute" ? 3 : 2}
          strokeLinecap="round"
          opacity={step === "minute" ? 1 : 0.45}
        />

        {/* Selected dot on ring */}
        <circle cx={selectedX} cy={selectedY} r={5} className="clock-accent" />

        {/* Center dot */}
        <circle cx={cx} cy={cy} r={5} className="clock-accent" />
        <circle cx={cx} cy={cy} r={2} className="clock-center-dot" />
      </svg>
    </div>
  );
}
