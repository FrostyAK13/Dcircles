"use client"

import { cn } from "@/lib/utils"

interface DigitCardProps {
  digit: number;
  percentage: number;
  isHigh: boolean;
  isSecondHigh: boolean;
  isLow: boolean;
  isSecondLow: boolean;
  isLatest: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export function DigitCard({
  digit,
  percentage,
  isHigh,
  isSecondHigh,
  isLow,
  isSecondLow,
  isLatest,
  onClick,
  onMouseEnter,
  onMouseLeave
}: DigitCardProps) {
  const formattedPercentage = percentage % 1 === 0 ? percentage : percentage.toFixed(1);

  return (
    <div 
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="flex flex-col items-center gap-1.5 sm:gap-3 group cursor-pointer relative"
    >
      <div
        className={cn(
          "w-full aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center transition-all duration-300 border-[1.5px] sm:border-2 relative",
          isHigh ? "bg-emerald-500 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.4)]" :
          isSecondHigh ? "bg-blue-600 border-blue-600 shadow-[0_0_20px_rgba(37,99,235,0.3)]" :
          isLow ? "bg-red-500 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)]" :
          isSecondLow ? "bg-yellow-400 border-yellow-400 shadow-[0_0_20px_rgba(250,204,21,0.35)]" :
          "bg-muted/40 border-border shadow-sm hover:border-primary/50",
          isLatest && !isHigh && !isSecondHigh && !isLow && !isSecondLow && "ring-2 ring-primary ring-offset-2 sm:ring-offset-4 ring-offset-card"
        )}
      >
        <span className={cn(
          "text-xl sm:text-4xl font-black tracking-tighter transition-colors duration-300",
          isSecondLow ? "text-slate-900" :
          (isHigh || isSecondHigh || isLow) ? "text-white" : "text-foreground/90"
        )}>
          {digit}
        </span>
        {isLatest && (
          <span
            aria-label={`Latest digit: ${digit}`}
            className="absolute left-1/2 top-full z-10 -translate-x-1/2 border-l-[7px] border-r-[7px] border-b-[10px] border-l-transparent border-r-transparent border-b-rose-500 drop-shadow-[0_0_5px_rgba(244,63,94,0.7)]"
          />
        )}
      </div>
      
      <span className={cn(
        "text-[8px] sm:text-xs font-black tracking-widest tabular-nums transition-colors duration-300 uppercase truncate max-w-full",
        isHigh ? "text-emerald-500" :
        isSecondHigh ? "text-blue-600" :
        isLow ? "text-red-500" :
        isSecondLow ? "text-yellow-500" :
        "text-muted-foreground/60"
      )}>
        {formattedPercentage}%
      </span>
    </div>
  );
}
