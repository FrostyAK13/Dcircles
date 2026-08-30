
"use client"

import { useState, useMemo, useEffect } from 'react';
import { useDigitAnalysis, HISTORY_BUFFER_SIZE } from '@/hooks/use-digit-analysis';
import { DashboardHeader } from './DashboardHeader';
import { DigitCard } from './DigitCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SidebarProvider } from '@/components/ui/sidebar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, BarChart2, Zap, Database, ExternalLink, LayoutGrid, Percent, Activity, Target, CheckCircle2, Loader2, BrainCircuit, TrendingUp, Hash, ArrowUpDown, Layers } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from '@/components/ui/button';

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

function LargePriceDisplay({ 
  price, 
  engineResult, 
  side, 
  latestDigit,
  hoveredDigit
}: { 
  price: number | null, 
  engineResult: any, 
  side: string, 
  latestDigit: number | null,
  hoveredDigit: number | null
}) {
  if (price === null) return null;
  
  const priceStr = price.toFixed(2);
  const signalDigit = side === 'over' ? engineResult?.overSignal : engineResult?.underSignal;
  const isMatch = latestDigit === signalDigit && signalDigit !== '!';
  const isHoveredMatch = hoveredDigit === signalDigit && signalDigit !== '!';

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-4">
      <div className="text-5xl sm:text-8xl font-black tracking-tighter flex items-baseline tabular-nums text-foreground">
        <span className="drop-shadow-[0_0_15px_rgba(0,166,166,0.3)]">{priceStr}</span>
      </div>

      {side !== 'none' && engineResult && (
        <div className={cn(
          "flex flex-col items-center justify-center p-4 sm:p-6 rounded-3xl border transition-all duration-300 icy-glow animate-in zoom-in-95 w-full max-w-[200px]",
          (isMatch || isHoveredMatch) 
            ? "bg-primary/20 border-primary/50 shadow-[0_0_20px_rgba(0,166,166,0.4)]" 
            : "bg-primary/10 border-primary/20"
        )}>
          <div className="flex items-center gap-2 mb-2">
            {isMatch ? (
              <CheckCircle2 className="w-4 h-4 text-primary animate-bounce" />
            ) : (
              <Activity className={cn("w-4 h-4 animate-pulse", isHoveredMatch ? "text-primary" : "text-primary/60")} />
            )}
            <span className={cn(
              "text-[9px] sm:text-[10px] font-black uppercase tracking-widest",
              (isMatch || isHoveredMatch) ? "text-primary" : "text-muted-foreground"
            )}>
              {isMatch ? "Digit Appeared!" : "Engine Signal"}
            </span>
          </div>
          <div className={cn(
            "text-3xl sm:text-4xl font-black flex items-center gap-3",
            (isMatch || isHoveredMatch) ? "text-primary" : "text-primary/70"
          )}>
            <Target className="w-6 h-6 sm:w-8 sm:h-8" />
            <span>{signalDigit}</span>
          </div>
          <div className="mt-1 text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-tighter">
            AVG: {side === 'over' ? engineResult.overAvg : engineResult.underAvg}%
          </div>
        </div>
      )}
    </div>
  );
}

interface DetailedComparisonProps {
  title: string;
  label1: string;
  label2: string;
  val1: number;
  val2: number;
  count1: number;
  count2: number;
  pattern: { label: string; color: string }[];
  showDigitSelector?: boolean;
  selectedDigit?: number;
  onDigitSelect?: (digit: number) => void;
}

function DetailedComparison({ 
  title, label1, label2, val1, val2, count1, count2, pattern,
  showDigitSelector, selectedDigit, onDigitSelect 
}: DetailedComparisonProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const displayedPattern = isExpanded ? pattern : pattern.slice(-10);

  return (
    <Card className="border border-border/50 bg-card text-card-foreground shadow-xl icy-glow overflow-hidden transition-all hover:scale-[1.01]">
      <CardHeader className="p-3 sm:p-4 border-b border-border/40 bg-muted/20">
        <CardTitle className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-primary">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 sm:p-6 space-y-6">
        {showDigitSelector && (
          <div className="space-y-3">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold block text-center">Selection Mode</span>
            <div className="flex flex-wrap gap-1 justify-center bg-muted/40 p-1.5 sm:p-2 rounded-xl">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => onDigitSelect?.(num)}
                  className={cn(
                    "w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-[10px] sm:text-xs font-bold transition-all flex items-center justify-center",
                    selectedDigit === num 
                      ? "bg-primary text-white shadow-[0_0_15px_rgba(0,166,166,0.5)] scale-110" 
                      : "bg-background text-muted-foreground hover:bg-primary/10"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-around items-center text-center py-2">
          <div className="space-y-1">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">{label1}</span>
            <div className="text-2xl sm:text-3xl font-black text-primary tabular-nums">{count1}</div>
          </div>
          <div className="h-10 w-px bg-border/50" />
          <div className="space-y-1">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">{label2}</span>
            <div className="text-2xl sm:text-3xl font-black text-rose-500 tabular-nums">{count2}</div>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold block">Recent History</span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              {isExpanded ? (
                <>Less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>More <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-1 sm:gap-1.5 justify-center p-2 sm:p-3 bg-muted/30 rounded-xl min-h-[3.5rem] transition-all duration-300">
            {displayedPattern.map((p, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-6 h-6 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-[9px] sm:text-[10px] font-black shadow-sm transition-all duration-300 animate-in fade-in zoom-in-95",
                  p.color
                )}
              >
                {p.label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <span className="text-[9px] sm:text-[10px] uppercase tracking-widest text-muted-foreground font-bold block">Probability</span>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1">
                <span className="text-primary">{label1}</span>
                <span className="text-primary">{val1}%</span>
              </div>
              <div className="h-4 sm:h-6 w-full bg-muted/40 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(0,166,166,0.3)]" 
                  style={{ width: `${val1}%` }} 
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] sm:text-[10px] font-bold uppercase tracking-widest px-1">
                <span className="text-rose-500">{label2}</span>
                <span className="text-rose-500">{val2}%</span>
              </div>
              <div className="h-4 sm:h-6 w-full bg-muted/40 rounded-full overflow-hidden p-0.5">
                <div 
                  className="h-full bg-rose-500 rounded-full transition-all duration-700 ease-out shadow-[0_0_10px_rgba(244,63,94,0.3)]" 
                  style={{ width: `${val2}%` }} 
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function MarketCardGrid({ currentSymbol, onSelect }: { currentSymbol: string, onSelect: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6 p-4">
      {CONTINUOUS_INDICES.map((market) => (
        <button
          key={market.id}
          onClick={() => onSelect(market.id)}
          className={cn(
            "group relative flex flex-col items-center justify-center p-6 sm:p-8 rounded-[2rem] border-4 transition-all duration-500",
            currentSymbol === market.id 
              ? "bg-primary/20 border-primary shadow-[0_0_30px_rgba(0,166,166,0.5)] scale-[1.08] z-20" 
              : "bg-muted/20 border-border/30 hover:border-primary/40 hover:bg-muted/40 hover:scale-[1.03]"
          )}
        >
          <div className={cn(
            "w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center font-black text-base sm:text-xl mb-3 sm:mb-4 transition-all duration-500 shadow-lg",
            currentSymbol === market.id 
              ? "bg-primary text-white scale-110 shadow-primary/20" 
              : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
          )}>
            {market.short}
          </div>
          <span className={cn(
            "text-[10px] sm:text-[12px] font-black uppercase tracking-widest text-center line-clamp-2 px-2 transition-colors duration-500",
            currentSymbol === market.id ? "text-primary" : "text-muted-foreground/80"
          )}>
            {market.name.replace(' Index', '')}
          </span>
          {currentSymbol === market.id && (
            <div className="absolute -top-2 -right-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shadow-xl animate-pulse">
                <CheckCircle2 className="w-5 h-5 text-white" />
              </div>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export default function DigitFlowApp() {
  const [symbol, setSymbol] = useState('1HZ10V');
  const [tradeSide, setTradeSide] = useState('none');
  const [ouDigit, setOuDigit] = useState(4);
  const [mdDigit, setMdDigit] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [hoveredDigit, setHoveredDigit] = useState<number | null>(null);
  const [activeMainTab, setActiveMainTab] = useState('dashboard');

  const { 
    distribution, 
    ticks,
    prices,
    latestDigit,
    latestPrice,
    windowSize, 
    setWindowSize, 
    totalTicks, 
    status 
  } = useDigitAnalysis(symbol);

  useEffect(() => {
    setMounted(true);
  }, []);

  const engineResults = useMemo(() => {
    if (distribution.length < 10) return null;
    
    const p0 = distribution.find(d => d.digit === 0)?.percentage || 0;
    const p1 = distribution.find(d => d.digit === 1)?.percentage || 0;
    const p2 = distribution.find(d => d.digit === 2)?.percentage || 0;
    const p9 = distribution.find(d => d.digit === 9)?.percentage || 0;
    const p8 = distribution.find(d => d.digit === 8)?.percentage || 0;
    const p7 = distribution.find(d => d.digit === 7)?.percentage || 0;

    const overAvg = (p0 + p1 + p2) / 3;
    const underAvg = (p9 + p8 + p7) / 3;

    const findClosest = (avg: number, excluded: number[]) => {
      let closestDigit: string | number = '!';
      let minDiff = Infinity;
      
      const candidates = distribution.filter(d => !excluded.includes(d.digit));
      
      if (candidates.length === 0) return '!';

      candidates.forEach(d => {
        const diff = Math.abs(d.percentage - avg);
        if (diff < minDiff) {
          minDiff = diff;
          closestDigit = d.digit;
        }
      });
      return closestDigit;
    };

    return {
      overAvg: overAvg.toFixed(2),
      underAvg: underAvg.toFixed(2),
      overSignal: findClosest(overAvg, [0, 1]),
      underSignal: findClosest(underAvg, [9, 8])
    };
  }, [distribution]);

  const stats = useMemo(() => {
    const sorted = [...distribution].sort((a, b) => b.percentage - a.percentage);
    const windowTicks = ticks.slice(-windowSize);
    const windowPrices = prices.slice(-windowSize);
    
    const evenCount = windowTicks.filter(d => d % 2 === 0).length;
    const overCount = windowTicks.filter(d => d > ouDigit).length;
    const underCount = windowTicks.filter(d => d < ouDigit).length;
    const matchCount = windowTicks.filter(d => d === mdDigit).length;
    
    let riseCount = 0;
    for (let i = 1; i < windowPrices.length; i++) {
      if (windowPrices[i] > windowPrices[i-1]) riseCount++;
    }

    const total = windowTicks.length || 1;
    const totalMovements = Math.max(windowPrices.length - 1, 1);

    const lastTicks = ticks.slice(-25);
    const lastPrices = prices.slice(-26);

    const patterns = {
      eo: lastTicks.map(d => ({
        label: d % 2 === 0 ? 'E' : 'O',
        color: d % 2 === 0 ? 'bg-primary text-primary-foreground' : 'bg-rose-500 text-white'
      })),
      ou: lastTicks.map(d => ({
        label: d > ouDigit ? 'O' : d < ouDigit ? 'U' : d.toString(),
        color: d === ouDigit ? 'bg-muted/40 text-muted-foreground' : (d > ouDigit ? 'bg-primary text-primary-foreground' : 'bg-rose-500 text-white')
      })),
      rf: lastPrices.slice(1).map((p, i) => ({
        label: p > lastPrices[i] ? 'R' : 'F',
        color: p > lastPrices[i] ? 'bg-primary text-primary-foreground' : 'bg-rose-500 text-white'
      })),
      md: lastTicks.map(d => ({
        label: d === mdDigit ? 'M' : 'D',
        color: d === mdDigit ? 'bg-primary text-primary-foreground' : 'bg-rose-500 text-white'
      }))
    };

    return {
      high: sorted[0]?.digit,
      secondHigh: sorted[1]?.digit,
      low: sorted[9]?.digit,
      secondLow: sorted[8]?.digit,
      counts: {
        even: evenCount,
        odd: total - evenCount,
        over: overCount,
        under: underCount,
        rise: riseCount,
        fall: totalMovements - riseCount,
        matches: matchCount,
        differs: total - matchCount,
      },
      comparisons: {
        even: Math.round((evenCount / total) * 100),
        odd: Math.round(((total - evenCount) / total) * 100),
        over: Math.round((overCount / total) * 100),
        under: Math.round((underCount / total) * 100),
        rise: Math.round((riseCount / totalMovements) * 100),
        fall: Math.round(((totalMovements - riseCount) / totalMovements) * 100),
        matches: Math.round((matchCount / total) * 100),
        differs: Math.round(((total - matchCount) / total) * 100),
      },
      patterns
    };
  }, [distribution, ticks, prices, windowSize, ouDigit, mdDigit]);

  const handleWindowSizeChange = (val: number) => {
    if (isNaN(val)) return;
    const safeVal = Math.min(HISTORY_BUFFER_SIZE, Math.max(5, val));
    setWindowSize(safeVal);
  };

  const currentMarket = CONTINUOUS_INDICES.find(m => m.id === symbol) || CONTINUOUS_INDICES[0];

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full bg-background text-foreground relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.05] select-none">
          <span className="text-[15vw] font-black tracking-tighter uppercase -rotate-12 whitespace-nowrap text-primary/30">
            INDEXNAV
          </span>
        </div>

        <DashboardHeader status={status} />
        
        <main className="relative z-10 flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 overflow-y-auto">
          {!mounted ? (
            <div className="w-full h-96 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <p className="text-sm font-black uppercase tracking-[0.3em] text-primary animate-pulse">Initializing Navigator...</p>
            </div>
          ) : (
            <Tabs 
              value={activeMainTab} 
              onValueChange={setActiveMainTab} 
              className="w-full"
            >
              <div className="flex justify-center mb-6 sm:mb-8 sticky top-0 z-40 bg-background/80 backdrop-blur-md py-2 -mx-3 sm:mx-0 px-3">
                <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/50 h-auto flex-nowrap overflow-x-auto justify-start sm:justify-center w-full max-w-fit scrollbar-hide">
                  <TabsTrigger 
                    value="dashboard" 
                    className="rounded-xl px-3 sm:px-6 py-2 font-bold uppercase tracking-widest text-[8px] sm:text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_15px_rgba(0,166,166,0.4)] shrink-0"
                  >
                    <BarChart2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
                    Analysis
                  </TabsTrigger>
                  <TabsTrigger 
                    value="navigator-ai" 
                    className="rounded-xl px-3 sm:px-6 py-2 font-bold uppercase tracking-widest text-[8px] sm:text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_15px_rgba(0,166,166,0.4)] shrink-0"
                  >
                    <BrainCircuit className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
                    Navigator AI
                  </TabsTrigger>
                  <TabsTrigger 
                    value="scanner" 
                    className="rounded-xl px-3 sm:px-6 py-2 font-bold uppercase tracking-widest text-[8px] sm:text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_15px_rgba(0,166,166,0.4)] shrink-0"
                  >
                    <ExternalLink className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
                    Scanner
                  </TabsTrigger>
                  <TabsTrigger 
                    value="digits" 
                    className="rounded-xl px-3 sm:px-6 py-2 font-bold uppercase tracking-widest text-[8px] sm:text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_15px_rgba(0,166,166,0.4)] shrink-0"
                  >
                    <LayoutGrid className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
                    Digits
                  </TabsTrigger>
                  <TabsTrigger 
                    value="percentage" 
                    className="rounded-xl px-3 sm:px-6 py-2 font-bold uppercase tracking-widest text-[8px] sm:text-[10px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-[0_0_15px_rgba(0,166,166,0.4)] shrink-0"
                  >
                    <Percent className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
                    %
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="dashboard" className="space-y-6 sm:space-y-8 mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                <Card className="border-none bg-card rounded-3xl shadow-2xl icy-glow overflow-hidden relative">
                  <CardContent className="p-4 sm:p-8 lg:p-12 space-y-6 sm:space-y-8">
                    <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-between w-full">
                      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                        <PopoverTrigger asChild>
                          <div className="w-full sm:w-auto flex items-center gap-3 cursor-pointer group hover:bg-muted/30 p-2 rounded-xl transition-colors border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
                            <div className="relative shrink-0">
                              <BarChart2 className="w-5 h-5 text-primary" />
                              <div className="absolute -top-1.5 -right-1.5 bg-primary text-[7px] font-bold px-1 rounded text-primary-foreground">
                                {currentMarket.short}
                              </div>
                            </div>
                            <div className="flex flex-col min-0">
                              <div className="flex items-center gap-1">
                                <span className="text-[10px] sm:text-[11px] font-bold text-foreground group-hover:text-primary transition-colors truncate">
                                  {currentMarket.name}
                                </span>
                                <ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-transform group-data-[state=open]:rotate-180" />
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                  <Database className="w-2.5 h-2.5" />
                                  {totalTicks} Ticks
                                </span>
                              </div>
                            </div>
                          </div>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 p-0 bg-card border-border/50 shadow-2xl backdrop-blur-2xl text-card-foreground" align="start">
                          <div className="p-3 border-b border-border/40">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2">Continuous Indices</span>
                          </div>
                          <div className="max-h-[50vh] overflow-y-auto p-1">
                            {CONTINUOUS_INDICES.map((market) => (
                              <button
                                key={market.id}
                                onClick={() => {
                                  setSymbol(market.id);
                                  setIsPopoverOpen(false);
                                }}
                                className={cn(
                                  "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors",
                                  symbol === market.id ? "bg-primary/10 text-primary" : "hover:bg-muted/40 text-foreground"
                                )}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded bg-muted/40 flex items-center justify-center font-bold text-[10px]">
                                    {market.short}
                                  </div>
                                  <span className="text-xs font-semibold">{market.name}</span>
                                </div>
                                {symbol === market.id && <Zap className="w-3.5 h-3.5 fill-primary text-primary" />}
                              </button>
                            ))}
                          </div>
                        </PopoverContent>
                      </Popover>

                      <div className="w-full sm:w-auto flex items-center gap-3 p-2 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Side:</span>
                        <Select value={tradeSide} onValueChange={setTradeSide}>
                          <SelectTrigger className="flex-1 sm:w-28 h-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-none bg-muted/40 focus:ring-0 rounded-lg">
                            <SelectValue placeholder="Trade Side" />
                          </SelectTrigger>
                          <SelectContent className="bg-card border-border/50">
                            <SelectItem value="none" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">None</SelectItem>
                            <SelectItem value="over" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary">Over</SelectItem>
                            <SelectItem value="under" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-rose-500">Under</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <LargePriceDisplay 
                      price={latestPrice} 
                      engineResult={engineResults} 
                      side={tradeSide} 
                      latestDigit={latestDigit}
                      hoveredDigit={hoveredDigit}
                    />
                    
                    <div className="space-y-6 sm:space-y-8 relative">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-muted/30 border border-border/40 shadow-inner">
                          <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Window</span>
                          <Input 
                            type="number"
                            value={windowSize}
                            onChange={(e) => handleWindowSizeChange(parseInt(e.target.value))}
                            min={5}
                            max={HISTORY_BUFFER_SIZE}
                            className="w-16 sm:w-20 h-6 sm:h-7 p-0 text-xs sm:text-sm font-black text-primary bg-transparent border-none text-center focus-visible:ring-0 tabular-nums"
                          />
                          <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground/60 uppercase tracking-widest">Ticks</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-5 gap-2 sm:gap-8 max-w-4xl mx-auto relative px-1 sm:px-4">
                        {latestDigit !== null && (
                          <div 
                            className="absolute z-20 text-primary transition-all duration-300 ease-in-out pointer-events-none"
                            style={{
                              left: `${(latestDigit % 5) * 20 + 10}%`,
                              top: latestDigit >= 5 ? '55%' : '-1.5rem',
                              transform: 'translateX(-50%)'
                            }}
                          >
                            <ChevronDown className={cn("w-6 h-6 sm:w-8 h-8 fill-primary animate-bounce", latestDigit >= 5 && "rotate-180")} />
                          </div>
                        )}

                        {distribution.map((d) => (
                          <DigitCard
                            key={d.digit}
                            digit={d.digit}
                            percentage={d.percentage}
                            isHigh={d.digit === stats.high}
                            isSecondHigh={d.digit === stats.secondHigh}
                            isLow={d.digit === stats.low}
                            isSecondLow={d.digit === stats.secondLow}
                            isLatest={d.digit === latestDigit}
                            onClick={() => {}}
                            onMouseEnter={() => setHoveredDigit(d.digit)}
                            onMouseLeave={() => setHoveredDigit(null)}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                  <DetailedComparison 
                    title="Over / Under Analysis"
                    label1="Over"
                    label2="Under"
                    val1={stats.comparisons.over}
                    val2={stats.comparisons.under}
                    count1={stats.counts.over}
                    count2={stats.counts.under}
                    pattern={stats.patterns.ou}
                    showDigitSelector
                    selectedDigit={ouDigit}
                    onDigitSelect={setOuDigit}
                  />
                  <DetailedComparison 
                    title="Even / Odd Analysis"
                    label1="Even"
                    label2="Odd"
                    val1={stats.comparisons.even}
                    val2={stats.comparisons.odd}
                    count1={stats.counts.even}
                    count2={stats.counts.odd}
                    pattern={stats.patterns.eo}
                  />
                  <DetailedComparison 
                    title="Matches / Differs"
                    label1="Matches"
                    label2="Differs"
                    val1={stats.comparisons.matches}
                    val2={stats.comparisons.differs}
                    count1={stats.counts.matches}
                    count2={stats.counts.differs}
                    pattern={stats.patterns.md}
                    showDigitSelector
                    selectedDigit={mdDigit}
                    onDigitSelect={setMdDigit}
                  />
                  <DetailedComparison 
                    title="Rise / Fall Trend"
                    label1="Rise"
                    label2="Fall"
                    val1={stats.comparisons.rise}
                    val2={stats.comparisons.fall}
                    count1={stats.counts.rise}
                    count2={stats.counts.fall}
                    pattern={stats.patterns.rf}
                  />
                </div>
              </TabsContent>

              <TabsContent value="navigator-ai" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                <Card className="border border-border/50 bg-card rounded-3xl shadow-2xl icy-glow overflow-hidden min-h-[70vh] flex flex-col">
                  <Tabs defaultValue="OVER_UNDER" className="w-full h-full flex flex-col">
                    <CardHeader className="border-b border-border/40 bg-muted/20 p-2 sm:p-4 shrink-0">
                      <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/50 h-auto flex-nowrap overflow-x-auto justify-start w-full scrollbar-hide gap-1">
                        {[
                          { id: 'OVER_UNDER', label: 'Over/Under', icon: ArrowUpDown },
                          { id: 'EVEN_ODD', label: 'Even/Odd', icon: Hash },
                          { id: 'MATCHES', label: 'Matches', icon: Target },
                          { id: 'RISE_FALL', label: 'Rise/Fall', icon: TrendingUp },
                          { id: 'HIGHER_LOWER', label: 'Higher/Lower', icon: Layers },
                          { id: 'ONLY_UPS_DOWNS', label: 'Only Ups/Downs', icon: Zap },
                        ].map((tab) => (
                          <TabsTrigger 
                            key={tab.id}
                            value={tab.id} 
                            className="rounded-xl px-2 sm:px-4 py-1.5 font-bold uppercase tracking-widest text-[7px] sm:text-[9px] data-[state=active]:bg-primary data-[state=active]:text-primary-foreground shrink-0 flex items-center gap-1.5"
                          >
                            <tab.icon className="w-3 h-3" />
                            {tab.label}
                          </TabsTrigger>
                        ))}
                      </TabsList>
                    </CardHeader>
                    
                    <div className="flex-1 overflow-y-auto">
                      {[
                        'OVER_UNDER', 'EVEN_ODD', 'MATCHES', 'RISE_FALL', 'HIGHER_LOWER', 'ONLY_UPS_DOWNS'
                      ].map((tabId) => (
                        <TabsContent key={tabId} value={tabId} className="mt-0 outline-none">
                          <div className="p-4 sm:p-8 space-y-8">
                            <div className="flex flex-col gap-4">
                              <div className="flex items-center justify-between px-4 border-l-4 border-primary bg-primary/5 py-3 rounded-r-2xl">
                                <h3 className="text-sm sm:text-base font-black uppercase tracking-[0.2em] text-primary">Strategic Markets for {tabId.replace('_', ' ')}</h3>
                                <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Select an active index</div>
                              </div>
                              <MarketCardGrid currentSymbol={symbol} onSelect={setSymbol} />
                            </div>
                          </div>
                        </TabsContent>
                      ))}
                    </div>
                  </Tabs>
                </Card>
              </TabsContent>

              <TabsContent value="scanner" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                <Card className="border border-border/50 bg-card rounded-3xl shadow-2xl icy-glow overflow-hidden h-[80vh] flex flex-col">
                  <CardHeader className="border-b border-border/40 bg-muted/20 py-3 sm:py-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                        <BarChart2 className="w-3.5 h-3.5 sm:w-4 h-4" />
                        Live Market Scanner
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest hidden xs:inline">Real-time Stream</span>
                      </div>
                    </div>
                  </CardHeader>
                  <div className="flex-1 bg-black/5 dark:bg-white/5 relative">
                    <iframe 
                      src="https://tracktool.netlify.app/signals" 
                      className="absolute inset-0 w-full h-full border-none"
                      title="Market Scanner"
                    />
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="digits" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                <Card className="border border-border/50 bg-card rounded-3xl shadow-2xl icy-glow overflow-hidden h-[80vh] flex flex-col">
                  <CardHeader className="border-b border-border/40 bg-muted/20 py-3 sm:py-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                        <LayoutGrid className="w-3.5 h-3.5 sm:w-4 h-4" />
                        Advanced Digits
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest hidden xs:inline">Active</span>
                      </div>
                    </div>
                  </CardHeader>
                  <div className="flex-1 bg-black/5 dark:bg-white/5 relative">
                    <iframe 
                      src="https://tracktool.netlify.app/digitshome" 
                      className="absolute inset-0 w-full h-full border-none"
                      title="Digits View"
                    />
                  </div>
                </Card>
              </TabsContent>

              <TabsContent value="percentage" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
                <Card className="border border-border/50 bg-card rounded-3xl shadow-2xl icy-glow overflow-hidden h-[80vh] flex flex-col">
                  <CardHeader className="border-b border-border/40 bg-muted/20 py-3 sm:py-4 px-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                        <Percent className="w-3.5 h-3.5 sm:w-4 h-4" />
                        Percentage Analysis
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-primary animate-pulse" />
                        <span className="text-[8px] sm:text-[9px] font-bold text-muted-foreground uppercase tracking-widest hidden xs:inline">Live Data</span>
                      </div>
                    </div>
                  </CardHeader>
                  <div className="flex-1 bg-black/5 dark:bg-white/5 relative">
                    <iframe 
                      src="https://api.binarytool.site" 
                      className="absolute inset-0 w-full h-full border-none"
                      title="Percentage Tool"
                    />
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
}
