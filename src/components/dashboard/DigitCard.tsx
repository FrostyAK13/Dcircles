"use client"

import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

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
      {isLatest && (
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-primary animate-bounce z-10">
          <ChevronDown className="w-6 h-6 fill-primary" />
        </div>
      )}
      
      <div
        className={cn(
          "w-full aspect-[4/3] sm:aspect-video rounded-2xl flex items-center justify-center transition-all duration-200 border-2",
          isLatest 
            ? "bg-foreground text-background border-foreground scale-105 shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
            : "bg-secondary/40 text-foreground border-border/50 hover:border-primary/50"
        )}
      >
        <span className="text-2xl sm:text-3xl font-bold tracking-tighter">
          {digit}
        </span>
      </div>
      
      <span className={cn(
        "text-xs sm:text-sm font-bold tabular-nums",
        isHigh ? "text-emerald-500" : 
        isSecondHigh ? "text-sky-400" :
        isLow ? "text-rose-500" : 
        isSecondLow ? "text-orange-400" :
        "text-muted-foreground/80"
      )}>
        {formattedPercentage}%
      </span>
    </div>
  );
}
