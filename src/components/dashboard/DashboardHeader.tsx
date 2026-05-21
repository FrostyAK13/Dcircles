
"use client"

import { Activity, Signal, Zap, Database, ChevronDown, BarChart2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { type ConnectionStatus } from "@/app/lib/deriv-ws";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CONTINUOUS_INDICES } from "./DigitFlowApp";
import { Button } from "@/components/ui/button";

interface DashboardHeaderProps {
  status: ConnectionStatus;
  symbol: string;
  totalTicks: number;
  price: number | null;
  onSymbolChange: (id: string) => void;
}

export function DashboardHeader({ status, symbol, totalTicks, price, onSymbolChange }: DashboardHeaderProps) {
  const currentMarket = CONTINUOUS_INDICES.find(m => m.id === symbol) || CONTINUOUS_INDICES[0];

  const statusColors = {
    connected: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    connecting: "bg-amber-500/10 text-amber-500 border-amber-500/20",
    disconnected: "bg-rose-500/10 text-rose-500 border-rose-500/20",
    error: "bg-rose-500/10 text-rose-500 border-rose-500/20"
  };

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border-b bg-card/30 backdrop-blur-sm sticky top-0 z-50">
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Activity className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">frostytraders</h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">Analysis Engine</p>
          </div>
        </div>

        <div className="h-10 w-px bg-border/50 hidden md:block" />

        {/* Market Selector - Deriv Style */}
        <Popover>
          <PopoverTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer group hover:bg-secondary/40 p-2 rounded-lg transition-colors">
              <div className="relative">
                <BarChart2 className="w-6 h-6 text-accent" />
                <div className="absolute -top-2 -right-2 bg-secondary text-[8px] font-bold px-1 rounded border border-border">
                  {currentMarket.short}
                </div>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                    {currentMarket.name}
                  </span>
                  <ChevronDown className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-transform group-data-[state=open]:rotate-180" />
                </div>
                {price !== null && (
                  <span className="text-xs font-medium text-muted-foreground tabular-nums">
                    {price.toFixed(2)}
                  </span>
                )}
              </div>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-0 bg-card border-border shadow-2xl" align="start">
            <div className="p-2 border-b">
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2">Continuous Indices</span>
            </div>
            <div className="max-h-[60vh] overflow-y-auto p-1">
              {CONTINUOUS_INDICES.map((market) => (
                <button
                  key={market.id}
                  onClick={() => onSymbolChange(market.id)}
                  className={cn(
                    "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-colors",
                    symbol === market.id ? "bg-primary/20 text-primary" : "hover:bg-secondary/60 text-foreground"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center font-bold text-[10px]">
                      {market.short}
                    </div>
                    <span className="text-xs font-semibold">{market.name}</span>
                  </div>
                  {symbol === market.id && <Zap className="w-3.5 h-3.5 fill-primary" />}
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="outline" className={cn("px-3 py-1 flex items-center gap-2 font-medium capitalize", statusColors[status])}>
          <Signal className="w-3.5 h-3.5" />
          {status}
        </Badge>
        
        <Badge variant="secondary" className="px-3 py-1 flex items-center gap-2 bg-secondary/50 text-foreground border-transparent">
          <Database className="w-3.5 h-3.5 text-primary" />
          {totalTicks} <span className="opacity-60 ml-1">Ticks</span>
        </Badge>
      </div>
    </div>
  );
}
