
"use client"

import { useState, useMemo, useEffect, useRef } from 'react';
import { useDigitAnalysis } from '@/hooks/use-digit-analysis';
import { useMultiMarketAnalysis, type MarketData } from '@/hooks/use-multi-market-analysis';
import { DashboardHeader } from './DashboardHeader';
import { DigitCard } from './DigitCard';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { BarChart2, Zap, Database, ExternalLink, LayoutGrid, Percent, Activity, Target, TrendingUp, Hash, ArrowUpDown, Layers, Clock, AlertCircle, Radio, Star, Timer } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from '@/components/ui/badge';

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

function getMarketAnalysis(data: MarketData | undefined, strategy: string) {
  const ticks = data?.ticks || [];
  const prices = data?.prices || [];
  const defaultState = { 
    signal: 'SCANNING', 
    color: 'text-muted-foreground/30', 
    led: 'bg-muted/20', 
    flash: false, 
    timing: 'STANDBY', 
    isHit: false, 
    score: 0,
    direction: ''
  };
  
  if (ticks.length < 100) return { ...defaultState, signal: 'CALIBRATING', timing: 'WAITING' };

  // 100/20 Rule for Over/Under and Even/Odd
  const w100 = ticks.slice(-100);
  const w20 = ticks.slice(-20);

  if (strategy === 'OVER_UNDER') {
    const overCount = w100.filter(d => d > 3).length; 
    const underCount = w100.filter(d => d < 6).length; 
    const last20Over = w20.filter(d => d > 3).length;
    const last20Under = w20.filter(d => d < 6).length;

    if (overCount >= 60 && last20Over >= 13) return { signal: 'OVER', direction: 'OVER', color: 'text-primary font-black', led: 'bg-primary shadow-[0_0_20px_rgba(0,166,166,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: overCount };
    if (underCount >= 60 && last20Under >= 13) return { signal: 'UNDER', direction: 'UNDER', color: 'text-rose-500 font-black', led: 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: underCount };
  }

  if (strategy === 'EVEN_ODD') {
    const evenCount = w100.filter(d => d % 2 === 0).length;
    const oddCount = w100.filter(d => d % 2 !== 0).length;
    const last20Even = w20.filter(d => d % 2 === 0).length;
    const last20Odd = w20.filter(d => d % 2 !== 0).length;

    if (evenCount >= 60 && last20Even >= 13) return { signal: 'EVEN', direction: 'EVEN', color: 'text-primary font-black', led: 'bg-primary shadow-[0_0_20px_rgba(0,166,166,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: evenCount };
    if (oddCount >= 60 && last20Odd >= 13) return { signal: 'ODD', direction: 'ODD', color: 'text-rose-500 font-black', led: 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]', flash: true, timing: 'ENTRY NOW', isHit: true, score: oddCount };
  }

  // 200/50 Rule for Matches
  if (strategy === 'MATCHES') {
    if (ticks.length < 200) return { ...defaultState, signal: 'CALIBRATING', timing: 'WAITING' };
    const w200 = ticks.slice(-200);
    const w50 = ticks.slice(-50);
    
    const counts = new Array(10).fill(0);
    w200.forEach(d => counts[d]++);
    
    const maxVal = Math.max(...counts);
    const maxDigits: number[] = [];
    counts.forEach((c, d) => { if (c === maxVal) maxDigits.push(d); });

    // Condition 3: At least 32 times
    // Condition 6: No tie
    if (maxDigits.length === 1 && maxVal >= 32) {
      const targetDigit = maxDigits[0];
      const match50 = w50.filter(d => d === targetDigit).length;
      
      // Condition 4: At least 9 times in last 50
      if (match50 >= 9) {
        return { 
          signal: `MATCH ${targetDigit}`, 
          direction: `MATCH ${targetDigit}`, 
          color: 'text-amber-500 font-black', 
          led: 'bg-amber-500 shadow-[0_0_20px_rgba(251,191,36,1)]', 
          flash: true, 
          timing: 'MATCH FOUND', 
          isHit: true, 
          score: maxVal 
        };
      }
    }
  }

  if (strategy === 'RISE_FALL') {
    if (prices.length >= 20) {
      const diff = prices[prices.length - 1] - prices[prices.length - 20];
      const highDigits = w20.filter(d => d > 4).length;
      const lowDigits = w20.filter(d => d < 5).length;
      if (diff > 0.0002 && highDigits >= 13) return { signal: 'RISE', direction: 'RISE', color: 'text-emerald-500 font-black', led: 'bg-emerald-500 shadow-[0_0_20px_rgba(16,185,129,1)]', flash: true, timing: 'UP MOMENTUM', isHit: true, score: highDigits * 3 };
      if (diff < -0.0002 && lowDigits >= 13) return { signal: 'FALL', direction: 'FALL', color: 'text-rose-500 font-black', led: 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]', flash: true, timing: 'DOWN MOMENTUM', isHit: true, score: lowDigits * 3 };
    }
  }

  if (strategy === 'HIGHER_LOWER') {
    if (prices.length >= 50) {
      const current = prices[prices.length - 1];
      const sma = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
      const dev = Math.abs(current - sma);
      if (dev > 0.0005) {
        return { signal: current > sma ? 'HIGHER' : 'LOWER', direction: current > sma ? 'HIGHER' : 'LOWER', color: current > sma ? 'text-primary font-black' : 'text-rose-500 font-black', led: current > sma ? 'bg-primary shadow-[0_0_20px_rgba(0,166,166,1)]' : 'bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,1)]', flash: true, timing: 'TREND POS', isHit: true, score: dev * 10000 };
      }
    }
  }

  if (strategy === 'ONLY_UPS_DOWNS') {
    if (prices.length >= 5) {
      const last5 = prices.slice(-5);
      const isUp = last5.every((p, i) => i === 0 || p > last5[i - 1]);
      const isDown = last5.every((p, i) => i === 0 || p < last5[i - 1]);
      if (isUp) return { signal: 'ONLY UPS', direction: 'ONLY UPS', color: 'text-emerald-400 font-black', led: 'bg-emerald-400 shadow-[0_0_20px_rgba(52,211,153,1)]', flash: true, timing: 'VELOCITY UP', isHit: true, score: 95 };
      if (isDown) return { signal: 'ONLY DOWNS', direction: 'ONLY DOWNS', color: 'text-rose-400 font-black', led: 'bg-rose-400 shadow-[0_0_20px_rgba(251,113,133,1)]', flash: true, timing: 'VELOCITY DOWN', isHit: true, score: 95 };
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
}

function MarketEngineCard({ market, data, strategy, isSelected, onSelect, isGolden, expiryTimestamp }: MarketEngineCardProps) {
  const [countdown, setCountdown] = useState(5);
  const [lifeRemaining, setLifeRemaining] = useState(30);
  const prices = data?.prices || [];
  
  const analysis = useMemo(() => getMarketAnalysis(data, strategy), [data, strategy]);
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
        "group relative flex flex-col items-center justify-between p-4 sm:p-5 rounded-[2rem] border-2 transition-all duration-500 min-h-[160px] sm:min-h-[180px] cursor-default overflow-hidden",
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
            {isFlashy ? (countdown > 0 ? `ENTRY NOW (${countdown}s)` : "ACTIVE SIGNAL") : analysis.timing}
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
        <span className={cn(
          "text-[9px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-center px-1 truncate w-full",
          isGolden ? "text-amber-500" : isSelected || isFlashy ? "text-primary" : "text-muted-foreground/40"
        )}>
          {market.name.replace('Index', '').trim()}
        </span>
        
        <div className={cn(
          "flex items-center gap-2 px-3 py-1.5 rounded-xl border mt-1 w-full justify-center transition-all duration-500",
          isGolden ? "bg-amber-400/20 border-amber-400/50" : "bg-black/5 dark:bg-white/5 border-border/10"
        )}>
          <div className={cn(
            "w-2 h-2 rounded-full transition-all duration-300",
            isGolden ? "bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,1)]" : analysis.led,
            (isFlashy || isGolden) && "animate-pulse"
          )} />
          <span className={cn("text-[8px] sm:text-[9px] font-black uppercase tracking-[0.15em]", isGolden ? "text-amber-500" : analysis.color)}>
            {isGolden ? analysis.direction : (isFlashy ? analysis.signal : "SCANNING")}
          </span>
        </div>
      </div>

      <div className="absolute bottom-2 right-2 flex items-center gap-1 z-10 opacity-30">
        <div className={cn("w-1 h-1 rounded-full", prices.length > 0 ? "bg-primary animate-ping" : "bg-muted")} />
        <span className="text-[6px] font-bold uppercase tracking-tighter">Live Link</span>
      </div>
    </div>
  );
}

function SignalScanner({ marketData, strategy, signals, goldenIds, signalRegistry }: { marketData: Record<string, MarketData>, strategy: string, signals: string[], goldenIds: string[], signalRegistry: Record<string, number> }) {
  const sortedSignals = useMemo(() => {
    const goldens = signals.filter(id => goldenIds.includes(id));
    const rest = signals.filter(id => !goldenIds.includes(id));
    return [...goldens, ...rest];
  }, [signals, goldenIds]);

  return (
    <Card className="bg-card border-primary/20 shadow-2xl icy-glow overflow-hidden rounded-[2.5rem]">
      <CardHeader className="py-4 px-6 border-b border-border/40 flex flex-row items-center justify-between bg-muted/20">
        <div className="flex items-center gap-3">
          <Radio className="w-5 h-5 text-primary animate-pulse" />
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-foreground">Live Signal Scanner</h3>
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
              return (
                <MarketEngineCard 
                  key={id}
                  market={market}
                  data={marketData[id]}
                  strategy={strategy}
                  isGolden={goldenIds.includes(id)}
                  expiryTimestamp={signalRegistry[id]}
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

export default function DigitFlowApp() {
  const [strategySelections, setStrategySelections] = useState<Record<string, string>>({
    'OVER_UNDER': '1HZ10V', 'EVEN_ODD': 'R_10', 'MATCHES': '1HZ15V', 'RISE_FALL': 'R_15', 'HIGHER_LOWER': '1HZ25V', 'ONLY_UPS_DOWNS': 'R_25',
  });
  const [activeStrategy, setActiveStrategy] = useState('OVER_UNDER');
  const [tradeSide, setTradeSide] = useState('none');
  const [mounted, setMounted] = useState(false);
  const [activeMainTab, setActiveMainTab] = useState('dashboard');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const [multiSignalRegistry, setMultiSignalRegistry] = useState<Record<string, Record<string, number>>>({
    'OVER_UNDER': {}, 'EVEN_ODD': {}, 'MATCHES': {}, 'RISE_FALL': {}, 'HIGHER_LOWER': {}, 'ONLY_UPS_DOWNS': {},
  });

  const marketIds = useMemo(() => CONTINUOUS_INDICES.map(m => m.id), []);
  const { marketData, status } = useMultiMarketAnalysis(marketIds);

  const currentSymbol = strategySelections[activeStrategy] || 'R_10';
  const { distribution, latestDigit, latestPrice, totalTicks } = useDigitAnalysis(currentSymbol);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const now = Date.now();
    setMultiSignalRegistry(prev => {
      const next = { ...prev };
      const currentRegistry = { ...next[activeStrategy] };
      let changed = false;

      Object.entries(marketData).forEach(([id, data]) => {
        const analysis = getMarketAnalysis(data, activeStrategy);
        if (analysis.isHit) {
          currentRegistry[id] = now;
          changed = true;
        }
      });

      Object.entries(currentRegistry).forEach(([id, timestamp]) => {
        if (now - timestamp > 30000) {
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
      score: getMarketAnalysis(marketData[id], activeStrategy).score 
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map(s => s.id);
  }, [persistentSignalIds, marketData, activeStrategy]);

  const stats = useMemo(() => {
    const sorted = [...distribution].sort((a, b) => b.percentage - a.percentage);
    return { high: sorted[0]?.digit, secondHigh: sorted[1]?.digit, low: sorted[9]?.digit, secondLow: sorted[8]?.digit };
  }, [distribution]);

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

          <TabsContent value="dashboard" className="space-y-6 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
            <Card className="border-none bg-card rounded-3xl shadow-2xl icy-glow overflow-hidden relative">
              <CardContent className="p-4 sm:p-8 lg:p-12 space-y-6 sm:space-y-8">
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-between w-full">
                  <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                    <PopoverTrigger asChild>
                      <div className="w-full sm:w-auto flex items-center gap-3 cursor-pointer group hover:bg-muted/30 p-2 rounded-xl transition-colors border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
                        <BarChart2 className="w-5 h-5 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-[10px] sm:text-[11px] font-bold text-foreground group-hover:text-primary transition-colors truncate">
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
                    <SelectTrigger className="w-full sm:w-28 h-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-none bg-muted/40 focus:ring-0 rounded-lg">
                      <SelectValue placeholder="Focus" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50">
                      <SelectItem value="none" className="text-[9px] font-black uppercase tracking-widest">General</SelectItem>
                      <SelectItem value="over" className="text-[9px] font-black uppercase tracking-widest text-primary">OVER 3</SelectItem>
                      <SelectItem value="under" className="text-[9px] font-black uppercase tracking-widest text-rose-500">UNDER 6</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col items-center justify-center py-4"><div className="text-5xl sm:text-8xl font-black tracking-tighter flex items-baseline tabular-nums text-primary">{latestPrice?.toFixed(2) || "---"}</div></div>
                <div className="grid grid-cols-5 gap-2 sm:gap-8 max-w-4xl mx-auto px-1 sm:px-4">
                  {distribution.map((d) => (
                    <DigitCard key={d.digit} digit={d.digit} percentage={d.percentage} isHigh={d.digit === stats.high} isSecondHigh={d.digit === stats.secondHigh} isLow={d.digit === stats.low} isSecondLow={d.digit === stats.secondLow} isLatest={d.digit === latestDigit} onClick={() => {}} />
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="navigator-ai" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
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
                        expiryTimestamp={currentStrategyRegistry[market.id]} 
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </Tabs>
          </TabsContent>
          
          <TabsContent value="scanner" className="mt-0 outline-none"><Card className="h-[80vh] overflow-hidden rounded-3xl"><iframe src="https://tracktool.netlify.app/signals" className="w-full h-full" /></Card></TabsContent>
          <TabsContent value="digits" className="mt-0 outline-none"><Card className="h-[80vh] overflow-hidden rounded-3xl"><iframe src="https://tracktool.netlify.app/digitshome" className="w-full h-full" /></Card></TabsContent>
          <TabsContent value="percentage" className="mt-0 outline-none"><Card className="h-[80vh] overflow-hidden rounded-3xl"><iframe src="https://api.binarytool.site" className="w-full h-full" /></Card></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
