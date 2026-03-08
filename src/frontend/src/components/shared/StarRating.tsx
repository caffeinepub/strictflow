import { cn } from "@/lib/utils";
import { Star } from "lucide-react";

interface StarRatingProps {
  value: number;
  onChange?: (val: number) => void;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

export function StarRating({
  value,
  onChange,
  size = "md",
  className,
}: StarRatingProps) {
  const sizeMap = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
    xl: "h-7 w-7",
  };
  const sizeClass = sizeMap[size];
  const gapClass = size === "xl" ? "gap-3" : "gap-0.5";

  return (
    <div
      className={cn(
        "flex items-center justify-center w-full",
        gapClass,
        className,
      )}
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange?.(star)}
          className={cn(
            "transition-transform",
            onChange
              ? "cursor-pointer hover:scale-110 active:scale-95"
              : "cursor-default",
          )}
          disabled={!onChange}
        >
          <Star
            className={cn(
              sizeClass,
              star <= value
                ? "fill-yellow-400 text-yellow-400"
                : "fill-muted text-muted-foreground/30",
            )}
          />
        </button>
      ))}
    </div>
  );
}
