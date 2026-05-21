"use client"

import { Activity, Signal, Zap, Database } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type ConnectionStatus } from "@/app/lib/deriv-ws";
import { cn } from "@/lib/utils";

interface DashboardHeaderProps {
  status: ConnectionStatus;
  symbol: string;
  totalTicks: number;
  price: number | null;
}

export function DashboardHeader({ status, symbol, totalTicks, price }: DashboardHeaderProps) {
  const statusColors = {
    connected: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    connecting: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    disconnected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    error: "bg-rose-500/10 text-rose-500 border-rose-500/20"
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b bg-card/30 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-xl bg-primary/20">
          <Activity className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight">frostytraders</h1>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">Analysis Engine</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:flex md:items-center gap-2 md:gap-4">
        <Badge variant="outline" className={cn("px-3 py-1 flex items-center gap-2 font-medium capitalize", statusColors[status])}>
          <Signal className="w-3.5 h-3.5" />
          {status}
        </Badge>
        
        {price !== null && (
          <Badge variant="secondary" className="px-3 py-1 bg-accent/10 text-accent border-accent/20 tabular-nums font-bold">
            {price.toFixed(4)}
          </Badge>
        )}

        <Badge variant="secondary" className="px-3 py-1 flex items-center gap-2 bg-secondary/50 text-foreground border-transparent">
          <Zap className="w-3.5 h-3.5 text-accent" />
          {symbol.replace('_', ' ')}
        </Badge>

        <Badge variant="secondary" className="px-3 py-1 flex items-center gap-2 bg-secondary/50 text-foreground border-transparent">
          <Database className="w-3.5 h-3.5 text-primary" />
          {totalTicks} <span className="opacity-60 ml-1">Ticks</span>
        </Badge>
      </div>
    </div>
  );
}
