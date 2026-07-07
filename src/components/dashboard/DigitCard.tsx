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
      className="flex flex-col items-center gap-2 group cursor-pointer relative"
    >
      <div
        className={cn(
          "w-full aspect-[4/3] sm:aspect-video rounded-2xl flex items-center justify-center transition-all duration-300 border-2",
          isLatest 
            ? "bg-primary border-primary scale-105 shadow-lg shadow-primary/20" 
            : "bg-white border-border/50 hover:border-primary/50 shadow-sm"
        )}
      >
        <span className={cn(
          "text-2xl sm:text-3xl font-bold tracking-tighter transition-colors duration-300",
          isLatest ? "text-primary-foreground" :
          isHigh ? "text-emerald-500" : 
          isSecondHigh ? "text-blue-500" :
          isLow ? "text-rose-500" : 
          isSecondLow ? "text-orange-500" :
          "text-foreground"
        )}>
          {digit}
        </span>
      </div>
      
      <span className={cn(
        "text-xs sm:text-sm font-bold tabular-nums transition-colors duration-300",
        isHigh ? "text-emerald-500" : 
        isSecondHigh ? "text-blue-500" :
        isLow ? "text-rose-500" : 
        isSecondLow ? "text-orange-500" :
        "text-muted-foreground/80"
      )}>
        {formattedPercentage}%
      </span>
    </div>
  );
}
