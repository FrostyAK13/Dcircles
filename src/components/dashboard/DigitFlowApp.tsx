"use client"

import { useState, useMemo, useEffect } from 'react';
import { useDigitAnalysis, HISTORY_BUFFER_SIZE } from '@/hooks/use-digit-analysis';
import { DashboardHeader } from './DashboardHeader';
import { DigitCard } from './DigitCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ChevronDown, ChevronUp, BarChart2, Zap, Database } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export const CONTINUOUS_INDICES = [
  { id: '1HZ10V', name: 'Volatility 10 (1s) Index', short: '10 (1s)' },
  { id: 'R_10', name: 'Volatility 10 Index', short: '10' },
  { id: '1HZ25V', name: 'Volatility 25 (1s) Index', short: '25 (1s)' },
  { id: 'R_25', name: 'Volatility 25 Index', short: '25' },
  { id: '1HZ50V', name: 'Volatility 50 (1s) Index', short: '50 (1s)' },
  { id: 'R_50', name: 'Volatility 50 Index', short: '50' },
  { id: '1HZ75V', name: 'Volatility 75 (1s) Index', short: '75 (1s)' },
  { id: 'R_75', name: 'Volatility 75 Index', short: '75' },
  { id: '1HZ100V', name: 'Volatility 100 (1s) Index', short: '100 (1s)' },
  { id: 'R_100', name: 'Volatility 100 Index', short: '100' },
  { id: 'JD10', name: 'Jump 10 Index', short: 'J10' },
  { id: 'JD25', name: 'Jump 25 Index', short: 'J25' },
  { id: 'JD50', name: 'Jump 50 Index', short: 'J50' },
  { id: 'JD75', name: 'Jump 75 Index', short: 'J75' },
  { id: 'JD100', name: 'Jump 100 Index', short: 'J100' },
];

function LargePriceDisplay({ price }: { price: number | null }) {
  if (price === null) return null;
  
  const priceStr = price.toFixed(2);

  return (
    <div className="flex flex-col items-center justify-center py-2">
      <div className="text-4xl sm:text-6xl font-bold tracking-tighter flex items-baseline tabular-nums text-primary">
        <span className="opacity-90">{priceStr}</span>
      </div>
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
    <Card className="border-border/50 bg-card shadow-md overflow-hidden transition-all hover:shadow-lg">
      <CardHeader className="pb-4 border-b border-black/5 bg-secondary/30">
        <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        {showDigitSelector && (
          <div className="space-y-3">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold block">Selection Mode</span>
            <div className="flex flex-wrap gap-1.5 justify-center bg-secondary/50 p-3 rounded-2xl">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => onDigitSelect?.(num)}
                  className={cn(
                    "w-9 h-9 rounded-xl text-sm font-bold transition-all flex items-center justify-center",
                    selectedDigit === num 
                      ? "bg-primary text-primary-foreground shadow-lg scale-110" 
                      : "bg-background text-muted-foreground hover:bg-primary/10 border border-border/50"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-around items-center text-center py-4">
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-tighter text-muted-foreground font-bold">{label1}</span>
            <div className="text-4xl font-black text-primary tabular-nums">{count1}</div>
          </div>
          <div className="h-16 w-px bg-border" />
          <div className="space-y-2">
            <span className="text-xs uppercase tracking-tighter text-muted-foreground font-bold">{label2}</span>
            <div className="text-4xl font-black text-accent tabular-nums">{count2}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold block">Recent History Pattern</span>
            <button 
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-1 hover:opacity-70 transition-opacity"
            >
              {isExpanded ? (
                <>Less <ChevronUp className="w-3 h-3" /></>
              ) : (
                <>More <ChevronDown className="w-3 h-3" /></>
              )}
            </button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center p-4 bg-secondary/20 rounded-2xl min-h-[4.5rem] transition-all duration-300">
            {displayedPattern.map((p, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-all duration-300 animate-in fade-in zoom-in-95",
                  p.color
                )}
              >
                {p.label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-5">
          <span className="text-xs uppercase tracking-widest text-muted-foreground font-bold block">Statistical Probability</span>
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest px-1">
                <span className="text-primary">{label1}</span>
                <span className="text-primary">{val1}%</span>
              </div>
              <div className="h-8 w-full bg-secondary rounded-full overflow-hidden p-1">
                <div 
                  className="h-full bg-primary rounded-full transition-all duration-700 ease-out shadow-sm" 
                  style={{ width: `${val1}%` }} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest px-1">
                <span className="text-accent">{label2}</span>
                <span className="text-accent">{val2}%</span>
              </div>
              <div className="h-8 w-full bg-secondary rounded-full overflow-hidden p-1">
                <div 
                  className="h-full bg-accent rounded-full transition-all duration-700 ease-out shadow-sm" 
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

export default function DigitFlowApp() {
  const [symbol, setSymbol] = useState('R_100');
  const [ouDigit, setOuDigit] = useState(4);
  const [mdDigit, setMdDigit] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

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
        color: d % 2 === 0 ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
      })),
      ou: lastTicks.map(d => ({
        label: d > ouDigit ? 'O' : d < ouDigit ? 'U' : d.toString(),
        color: d === ouDigit ? 'bg-muted text-muted-foreground' : (d > ouDigit ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white')
      })),
      rf: lastPrices.slice(1).map((p, i) => ({
        label: p > lastPrices[i] ? 'R' : 'F',
        color: p > lastPrices[i] ? 'bg-primary text-primary-foreground' : 'bg-rose-500 text-white'
      })),
      md: lastTicks.map(d => ({
        label: d === mdDigit ? 'M' : 'D',
        color: d === mdDigit ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'
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
        {/* Background Watermark */}
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.03] select-none">
          <span className="text-[15vw] font-black tracking-tighter uppercase -rotate-12 whitespace-nowrap">
            FROSTYTOOLS
          </span>
        </div>

        <DashboardHeader status={status} />
        
        <main className="relative z-10 flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-12 overflow-y-auto">
          <Card className="border-none bg-transparent shadow-none">
            <CardContent className="px-0 pt-0">
              <div className="bg-card rounded-[2.5rem] p-6 sm:p-10 space-y-8 shadow-xl border border-border/50 relative overflow-hidden">
                {/* Market Selector & Dynamic UI */}
                {mounted && (
                  <div className="absolute top-6 left-6 z-30">
                    <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                      <PopoverTrigger asChild>
                        <div className="flex items-center gap-3 cursor-pointer group hover:bg-white/5 p-2 rounded-lg transition-colors border border-white/5 bg-secondary/20 backdrop-blur-sm shadow-sm">
                          <div className="relative">
                            <BarChart2 className="w-5 h-5 text-accent" />
                            <div className="absolute -top-1.5 -right-1.5 bg-secondary text-[7px] font-bold px-1 rounded border border-white/10">
                              {currentMarket.short}
                            </div>
                          </div>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-1">
                              <span className="text-[11px] font-bold text-foreground group-hover:text-primary transition-colors">
                                {currentMarket.name}
                              </span>
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-transform group-data-[state=open]:rotate-180" />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                                <Database className="w-2.5 h-2.5" />
                                {totalTicks} Ticks
                              </span>
                            </div>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0 bg-card border-white/10 shadow-2xl backdrop-blur-2xl" align="start">
                        <div className="p-2 border-b border-white/5">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2">Continuous Indices</span>
                        </div>
                        <div className="max-h-[60vh] overflow-y-auto p-1">
                          {CONTINUOUS_INDICES.map((market) => (
                            <button
                              key={market.id}
                              onClick={() => {
                                setSymbol(market.id);
                                setIsPopoverOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-colors",
                                symbol === market.id ? "bg-primary/20 text-primary" : "hover:bg-white/5 text-foreground"
                              )}
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center font-bold text-[10px]">
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
                  </div>
                )}

                <LargePriceDisplay price={latestPrice} />
                
                <div className="space-y-6 relative pt-4">
                  <div className="flex flex-col items-center gap-3 mb-8">
                    {/* Tick Config Input */}
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/50 border border-black/5 shadow-inner">
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Analyze:</span>
                      <Input 
                        type="number"
                        value={windowSize}
                        onChange={(e) => handleWindowSizeChange(parseInt(e.target.value))}
                        min={5}
                        max={HISTORY_BUFFER_SIZE}
                        className="w-16 h-6 p-0 text-[11px] font-black text-primary bg-transparent border-none text-center focus-visible:ring-0 tabular-nums"
                      />
                      <span className="text-[10px] font-bold text-muted-foreground/60 uppercase">Ticks</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-3 sm:gap-6 max-w-4xl mx-auto relative">
                    {/* Real-time Indicator Arrow */}
                    {mounted && latestDigit !== null && (
                      <div 
                        className="absolute z-20 text-primary transition-all duration-300 ease-in-out pointer-events-none"
                        style={{
                          left: `${(latestDigit % 5) * 20 + 10}%`,
                          top: latestDigit >= 5 ? '55%' : '-1.5rem',
                          transform: 'translateX(-50%)'
                        }}
                      >
                        <ChevronDown className="w-6 h-6 fill-primary animate-bounce" />
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
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <DetailedComparison 
                title="Over / Under Strategy"
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
                title="Even / Odd Strategy"
                label1="Even"
                label2="Odd"
                val1={stats.comparisons.even}
                val2={stats.comparisons.odd}
                count1={stats.counts.even}
                count2={stats.counts.odd}
                pattern={stats.patterns.eo}
              />
              <DetailedComparison 
                title="Matches / Differs Strategy"
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
                title="Rise / Fall Strategy"
                label1="Rise"
                label2="Fall"
                val1={stats.comparisons.rise}
                val2={stats.comparisons.fall}
                count1={stats.counts.rise}
                count2={stats.counts.fall}
                pattern={stats.patterns.rf}
              />
            </div>
          </div>

          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] pt-8 pb-4 border-t border-black/5">
            <span>&copy; {mounted ? new Date().getFullYear() : '2025'} FROSTYDBOT</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live Feed Active
              </span>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
