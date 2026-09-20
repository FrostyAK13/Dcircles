"use client"

import { useState, useMemo, useEffect, useRef } from 'react';
import { useDigitAnalysis } from '@/hooks/use-digit-analysis';
import { useMultiMarketAnalysis, type MarketData } from '@/hooks/use-multi-market-analysis';
import { DashboardHeader } from './DashboardHeader';
import { DigitCard } from './DigitCard';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { BarChart2, Zap, Database, ExternalLink, LayoutGrid, Percent, Activity, Target, TrendingUp, Hash, ArrowUpDown, Layers, Clock, AlertCircle, Radio, Star, Timer, AreaChart as AreaChartIcon, ChevronRight } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';
import { Progress } from "@/components/ui/progress";
import { 
  Bar, 
  BarChart, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export const CONTINUOUS_INDICES = [
  { id: '1HZ10V', name: 'Volatility 10 (1s) Index', short: '10 (1s)' },
  { id: 'R_10', name: 'Volatility 10 Index', short: '10' },
  { id: '1HZ15V', name: 'Volatility 15 (1s) Index', short: '15 (1s)' },
  { id: 'R_15', name: 'Volatility 15 Index', short: '15' },
  { id: '1HZ25V', name: 'Volatility 25 (1s) Index', short: '25 (1s)' },
  { id: 'R_25', name: 'Volatility 25 Index', short: '25' },
  { id: '1HZ30V', name: 'Volatility 30 (1s) Index', short: '30 (1s)' },
  { id: '1HZ50V', name: 'Volatility 50 (1s) Index', short: '50 (1s)' },
  { id: 'R_50', name: 'Volatility 50 Index', short: '50' },
  { id: '1HZ75V', name: 'Volatility 75 (1s) Index', short: '75 (1s)' },
  { id: 'R_75', name: 'Volatility 75 Index', short: '75' },
  { id: '1HZ90V', name: 'Volatility 90 (1s) Index', short: '90 (1s)' },
  { id: '1HZ100V', name: 'Volatility 100 (1s) Index', short: '100 (1s)' },
  { id: 'R_100', name: 'Volatility 100 Index', short: '100' },
  { id: 'JD10', name: 'Jump 10 Index', short: 'J10' },
  { id: 'JD25', name: 'Jump 25 Index', short: 'J25' },
  { id: 'JD50', name: 'Jump 50 Index', short: 'J50' },
  { id: 'JD75', name: 'Jump 75 Index', short: 'J75' },
  { id: 'JD100', name: 'Jump 100 Index', short: 'J100' },
];

const chartConfig = {
  percentage: {
    label: "Frequency %",
    color: "hsl(var(--primary))",
  },
  price: {
    label: "Price",
    color: "hsl(var(--primary))",
  }
} satisfies ChartConfig;

function calculateEMA(prices: number[], period: number) {
  if (prices.length < period) return null;
  const k = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < prices.length; i++) {
    ema = prices[i] * k + ema * (1 - k);
  }
  return ema;
}

function calculateRSI(prices: number[], period: number = 14) {
  if (prices.length <= period) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = prices[prices.length - i] - prices[prices.length - i - 1];
    if (diff > 0) gains += diff;
    else losses -= diff;
  }
  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period);
  return 100 - (100 / (1 + rs));
}

function calculateATR(prices: number[], period: number = 14) {
  if (prices.length <= period) return null;
  let sum = 0;
  for (let i = 1; i <= period; i++) {
    sum += Math.abs(prices[prices.length - i] - prices[prices.length - i - 1]);
  }
  return sum / period;
}

interface AnalysisResult {
  signal: string;
  color: string;
  led: string;
  flash: boolean;
  timing: string;
  isHit: boolean;
  score: number;
  direction: string;
  barrier: string | null;
}

function getMarketAnalysis(data: MarketData | undefined, strategy: string, lastSignalTime?: number): AnalysisResult {
  const ticks = data?.ticks || [];
  const prices = data?.prices || [];
  const defaultState: AnalysisResult = { 
    signal: 'SCANNING', 
    color: 'text-muted-foreground/30', 
    led: 'bg-muted/20', 
    flash: false, 
    timing: 'STANDBY', 
    isHit: false, 
    score: 0,
    direction: '',
    barrier: null
  };
  
  if (ticks.length < 50) return { ...defaultState, signal: 'CALIBRATING', timing: 'WAITING' };

  if (strategy === 'OVER_UNDER') {
    const w100 = ticks.slice(-100);
    const w20 = ticks.slice(-20);
    const overCount = w100.filter(d => d > 3).length; 
    const underCount = w100.filter(d => d < 6).length; 
    const last20Over = w20.filter(d => d > 3).length;
    const last20Under = w20.filter(d => d < 6).length;

    if (overCount >= 60 && last20Over >= 13) return { signal: 'OVER', direction: 'OVER', color: 'text-primary font-black', led: 'bg-primary shadow-[0_0_20px_rgba(0,166,166,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: overCount, barrier: null };
    if (underCount >= 60 && last20Under >= 13) return { signal: 'UNDER', direction: 'UNDER', color: 'text-rose-500 font-black', led: 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: underCount, barrier: null };
  }

  if (strategy === 'EVEN_ODD') {
    const w100 = ticks.slice(-100);
    const w20 = ticks.slice(-20);
    const evenCount = w100.filter(d => d % 2 === 0).length;
    const oddCount = w100.filter(d => d % 2 !== 0).length;
    const last20Even = w20.filter(d => d % 2 === 0).length;
    const last20Odd = w20.filter(d => d % 2 !== 0).length;

    if (evenCount >= 60 && last20Even >= 13) return { signal: 'EVEN', direction: 'EVEN', color: 'text-primary font-black', led: 'bg-primary shadow-[0_0_20px_rgba(0,166,166,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: evenCount, barrier: null };
    if (oddCount >= 60 && last20Odd >= 13) return { signal: 'ODD', direction: 'ODD', color: 'text-rose-500 font-black', led: 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: oddCount, barrier: null };
  }

  if (strategy === 'MATCHES') {
    if (ticks.length < 200) return { ...defaultState, signal: 'CALIBRATING', timing: 'WAITING' };
    const w200 = ticks.slice(-200);
    const w50 = ticks.slice(-50);
    const counts = new Array(10).fill(0);
    w200.forEach(d => counts[d]++);
    
    const maxVal = Math.max(...counts);
    const maxDigits: number[] = [];
    counts.forEach((c, d) => { if (c === maxVal) maxDigits.push(d); });

    if (maxDigits.length === 1 && maxVal >= 32) {
      const targetDigit = maxDigits[0];
      const match50 = w50.filter(d => d === targetDigit).length;
      if (match50 >= 9) {
        return { signal: `MATCH ${targetDigit}`, direction: `MATCH ${targetDigit}`, color: 'text-amber-500 font-black', led: 'bg-amber-500 shadow-[0_0_20px_rgba(251,191,36,1)]', flash: true, timing: 'RUN BOT', isHit: true, score: maxVal, barrier: null };
      }
    }
  }

  if (strategy === 'RISE_FALL') {
    if (prices.length < 100) return { ...defaultState, signal: 'CALIBRATING', timing: 'WAITING' };
    if (lastSignalTime && Date.now() - lastSignalTime < 20000) return { ...defaultState, signal: 'COOLDOWN', timing: 'WAITING', color: 'text-muted-foreground/40', barrier: null };

    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);
    const currentPrice = prices[prices.length - 1];
    const price10Ago = prices[prices.length - 11];
    const high10 = Math.max(...prices.slice(-11, -1));
    const low10 = Math.min(...prices.slice(-11, -1));
    const last3 = prices.slice(-3);
    
    if (ema20 !== null && ema50 !== null) {
      if (ema20 > ema50 && currentPrice > ema20 && currentPrice > price10Ago && currentPrice > high10 && !(last3[2] < last3[1] && last3[1] < last3[0])) {
        return { signal: 'RISE', direction: 'RISE', color: 'text-emerald-500 font-black', led: 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: 85, barrier: null };
      }
      if (ema20 < ema50 && currentPrice < ema20 && currentPrice < price10Ago && currentPrice < low10 && !(last3[2] > last3[1] && last3[1] > last3[0])) {
        return { signal: 'FALL', direction: 'FALL', color: 'text-rose-500 font-black', led: 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: 85, barrier: null };
      }
    }
  }

  if (strategy === 'HIGHER_LOWER') {
    if (prices.length < 50) return { ...defaultState, signal: 'CALIBRATING', timing: 'WAITING' };
    
    const ema20 = calculateEMA(prices, 20);
    const ema50 = calculateEMA(prices, 50);
    const rsi = calculateRSI(prices, 14);
    const atr = calculateATR(prices, 14);
    const current = prices[prices.length - 1];
    const last3 = prices.slice(-4, -1);
    
    if (ema20 && ema50 && rsi && atr) {
      if (ema20 > ema50 && current > ema20 && rsi >= 55 && rsi <= 70 && current > Math.max(...last3)) {
        const barrier = current - (atr * 0.2);
        return { signal: `HIGHER | Barrier: ${barrier.toFixed(3)}`, direction: 'HIGHER', color: 'text-primary font-black', led: 'bg-primary shadow-[0_0_20px_rgba(0,166,166,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: rsi, barrier: barrier.toFixed(3) };
      }
      if (ema20 < ema50 && current < ema20 && rsi >= 30 && rsi <= 45 && current < Math.min(...last3)) {
        const barrier = current + (atr * 0.2);
        return { signal: `LOWER | Barrier: ${barrier.toFixed(3)}`, direction: 'LOWER', color: 'text-rose-500 font-black', led: 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: 100 - rsi, barrier: barrier.toFixed(3) };
      }
    }
  }

  if (strategy === 'ONLY_UPS_DOWNS') {
    if (prices.length < 71) return { ...defaultState, signal: 'CALIBRATING', timing: 'WAITING' };
    if (lastSignalTime && Date.now() - lastSignalTime < 20000) return { ...defaultState, signal: 'COOLDOWN', timing: 'WAITING', color: 'text-muted-foreground/40', barrier: null };

    const ema8 = calculateEMA(prices, 8);
    const ema21 = calculateEMA(prices, 21);
    
    if (ema8 !== null && ema21 !== null) {
      const latest5 = prices.slice(-5);
      const prior20 = prices.slice(-25, -5);
      const prior50 = prices.slice(-55, -5);
      const last10 = prices.slice(-10);

      const isStrictlyRising = latest5.every((p, i) => i === 0 || p > latest5[i - 1]);
      const isStrictlyFalling = latest5.every((p, i) => i === 0 || p < latest5[i - 1]);

      const highestPrior20 = Math.max(...prior20);
      const lowestPrior20 = Math.min(...prior20);
      const currentPrice = prices[prices.length - 1];
      
      const noEqualTicks = last10.every((p, i) => i === 0 || p !== last10[i - 1]);

      const avgMoveLatest5 = latest5.reduce((sum, p, i) => i === 0 ? 0 : sum + Math.abs(p - latest5[i-1]), 0) / 4;
      const avgMovePrior50 = prior50.reduce((sum, p, i) => i === 0 ? 0 : sum + Math.abs(p - prior50[i-1]), 0) / 49;

      const velocityConfirmed = avgMoveLatest5 >= (1.25 * avgMovePrior50);

      if (ema8 > ema21 && isStrictlyRising && currentPrice > highestPrior20 && velocityConfirmed && noEqualTicks) {
        return { signal: 'ONLY UPS | Duration: 2 ticks', direction: 'ONLY UPS', color: 'text-emerald-400 font-black', led: 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)]', flash: true, timing: 'DURATION: 2T', isHit: true, score: 98, barrier: null };
      }

      if (ema8 < ema21 && isStrictlyFalling && currentPrice < lowestPrior20 && velocityConfirmed && noEqualTicks) {
        return { signal: 'ONLY DOWNS | Duration: 2 ticks', direction: 'ONLY DOWNS', color: 'text-rose-400 font-black', led: 'bg-rose-400 shadow-[0_0_20px_rgba(251,113,133,1)]', flash: true, timing: 'DURATION: 2T', isHit: true, score: 98, barrier: null };
      }
    }
  }

  return defaultState;
}

interface MarketEngineCardProps {
  market: { id: string; name: string };
  data: MarketData | undefined;
  strategy: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  isGolden?: boolean;
  expiryTimestamp?: number;
  lastSignalTime?: number;
  cachedAnalysis?: AnalysisResult | null;
}

function MarketEngineCard({ market, data, strategy, isSelected, onSelect, isGolden, expiryTimestamp, lastSignalTime, cachedAnalysis }: MarketEngineCardProps) {
  const [countdown, setCountdown] = useState(5);
  const [lifeRemaining, setLifeRemaining] = useState(30);
  
  const analysis = useMemo(() => {
    if (cachedAnalysis) return cachedAnalysis;
    return getMarketAnalysis(data, strategy, lastSignalTime);
  }, [data, strategy, lastSignalTime, cachedAnalysis]);

  const isFlashy = analysis.isHit; 

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isFlashy) {
      if (countdown > 0) {
        timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      }
    } else {
      setCountdown(5);
    }
    return () => clearTimeout(timer);
  }, [isFlashy, countdown]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (expiryTimestamp) {
      const updateLife = () => {
        const elapsed = Math.floor((Date.now() - expiryTimestamp) / 1000);
        const remaining = Math.max(0, 30 - elapsed);
        setLifeRemaining(remaining);
      };
      updateLife();
      timer = setInterval(updateLife, 1000);
    }
    return () => clearInterval(timer);
  }, [expiryTimestamp]);

  const StrategyIcon = useMemo(() => {
    switch(strategy) {
      case 'OVER_UNDER': return ArrowUpDown;
      case 'EVEN_ODD': return Hash;
      case 'MATCHES': return Target;
      case 'RISE_FALL': return TrendingUp;
      case 'HIGHER_LOWER': return Layers;
      case 'ONLY_UPS_DOWNS': return Zap;
      default: return Activity;
    }
  }, [strategy]);

  return (
    <div
      onClick={() => onSelect?.(market.id)}
      className={cn(
        "group relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-[2.5rem] border-2 transition-all duration-500 min-h-[180px] sm:min-h-[200px] cursor-default overflow-hidden",
        isGolden 
          ? "bg-amber-400/10 border-amber-400 shadow-[0_0_40px_rgba(251,191,36,0.5)] z-20 scale-[1.05]" 
          : isFlashy 
            ? "bg-card border-primary shadow-[0_0_40px_rgba(0,166,166,0.4)] z-10 scale-[1.02] dark:bg-primary/10" 
            : isSelected
              ? "bg-card border-primary/40 shadow-[0_0_20px_rgba(0,166,166,0.05)] z-10 scale-[1.01]"
              : "bg-muted/5 border-border/10 hover:border-border/30 hover:bg-muted/10 scale-100"
      )}
    >
      {isGolden && <div className="absolute top-0 left-0 w-full h-1 bg-amber-400 animate-pulse" />}

      <div className="w-full flex justify-between items-start mb-2 z-10">
        <div className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500",
          isGolden ? "bg-amber-400 text-black shadow-lg" : isSelected || isFlashy ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground/30"
        )}>
          {isGolden ? <Star className="w-5 h-5 fill-current" /> : <StrategyIcon className={cn("w-5 h-5", isFlashy && "animate-pulse")} />}
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className={cn(
            "px-2.5 py-1 rounded-xl text-[7px] font-black uppercase tracking-[0.2em] border flex items-center gap-1.5 transition-all duration-300",
            isGolden ? "bg-amber-400 text-black border-amber-500" : isFlashy ? "bg-primary text-white border-primary shadow-[0_0_15px_rgba(0,166,166,0.5)]" : "bg-black/20 text-muted-foreground/50 border-transparent"
          )}>
            <Clock className="w-2.5 h-2.5" />
            {isFlashy ? (countdown > 0 ? `${strategy === 'MATCHES' ? 'RUN BOT' : (strategy === 'ONLY_UPS_DOWNS' ? '2T DURATION' : 'ENTRY NOW')} (${countdown}s)` : "ACTIVE SIGNAL") : analysis.timing}
          </div>
          {expiryTimestamp && (
            <div className={cn(
              "px-2 py-0.5 rounded-lg text-[6px] font-black uppercase tracking-[0.1em] border flex items-center gap-1",
              lifeRemaining < 10 ? "text-rose-500 border-rose-500/30 bg-rose-500/5 animate-pulse" : "text-muted-foreground/60 border-border/20 bg-muted/5"
            )}>
              <Timer className="w-2 h-2" />
              LIFE: {lifeRemaining}s
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-center gap-1.5 w-full z-10">
        <div className="flex flex-col items-center">
           <span className={cn(
            "text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-center px-1 truncate w-full",
            isGolden ? "text-amber-500" : isSelected || isFlashy ? "text-primary" : "text-muted-foreground/40"
          )}>
            {market.name.replace('Index', '').trim()}
          </span>
          {strategy === 'RISE_FALL' && (
            <span className="text-[6px] font-bold text-muted-foreground/40 uppercase tracking-[0.1em] mt-0.5">100T | 5T Target</span>
          )}
        </div>
        
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border mt-1 w-full justify-center transition-all duration-500",
          isGolden ? "bg-amber-400/20 border-amber-400/50" : "bg-black/5 dark:bg-white/5 border-border/10"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            isGolden ? "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,1)]" : analysis.led,
            (isFlashy || isGolden) && "animate-pulse"
          )} />
          <span className={cn("text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em] text-center truncate w-full px-1", isGolden ? "text-amber-500" : analysis.color)}>
            {isGolden ? (analysis.direction || "GOLDEN") : (isFlashy ? analysis.signal : "SCANNING")}
          </span>
        </div>

        {strategy === 'HIGHER_LOWER' && analysis.barrier && (
           <div className="mt-3 w-full flex flex-col items-center gap-1 animate-in fade-in zoom-in duration-500">
             <span className="text-[6px] font-black text-muted-foreground/60 uppercase tracking-[0.2em]">Calculated Barrier</span>
             <div className={cn(
               "px-4 py-1.5 rounded-xl font-black text-[11px] tabular-nums border shadow-lg transition-all",
               analysis.direction === 'HIGHER' 
                 ? "bg-primary/10 border-primary/40 text-primary shadow-[0_0_15px_rgba(0,166,166,0.2)]" 
                 : "bg-rose-500/10 border-rose-500/40 text-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]"
             )}>
               {analysis.barrier}
             </div>
           </div>
        )}
      </div>

      <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10 opacity-30">
        <div className={cn("w-1 h-1 rounded-full", data?.prices?.length ? "bg-primary animate-ping" : "bg-muted")} />
        <span className="text-[6px] font-bold uppercase tracking-tighter">Live Link</span>
      </div>
    </div>
  );
}

interface SignalScannerProps {
  marketData: Record<string, MarketData>;
  strategy: string;
  signals: string[];
  goldenIds: string[];
  signalRegistry: Record<string, { timestamp: number; analysis: AnalysisResult }>;
}

function SignalScanner({ marketData, strategy, signals, goldenIds, signalRegistry }: SignalScannerProps) {
  const sortedSignals = useMemo(() => {
    const goldens = signals.filter(id => goldenIds.includes(id));
    const rest = signals.filter(id => !goldenIds.includes(id));
    return [...goldens, ...rest];
  }, [signals, goldenIds]);

  const strategyMeta = useMemo(() => {
    switch(strategy) {
      case 'OVER_UNDER': return '100 Ticks Density / 20 Ticks Momentum';
      case 'EVEN_ODD': return '100 Ticks Density / 20 Ticks Momentum';
      case 'MATCHES': return '200 Ticks Density / 50 Ticks Momentum';
      case 'RISE_FALL': return '100 Ticks Analysis / 5 Ticks Duration';
      case 'HIGHER_LOWER': return '50 Ticks SMA & ATR Analysis';
      case 'ONLY_UPS_DOWNS': return 'EMA & Velocity & Breakout Analysis';
      default: return 'Real-time Statistical Engine';
    }
  }, [strategy]);

  return (
    <Card className="bg-card border-primary/20 shadow-2xl icy-glow overflow-hidden rounded-[2.5rem]">
      <CardHeader className="py-4 px-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/20">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <Radio className="w-5 h-5 text-primary animate-pulse" />
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Live Signal Scanner</h3>
          </div>
          <span className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-[0.1em] ml-8">{strategyMeta}</span>
        </div>
        <div className="flex items-center gap-2">
          {goldenIds.length > 0 && (
            <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] bg-amber-400/10 text-amber-500 border-amber-400/20">
              GOLDEN TIER ACTIVE
            </Badge>
          )}
          <Badge variant="outline" className="text-[9px] font-black uppercase tracking-[0.2em] bg-primary/10 text-primary border-primary/20">
            {signals.length} Active Signals
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 min-h-[120px] flex items-center justify-center">
        {sortedSignals.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 w-full">
            {sortedSignals.map((id) => {
              const market = CONTINUOUS_INDICES.find(m => m.id === id);
              if (!market) return null;
              const entry = signalRegistry[id];
              return (
                <MarketEngineCard 
                  key={id}
                  market={market}
                  data={marketData[id]}
                  strategy={strategy}
                  isGolden={goldenIds.includes(id)}
                  expiryTimestamp={entry?.timestamp}
                  lastSignalTime={entry?.timestamp}
                  cachedAnalysis={entry?.analysis}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 opacity-20">
            <AlertCircle className="w-8 h-8" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-center">
              Scanning indices for confirmations...
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface TacticalAnalysisCardProps {
  title: string;
  labels: [string, string];
  counts: [number, number];
  history: number[];
  colorSchema: 'cyan-rose' | 'amber-cyan';
  type: 'over-under' | 'even-odd' | 'matches' | 'rise-fall';
  targetDigit?: number;
  onTargetChange?: (val: number) => void;
}

function TacticalAnalysisCard({ title, labels, counts, history, colorSchema, type, targetDigit, onTargetChange }: TacticalAnalysisCardProps) {
  const total = counts[0] + counts[1];
  const p1 = total > 0 ? Math.round((counts[0] / total) * 100) : 0;
  const p2 = total > 0 ? Math.round((counts[1] / total) * 100) : 0;

  const getDotColor = (val: number) => {
    if (type === 'over-under') return val > (targetDigit ?? 4) ? 'bg-primary' : 'bg-rose-500';
    if (type === 'even-odd') return val % 2 === 0 ? 'bg-primary' : 'bg-rose-500';
    if (type === 'matches') return val === (targetDigit ?? 0) ? 'bg-primary' : 'bg-rose-500';
    if (type === 'rise-fall') return val > 0 ? 'bg-primary' : 'bg-rose-500';
    return 'bg-muted';
  };

  return (
    <Card className="bg-card border-border/20 shadow-xl rounded-3xl overflow-hidden icy-glass flex flex-col">
      <CardHeader className="py-4 px-6 border-b border-border/10">
        <h3 className="text-[10px] font-black uppercase tracking-[0.25em] text-muted-foreground">{title}</h3>
      </CardHeader>
      <CardContent className="p-5 flex flex-col gap-6">
        {onTargetChange && (
          <div className="flex flex-col gap-2">
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Selecting Digit</span>
            <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
              {[0,1,2,3,4,5,6,7,8,9].map(d => (
                <button
                  key={d}
                  onClick={() => onTargetChange(d)}
                  className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black transition-all",
                    targetDigit === d ? "bg-primary text-white shadow-lg scale-110" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  )}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
             <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{labels[0]}</span>
             <span className={cn("text-2xl font-black tabular-nums", colorSchema === 'cyan-rose' ? "text-primary" : "text-amber-500")}>{counts[0]}</span>
          </div>
          <div className="flex flex-col items-end gap-1">
             <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">{labels[1]}</span>
             <span className="text-2xl font-black tabular-nums text-rose-500">{counts[1]}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[7px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Digit History</span>
            <span className="text-[6px] font-bold text-muted-foreground/40 uppercase">Next <ChevronRight className="inline w-2 h-2" /></span>
          </div>
          <div className="flex gap-1.5 justify-center py-2">
            {history.slice(-10).map((val, i) => (
              <div key={i} className={cn("w-3 h-3 rounded-full shadow-sm", getDotColor(val))} />
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.1em]">
              <span>{labels[0]}</span>
              <span>{p1}%</span>
            </div>
            <Progress value={p1} className={cn("h-1.5", colorSchema === 'cyan-rose' ? "[&>div]:bg-primary" : "[&>div]:bg-amber-500")} />
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-[0.1em]">
              <span>{labels[1]}</span>
              <span>{p2}%</span>
            </div>
            <Progress value={p2} className="h-1.5 [&>div]:bg-rose-500" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DigitFlowApp() {
  const [strategySelections, setStrategySelections] = useState<Record<string, string>>({
    'OVER_UNDER': '1HZ10V', 'EVEN_ODD': 'R_10', 'MATCHES': '1HZ15V', 'RISE_FALL': 'R_15', 'HIGHER_LOWER': '1HZ25V', 'ONLY_UPS_DOWNS': 'R_25',
  });
  const [activeStrategy, setActiveStrategy] = useState('OVER_UNDER');
  const [tradeSide, setTradeSide] = useState('none');
  const [mounted, setMounted] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('dashboard');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const [ouTarget, setOuTarget] = useState(4);
  const [matchTarget, setMatchTarget] = useState(0);

  const [multiSignalRegistry, setMultiSignalRegistry] = useState<Record<string, Record<string, { timestamp: number; analysis: AnalysisResult }>>>({
    'OVER_UNDER': {}, 'EVEN_ODD': {}, 'MATCHES': {}, 'RISE_FALL': {}, 'HIGHER_LOWER': {}, 'ONLY_UPS_DOWNS': {},
  });

  const marketIds = useMemo(() => CONTINUOUS_INDICES.map(m => m.id), []);
  const { marketData, status } = useMultiMarketAnalysis(marketIds);

  const currentSymbol = strategySelections[activeStrategy] || 'R_10';
  const { distribution, latestDigit, latestPrice, totalTicks, prices, ticks } = useDigitAnalysis(currentSymbol);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const now = Date.now();
    setMultiSignalRegistry(prev => {
      const next = { ...prev };
      const currentRegistry = { ...next[activeStrategy] };
      let changed = false;

      Object.entries(marketData).forEach(([id, data]) => {
        const existing = currentRegistry[id];
        if (!existing) {
          const analysis = getMarketAnalysis(data, activeStrategy);
          if (analysis.isHit) {
            currentRegistry[id] = { timestamp: now, analysis };
            changed = true;
          }
        }
      });

      Object.entries(currentRegistry).forEach(([id, entry]) => {
        if (now - entry.timestamp > 30000) {
          delete currentRegistry[id];
          changed = true;
        }
      });

      if (changed) {
        next[activeStrategy] = currentRegistry;
        return next;
      }
      return prev;
    });
  }, [marketData, activeStrategy]);

  const currentStrategyRegistry = multiSignalRegistry[activeStrategy] || {};
  const persistentSignalIds = useMemo(() => Object.keys(currentStrategyRegistry), [currentStrategyRegistry]);

  const goldenMarketIds = useMemo(() => {
    if (persistentSignalIds.length === 0) return [];
    const scored = persistentSignalIds.map(id => ({ 
      id, 
      score: currentStrategyRegistry[id].analysis.score 
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map(s => s.id);
  }, [persistentSignalIds, currentStrategyRegistry]);

  const stats = useMemo(() => {
    const sorted = [...distribution].sort((a, b) => b.percentage - a.percentage);
    return { high: sorted[0]?.digit, secondHigh: sorted[1]?.digit, low: sorted[9]?.digit, secondLow: sorted[8]?.digit };
  }, [distribution]);

  const currentMarketAnalysis = useMemo(() => {
    return getMarketAnalysis(marketData[currentSymbol], activeStrategy);
  }, [marketData, currentSymbol, activeStrategy]);

  const tacticalStats = useMemo(() => {
    const lastWindow = ticks.slice(-1000);
    const lastWindowPrices = prices.slice(-1000);
    
    const ouCounts: [number, number] = [lastWindow.filter(d => d > ouTarget).length, lastWindow.filter(d => d < (ouTarget + 1)).length];
    const eoCounts: [number, number] = [lastWindow.filter(d => d % 2 === 0).length, lastWindow.filter(d => d % 2 !== 0).length];
    const matchCounts: [number, number] = [lastWindow.filter(d => d === matchTarget).length, lastWindow.filter(d => d !== matchTarget).length];
    
    const rfHistory = lastWindowPrices.slice(-10).map((p, i, arr) => i === 0 ? 0 : (p > arr[i-1] ? 1 : -1));
    const riseCount = lastWindowPrices.filter((p, i, arr) => i > 0 && p > arr[i-1]).length;
    const fallCount = lastWindowPrices.filter((p, i, arr) => i > 0 && p < arr[i-1]).length;

    return { ouCounts, eoCounts, matchCounts, riseCount, fallCount, rfHistory };
  }, [ticks, prices, ouTarget, matchTarget]);

  const analysisTrigger = useMemo(() => {
    if (tradeSide === 'none') return null;
    let targetAvg = 0;
    if (tradeSide === 'over') {
      const p0 = distribution.find(d => d.digit === 0)?.percentage || 0;
      const p1 = distribution.find(d => d.digit === 1)?.percentage || 0;
      const p2 = distribution.find(d => d.digit === 2)?.percentage || 0;
      targetAvg = (p0 + p1 + p2) / 3;
    } else if (tradeSide === 'under') {
      const p9 = distribution.find(d => d.digit === 9)?.percentage || 0;
      const p8 = distribution.find(d => d.digit === 8)?.percentage || 0;
      const p7 = distribution.find(d => d.digit === 7)?.percentage || 0;
      targetAvg = (p9 + p8 + p7) / 3;
    }
    let closestDigit = 0;
    let minDiff = Infinity;
    distribution.forEach(d => {
      const diff = Math.abs(d.percentage - targetAvg);
      if (diff < minDiff) {
        minDiff = diff;
        closestDigit = d.digit;
      }
    });
    return { digit: closestDigit, side: tradeSide.toUpperCase() };
  }, [tradeSide, distribution]);

  const handleMarketSelect = (marketId: string) => setStrategySelections(prev => ({ ...prev, [activeStrategy]: marketId }));

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen w-full bg-background text-foreground relative overflow-hidden">
      <DashboardHeader status={status} />
      
      <main className="relative z-10 flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 overflow-y-auto">
        <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
          <div className="flex justify-center mb-6 sm:mb-8 sticky top-0 z-40 bg-background/80 backdrop-blur-md py-2 px-3">
            <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/50 h-auto flex-nowrap overflow-x-auto justify-start sm:justify-center w-full max-w-fit scrollbar-hide">
              {[
                { value: 'dashboard', label: 'Analysis', icon: BarChart2 },
                { value: 'navigator-ai', label: 'Navigator Hub', icon: ArrowUpDown },
                { value: 'scanner', label: 'Scanner', icon: ExternalLink },
                { value: 'digits', label: 'Digits', icon: LayoutGrid },
                { value: 'percentage', label: 'Percentage', icon: Percent },
              ].map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} className="rounded-xl px-3 sm:px-6 py-2 font-bold uppercase tracking-widest text-[8px] sm:text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white shrink-0">
                  <tab.icon className="w-3.5 h-3.5 mr-2" />{tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none pb-20">
            <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
              <Card className="border-none bg-card rounded-[3rem] shadow-2xl icy-glow overflow-hidden relative">
                <CardContent className="p-4 sm:p-12 space-y-8">
                  <div className="flex flex-col sm:flex-row items-center gap-4 justify-between w-full">
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <div className="w-full sm:w-auto flex items-center gap-3 cursor-pointer group hover:bg-muted/30 p-2.5 rounded-2xl transition-colors border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
                          <BarChart2 className="w-5 h-5 text-primary" />
                          <div className="flex flex-col">
                            <span className="text-[10px] sm:text-[11px] font-black text-foreground group-hover:text-primary transition-colors truncate">
                              {CONTINUOUS_INDICES.find(m => m.id === currentSymbol)?.name}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <Database className="w-2.5 h-2.5" />{totalTicks} Ticks
                            </span>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0 bg-card border-border/50 shadow-2xl backdrop-blur-2xl text-card-foreground" align="start">
                        <div className="p-3 border-b border-border/40"><span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2">Market Selector</span></div>
                        <div className="max-h-[50vh] overflow-y-auto p-1">
                          {CONTINUOUS_INDICES.map((market) => (
                            <button key={market.id} onClick={() => { handleMarketSelect(market.id); setIsPopoverOpen(false); }} className={cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors", currentSymbol === market.id ? "bg-primary/10 text-primary" : "hover:bg-muted/40 text-foreground")}>
                              <span className="text-xs font-semibold">{market.name}</span>
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Select value={tradeSide} onValueChange={setTradeSide}>
                      <SelectTrigger className="w-full sm:w-32 h-10 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border border-border/40 bg-muted/40 focus:ring-0 rounded-xl">
                        <SelectValue placeholder="Focus" />
                      </SelectTrigger>
                      <SelectContent className="bg-card border-border/50">
                        <SelectItem value="none" className="text-[9px] font-black uppercase tracking-widest">General</SelectItem>
                        <SelectItem value="over" className="text-[9px] font-black uppercase tracking-widest text-primary">OVER</SelectItem>
                        <SelectItem value="under" className="text-[9px] font-black uppercase tracking-widest text-rose-500">UNDER</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex flex-col items-center justify-center py-6 gap-8">
                    {/* REDUCED PRICE DISPLAY SIZE HERE */}
                    <div className="text-4xl sm:text-7xl font-black tracking-tighter flex items-baseline tabular-nums text-primary brand-glow">
                      {latestPrice?.toFixed(2) || "---"}
                    </div>
                    
                    <div className={cn(
                      "flex flex-col items-center gap-4 px-10 py-5 rounded-[2.5rem] border-2 transition-all duration-700 animate-in fade-in zoom-in shadow-2xl",
                      (currentMarketAnalysis.isHit || analysisTrigger)
                        ? "bg-primary/10 border-primary shadow-[0_0_60px_rgba(0,166,166,0.3)] scale-110" 
                        : "bg-muted/10 border-border/20 opacity-40 scale-100"
                    )}>
                      <div className="flex items-center gap-4">
                        <div className={cn(
                          "w-5 h-5 rounded-full transition-all duration-300",
                          (currentMarketAnalysis.isHit || analysisTrigger) ? "bg-primary animate-ping" : "bg-muted-foreground/30"
                        )} />
                        <span className={cn(
                          "text-sm sm:text-2xl font-black uppercase tracking-[0.5em] transition-colors",
                          (currentMarketAnalysis.isHit || analysisTrigger) ? "text-primary" : "text-muted-foreground/60"
                        )}>
                          {analysisTrigger 
                            ? `${analysisTrigger.side} TRIGGER: DIGIT ${analysisTrigger.digit}`
                            : currentMarketAnalysis.isHit 
                              ? (activeStrategy === 'MATCHES' ? `RUN BOT: ${currentMarketAnalysis.signal}` : currentMarketAnalysis.signal) 
                              : "SCANNING ENGINE ACTIVE"}
                        </span>
                      </div>
                      {(currentMarketAnalysis.isHit || analysisTrigger) && (
                        <Badge variant="outline" className="bg-primary text-white border-primary text-[10px] sm:text-[12px] font-black tracking-[0.3em] px-6 py-1.5 rounded-2xl animate-pulse shadow-lg">
                          HIGH CONFIDENCE ENTRY
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-3 sm:gap-10 max-w-5xl mx-auto px-1 sm:px-6">
                    {distribution.map((d) => (
                      <DigitCard key={d.digit} digit={d.digit} percentage={d.percentage} isHigh={d.digit === stats.high} isSecondHigh={d.digit === stats.secondHigh} isLow={d.digit === stats.low} isSecondLow={d.digit === stats.secondLow} isLatest={d.digit === latestDigit} onClick={() => {}} />
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TacticalAnalysisCard 
                  title="Over / Under Analysis" 
                  labels={["Over", "Under"]} 
                  counts={tacticalStats.ouCounts} 
                  history={ticks.slice(-10)} 
                  colorSchema="cyan-rose" 
                  type="over-under"
                  targetDigit={ouTarget}
                  onTargetChange={setOuTarget}
                />
                <TacticalAnalysisCard 
                  title="Even / Odd Analysis" 
                  labels={["Even", "Odd"]} 
                  counts={tacticalStats.eoCounts} 
                  history={ticks.slice(-10)} 
                  colorSchema="cyan-rose" 
                  type="even-odd"
                />
                <TacticalAnalysisCard 
                  title="Matches / Differs" 
                  labels={["Match", "No Match"]} 
                  counts={tacticalStats.matchCounts} 
                  history={ticks.slice(-10)} 
                  colorSchema="amber-cyan" 
                  type="matches"
                  targetDigit={matchTarget}
                  onTargetChange={setMatchTarget}
                />
                <TacticalAnalysisCard 
                  title="Rise / Fall Trend" 
                  labels={["Rise", "Fall"]} 
                  counts={[tacticalStats.riseCount, tacticalStats.fallCount]} 
                  history={tacticalStats.rfHistory} 
                  colorSchema="cyan-rose" 
                  type="rise-fall"
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="navigator-ai" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none pb-20">
            <Tabs value={activeStrategy} onValueChange={setActiveStrategy} className="flex flex-col gap-6">
              <div className="sticky top-0 z-40 bg-background/80 backdrop-blur-md py-2 px-1">
                <TabsList className="bg-card/80 p-1.5 rounded-[1.5rem] border border-primary/20 h-auto flex-nowrap overflow-x-auto justify-start w-full scrollbar-hide gap-1.5 shadow-lg backdrop-blur-xl">
                  {[
                    { id: 'OVER_UNDER', label: 'Over / Under', icon: ArrowUpDown },
                    { id: 'EVEN_ODD', label: 'Even / Odd', icon: Hash },
                    { id: 'MATCHES', label: 'Matches', icon: Target },
                    { id: 'RISE_FALL', label: 'Rise / Fall', icon: TrendingUp },
                    { id: 'HIGHER_LOWER', label: 'Higher / Lower', icon: Layers },
                    { id: 'ONLY_UPS_DOWNS', label: 'Only Ups / Downs', icon: Zap },
                  ].map((tab) => (
                    <TabsTrigger 
                      key={tab.id} 
                      value={tab.id} 
                      className="rounded-2xl px-3 sm:px-5 py-2.5 font-black uppercase tracking-[0.2em] text-[8px] sm:text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white shrink-0 flex items-center gap-2 transition-all"
                    >
                      <tab.icon className="w-3.5 h-3.5" />{tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <SignalScanner 
                marketData={marketData} 
                strategy={activeStrategy} 
                signals={persistentSignalIds} 
                goldenIds={goldenMarketIds} 
                signalRegistry={currentStrategyRegistry} 
              />
              
              <Card className="border border-border/50 bg-card rounded-[3rem] shadow-2xl icy-glow overflow-hidden min-h-[50vh] flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-muted/5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 max-w-7xl mx-auto">
                    {CONTINUOUS_INDICES.map((market) => (
                      <MarketEngineCard 
                        key={market.id} 
                        market={market} 
                        data={marketData[market.id]} 
                        strategy={activeStrategy} 
                        isSelected={strategySelections[activeStrategy] === market.id} 
                        onSelect={(id) => handleMarketSelect(id)} 
                        isGolden={goldenMarketIds.includes(market.id)} 
                        expiryTimestamp={currentStrategyRegistry[market.id]?.timestamp} 
                        lastSignalTime={currentStrategyRegistry[market.id]?.timestamp}
                        cachedAnalysis={currentStrategyRegistry[market.id]?.analysis}
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="scanner" className="mt-0 outline-none pb-20"><Card className="h-[80vh] overflow-hidden rounded-3xl"><iframe src="https://tracktool.netlify.app/signals" className="w-full h-full" /></Card></TabsContent>
          <TabsContent value="digits" className="mt-0 outline-none pb-20"><Card className="h-[80vh] overflow-hidden rounded-3xl"><iframe src="https://tracktool.netlify.app/digitshome" className="w-full h-full" /></Card></TabsContent>
          <TabsContent value="percentage" className="mt-0 outline-none pb-20"><Card className="h-[80vh] overflow-hidden rounded-3xl"><iframe src="https://api.binarytool.site" className="w-full h-full" /></Card></TabsContent>
        </Tabs>

        <div className="w-full pt-12 pb-8 flex flex-col items-center justify-center gap-2 border-t border-border/10 mt-8 opacity-60">
          <div className="flex items-center gap-2 text-[10px] sm:text-[12px] font-black uppercase tracking-[0.3em] text-[#A67C52] transition-all hover:opacity-100 hover:scale-105">
            <div className="w-2 h-2 rounded-full bg-[#A67C52] animate-pulse" />
            Created by Alex
          </div>
          <span className="text-[8px] font-bold text-muted-foreground/40 uppercase tracking-[0.1em]">© 2025 INDEX NAVIGATOR TAC HUB</span>
        </div>
      </main>
    </div>
  );
}
