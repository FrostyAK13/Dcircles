"use client"

import { cn } from "@/lib/utils";

interface DigitCardProps {
  digit: number;
  percentage: number;
  isHigh: boolean;
  isSecondHigh: boolean;
  isLow: boolean;
  isSecondLow: boolean;
  isLatest: boolean;
  onClick: () => void;
}

export function DigitCard({
  digit,
  percentage,
  isHigh,
  isSecondHigh,
  isLow,
  isSecondLow,
  isLatest,
  onClick
}: DigitCardProps) {
  const formattedPercentage = percentage % 1 === 0 ? percentage : percentage.toFixed(1);

  return (
    <div 
      onClick={onClick}
      className="flex flex-col items-center gap-3 group cursor-pointer relative"
    >
      <div
        className={cn(
          "w-full aspect-square rounded-2xl flex items-center justify-center transition-all duration-300 border-2",
          isHigh ? "bg-primary border-primary shadow-[0_0_20px_rgba(0,174,239,0.4)]" : 
          isSecondHigh ? "bg-primary/60 border-primary/60" :
          isLow ? "bg-rose-500 border-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.4)]" : 
          isSecondLow ? "bg-rose-500/60 border-rose-500/60" :
          "bg-muted/40 border-border shadow-sm hover:border-primary/50",
          isLatest && !isHigh && !isSecondHigh && !isLow && !isSecondLow && "ring-2 ring-primary ring-offset-4 ring-offset-card"
        )}
      >
        <span className={cn(
          "text-2xl sm:text-4xl font-black tracking-tighter transition-colors duration-300",
          (isHigh || isSecondHigh || isLow || isSecondLow) ? "text-white" : "text-foreground/90"
        )}>
          {digit}
        </span>
      </div>
      
      <span className={cn(
        "text-[10px] sm:text-xs font-black tracking-widest tabular-nums transition-colors duration-300 uppercase",
        isHigh ? "text-primary" : 
        isSecondHigh ? "text-primary/70" :
        isLow ? "text-rose-500" : 
        isSecondLow ? "text-rose-500/70" :
        "text-muted-foreground/60"
      )}>
        {formattedPercentage}%
      </span>
    </div>
  );
}
