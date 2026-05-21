"use client"

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { MousePointer2 } from "lucide-react";

interface DigitCardProps {
  digit: number;
  percentage: number;
  count: number;
  isHigh: boolean;
  isLow: boolean;
  isSelected: boolean;
  isLatest: boolean;
  onClick: () => void;
}

export function DigitCard({
  digit,
  percentage,
  count,
  isHigh,
  isLow,
  isSelected,
  isLatest,
  onClick
}: DigitCardProps) {
  return (
    <Card
      onClick={onClick}
      className={cn(
        "relative overflow-hidden cursor-pointer transition-all duration-200 digit-card-gradient hover:scale-105 group border-2",
        isSelected ? "digit-highlight-selected border-primary" : "border-border/50",
        isHigh && !isSelected && "digit-highlight-high border-emerald-500/30",
        isLow && !isSelected && "digit-highlight-low border-rose-500/30",
        isLatest && "ring-2 ring-accent border-accent/50 scale-[1.02] z-10"
      )}
    >
      {/* Latest Digit Cursor Indicator */}
      {isLatest && (
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div className="absolute top-1 left-1 animate-bounce">
            <MousePointer2 className="w-4 h-4 text-accent fill-accent" />
          </div>
          <div className="absolute inset-0 bg-accent/5 animate-pulse" />
        </div>
      )}

      <div className="p-4 flex flex-col items-center justify-center space-y-1">
        <span className={cn(
          "text-4xl font-bold tracking-tighter transition-colors",
          isSelected ? "text-primary" : isLatest ? "text-accent" : "text-foreground group-hover:text-primary"
        )}>
          {digit}
        </span>
        
        <div className="flex flex-col items-center">
          <span className="text-xl font-bold text-foreground tabular-nums">
            {percentage.toFixed(1)}%
          </span>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
            {count} ticks
          </span>
        </div>
      </div>
      
      {/* Visual indicators for high/low status */}
      {isHigh && (
        <div className="absolute top-1 right-1">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>
      )}
      {isLow && (
        <div className="absolute top-1 right-1">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
        </div>
      )}
    </Card>
  );
}
