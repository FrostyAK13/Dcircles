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
import { ChevronDown, BarChart2, Zap, Database, ExternalLink, LayoutGrid, Percent, Activity, Target, CheckCircle2, Loader2, TrendingUp, TrendingDown, Hash, ArrowUpDown, Layers, ShieldAlert, ZapOff, Circle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

function StrategySignal({ 
  strategy, 
  distribution, 
  isActive 
}: { 
  strategy: string, 
  distribution: any[], 
  isActive: boolean 
}) {
  if (!isActive || distribution.length === 0) {
    return (
      <div className="flex items-center gap-1 mt-1 text-[7px] font-bold text-muted-foreground/30 uppercase tracking-widest">
        <Circle className="w-1.5 h-1.5 fill-muted-foreground/20 text-transparent" />
        Standby
      </div>
    );
  }

  let signal = "Wait";
  let color = "text-muted-foreground/60";
  let ledColor = "bg-muted-foreground/40";

  switch (strategy) {
    case 'OVER_UNDER':
      const over5 = distribution.filter(d => d.digit > 5).reduce((acc, d) => acc + d.percentage, 0);
      const under4 = distribution.filter(d => d.digit < 4).reduce((acc, d) => acc + d.percentage, 0);
      if (over5 > under4 + 3) {
        signal = "OVER";
        color = "text-primary font-black";
        ledColor = "bg-primary animate-pulse shadow-[0_0_8px_rgba(0,166,166,0.6)]";
      } else if (under4 > over5 + 3) {
        signal = "UNDER";
        color = "text-rose-500 font-black";
        ledColor = "bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]";
      }
      break;
    case 'EVEN_ODD':
      const evens = distribution.filter(d => d.digit % 2 === 0).reduce((acc, d) => acc + d.percentage, 0);
      const odds = 100 - evens;
      if (Math.abs(evens - odds) > 4) {
        signal = evens > odds ? "EVEN" : "ODD";
        color = evens > odds ? "text-primary font-black" : "text-rose-500 font-black";
        ledColor = evens > odds ? "bg-primary animate-pulse" : "bg-rose-500 animate-pulse";
      }
      break;
    case 'MATCHES':
      const sorted = [...distribution].sort((a, b) => b.percentage - a.percentage);
      if (sorted[0].percentage > 12) {
        signal = `HOT ${sorted[0].digit}`;
        color = "text-[#d6b36a] font-black";
        ledColor = "bg-[#d6b36a] animate-pulse shadow-[0_0_8px_rgba(214,179,106,0.6)]";
      }
      break;
    default:
      signal = "ACTIVE";
      color = "text-primary font-black";
      ledColor = "bg-primary animate-pulse";
  }

  return (
    <div className={cn("flex items-center gap-2 mt-2 px-3 py-1 rounded-full bg-black/5 dark:bg-white/5 border border-border/20", color)}>
      <div className={cn("w-2 h-2 rounded-full", ledColor)} />
      <span className="text-[9px] uppercase tracking-[0.2em]">{signal}</span>
    </div>
  );
}

function MarketCardGrid({ 
  currentSymbol, 
  onSelect, 
  activeTrend,
  strategy,
  distribution
}: { 
  currentSymbol: string, 
  onSelect: (id: string) => void,
  activeTrend: 'up' | 'down' | 'neutral',
  strategy: string,
  distribution: any[]
}) {
  const getStrategyIcon = (type: string) => {
    switch(type) {
      case 'OVER_UNDER': return ArrowUpDown;
      case 'EVEN_ODD': return Hash;
      case 'MATCHES': return Target;
      case 'RISE_FALL': return TrendingUp;
      case 'HIGHER_LOWER': return Layers;
      case 'ONLY_UPS_DOWNS': return Zap;
      default: return Activity;
    }
  };

  const StrategyIcon = getStrategyIcon(strategy);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 max-w-7xl mx-auto">
      {CONTINUOUS_INDICES.map((market) => {
        const isActive = currentSymbol === market.id;
        
        return (
          <div
            key={market.id}
            onClick={() => onSelect(market.id)}
            className={cn(
              "group relative flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 transition-all duration-500 min-h-[160px] cursor-default",
              isActive 
                ? "bg-card border-primary shadow-[0_0_40px_rgba(0,166,166,0.15)] scale-[1.02] z-20" 
                : "bg-muted/5 border-border/20 hover:border-border/40 hover:bg-muted/10"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center mb-3 transition-all duration-500 shadow-inner relative overflow-hidden",
              isActive 
                ? "bg-primary text-white" 
                : "bg-muted/50 text-muted-foreground/40"
            )}>
              <StrategyIcon className={cn("w-6 h-6 relative z-10", isActive && "animate-pulse")} />
            </div>
            
            <div className="flex flex-col items-center gap-1">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-[0.2em] text-center px-4",
                isActive ? "text-primary" : "text-muted-foreground/40"
              )}>
                {market.name}
              </span>
              
              <div className="flex flex-col items-center gap-1 mt-2">
                {isActive && (
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border flex items-center gap-2 mb-1",
                    activeTrend === 'up' ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : activeTrend === 'down' ? "bg-rose-500/10 border-rose-500/20 text-rose-500" : "bg-primary/10 border-primary/20 text-primary"
                  )}>
                    {activeTrend === 'up' ? 'Bullish Trend' : activeTrend === 'down' ? 'Bearish Trend' : 'Market Stable'}
                  </div>
                )}

                <StrategySignal strategy={strategy} distribution={distribution} isActive={isActive} />
              </div>
            </div>

            {isActive && (
              <div className="absolute top-4 right-4">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-ping" />
                  <span className="text-[7px] font-black uppercase tracking-widest text-primary/60">Live Engine</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function DigitFlowApp() {
  const [strategySelections, setStrategySelections] = useState<Record<string, string>>({
    'OVER_UNDER': '1HZ10V',
    'EVEN_ODD': 'R_10',
    'MATCHES': '1HZ15V',
    'RISE_FALL': 'R_15',
    'HIGHER_LOWER': '1HZ25V',
    'ONLY_UPS_DOWNS': 'R_25',
  });
  const [activeStrategy, setActiveStrategy] = useState('OVER_UNDER');
  const [tradeSide, setTradeSide] = useState('none');
  const [ouDigit, setOuDigit] = useState(4);
  const [mdDigit, setMdDigit] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [hoveredDigit, setHoveredDigit] = useState<number | null>(null);
  const [activeMainTab, setActiveMainTab] = useState('dashboard');

  const currentSymbol = strategySelections[activeStrategy];

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
  } = useDigitAnalysis(currentSymbol);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeTrend = useMemo(() => {
    if (prices.length < 10) return 'neutral';
    const last = prices[prices.length - 1];
    const prev = prices[prices.length - 10];
    if (last > prev) return 'up';
    if (last < prev) return 'down';
    return 'neutral';
  }, [prices]);

  const stats = useMemo(() => {
    const sorted = [...distribution].sort((a, b) => b.percentage - a.percentage);
    const windowTicks = ticks.slice(-windowSize);
    const evenCount = windowTicks.filter(d => d % 2 === 0).length;
    const overCount = windowTicks.filter(d => d > ouDigit).length;
    const underCount = windowTicks.filter(d => d < ouDigit).length;
    const total = windowTicks.length || 1;

    const lastTicks = ticks.slice(-25);

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
      },
      comparisons: {
        even: Math.round((evenCount / total) * 100),
        odd: Math.round(((total - evenCount) / total) * 100),
        over: Math.round((overCount / total) * 100),
        under: Math.round((underCount / total) * 100),
      },
      patterns: {
        eo: lastTicks.map(d => ({
          label: d % 2 === 0 ? 'E' : 'O',
          color: d % 2 === 0 ? 'bg-primary text-white' : 'bg-rose-500 text-white'
        }))
      }
    };
  }, [distribution, ticks, windowSize, ouDigit]);

  const handleMarketSelect = (marketId: string) => {
    setStrategySelections(prev => ({
      ...prev,
      [activeStrategy]: marketId
    }));
  };

  const currentMarket = CONTINUOUS_INDICES.find(m => m.id === currentSymbol) || CONTINUOUS_INDICES[0];

  if (!mounted) return null;

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full bg-background text-foreground relative overflow-hidden">
        <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 opacity-[0.03] select-none">
          <span className="text-[15vw] font-black tracking-tighter uppercase -rotate-12 whitespace-nowrap text-primary/30">
            INDEXNAV
          </span>
        </div>

        <DashboardHeader status={status} />
        
        <main className="relative z-10 flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full space-y-6 sm:space-y-8 overflow-y-auto">
          <Tabs value={activeMainTab} onValueChange={setActiveMainTab} className="w-full">
            <div className="flex justify-center mb-6 sm:mb-8 sticky top-0 z-40 bg-background/80 backdrop-blur-md py-2 px-3">
              <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/50 h-auto flex-nowrap overflow-x-auto justify-start sm:justify-center w-full max-w-fit scrollbar-hide">
                {[
                  { value: 'dashboard', label: 'Analysis', icon: BarChart2 },
                  { value: 'navigator-ai', label: 'Navigator Engine', icon: ArrowUpDown },
                  { value: 'scanner', label: 'Scanner', icon: ExternalLink },
                  { value: 'digits', label: 'Digits', icon: LayoutGrid },
                  { value: 'percentage', label: 'Percentage', icon: Percent },
                ].map((tab) => (
                  <TabsTrigger 
                    key={tab.value}
                    value={tab.value} 
                    className="rounded-xl px-3 sm:px-6 py-2 font-bold uppercase tracking-widest text-[8px] sm:text-[10px] data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-[0_0_15px_rgba(0,166,166,0.4)] shrink-0"
                  >
                    <tab.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 mr-1.5 sm:mr-2" />
                    {tab.label}
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
                              {currentMarket.name}
                            </span>
                            <span className="text-[9px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                              <Database className="w-2.5 h-2.5" />
                              {totalTicks} Ticks
                            </span>
                          </div>
                        </div>
                      </PopoverTrigger>
                      <PopoverContent className="w-72 p-0 bg-card border-border/50 shadow-2xl backdrop-blur-2xl text-card-foreground" align="start">
                        <div className="p-3 border-b border-border/40">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60 px-2">Market Selector</span>
                        </div>
                        <div className="max-h-[50vh] overflow-y-auto p-1">
                          {CONTINUOUS_INDICES.map((market) => (
                            <button
                              key={market.id}
                              onClick={() => {
                                handleMarketSelect(market.id);
                                setIsPopoverOpen(false);
                              }}
                              className={cn(
                                "w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition-colors",
                                currentSymbol === market.id ? "bg-primary/10 text-primary" : "hover:bg-muted/40 text-foreground"
                              )}
                            >
                              <span className="text-xs font-semibold">{market.name}</span>
                              {currentSymbol === market.id && <Zap className="w-3.5 h-3.5 fill-[#d6b36a] text-[#d6b36a]" />}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <div className="w-full sm:w-auto flex items-center gap-3 p-2 rounded-xl border border-border/50 bg-background/50 backdrop-blur-sm shadow-sm">
                      <Select value={tradeSide} onValueChange={setTradeSide}>
                        <SelectTrigger className="flex-1 sm:w-28 h-8 text-[9px] sm:text-[10px] font-black uppercase tracking-widest border-none bg-muted/40 focus:ring-0 rounded-lg">
                          <SelectValue placeholder="Trade Focus" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border/50">
                          <SelectItem value="none" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">General</SelectItem>
                          <SelectItem value="over" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-primary">Bullish Focus</SelectItem>
                          <SelectItem value="under" className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-rose-500">Bearish Focus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-6 py-4">
                    <div className="text-5xl sm:text-8xl font-black tracking-tighter flex items-baseline tabular-nums text-primary">
                      {latestPrice?.toFixed(2) || "---"}
                    </div>
                  </div>

                  <div className="grid grid-cols-5 gap-2 sm:gap-8 max-w-4xl mx-auto px-1 sm:px-4">
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
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="navigator-ai" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
              <Card className="border border-border/50 bg-card rounded-[2.5rem] shadow-2xl icy-glow overflow-hidden min-h-[70vh] flex flex-col">
                <Tabs value={activeStrategy} onValueChange={setActiveStrategy} className="w-full h-full flex flex-col">
                  <CardHeader className="border-b border-border/40 bg-muted/20 p-2 sm:p-4 shrink-0">
                    <TabsList className="bg-muted/40 p-1 rounded-2xl border border-border/50 h-auto flex-nowrap overflow-x-auto justify-start w-full scrollbar-hide gap-1">
                      {[
                        { id: 'OVER_UNDER', label: 'Over 5 / Under 4', icon: ArrowUpDown },
                        { id: 'EVEN_ODD', label: 'Even / Odd', icon: Hash },
                        { id: 'MATCHES', label: 'Matches', icon: Target },
                        { id: 'RISE_FALL', label: 'Rise / Fall', icon: TrendingUp },
                        { id: 'HIGHER_LOWER', label: 'Higher / Lower', icon: Layers },
                        { id: 'ONLY_UPS_DOWNS', label: 'Only Ups / Downs', icon: Zap },
                      ].map((tab) => (
                        <TabsTrigger 
                          key={tab.id}
                          value={tab.id} 
                          className="rounded-xl px-2 sm:px-4 py-1.5 font-bold uppercase tracking-widest text-[7px] sm:text-[9px] data-[state=active]:bg-primary data-[state=active]:text-white shrink-0 flex items-center gap-1.5"
                        >
                          <tab.icon className="w-3 h-3" />
                          {tab.label}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                  </CardHeader>
                  
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/5">
                    {['OVER_UNDER', 'EVEN_ODD', 'MATCHES', 'RISE_FALL', 'HIGHER_LOWER', 'ONLY_UPS_DOWNS'].map((tabId) => (
                      <TabsContent key={tabId} value={tabId} className="mt-0 outline-none">
                        <MarketCardGrid 
                          currentSymbol={strategySelections[tabId]} 
                          onSelect={handleMarketSelect} 
                          activeTrend={activeTrend}
                          strategy={tabId}
                          distribution={distribution}
                        />
                      </TabsContent>
                    ))}
                  </div>
                </Tabs>
              </Card>
            </TabsContent>

            <TabsContent value="scanner" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
              <Card className="border border-border/50 bg-card rounded-3xl shadow-2xl icy-glow overflow-hidden h-[80vh] flex flex-col">
                <iframe src="https://tracktool.netlify.app/signals" className="w-full h-full border-none" title="Scanner" />
              </Card>
            </TabsContent>

            <TabsContent value="digits" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
              <Card className="border border-border/50 bg-card rounded-3xl shadow-2xl icy-glow overflow-hidden h-[80vh] flex flex-col">
                <iframe src="https://tracktool.netlify.app/digitshome" className="w-full h-full border-none" title="Digits" />
              </Card>
            </TabsContent>

            <TabsContent value="percentage" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-500 outline-none">
              <Card className="border border-border/50 bg-card rounded-3xl shadow-2xl icy-glow overflow-hidden h-[80vh] flex flex-col">
                <iframe src="https://api.binarytool.site" className="w-full h-full border-none" title="Percentage" />
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </SidebarProvider>
  );
}
