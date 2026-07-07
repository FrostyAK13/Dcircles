"use client"

import { useState, useMemo, useEffect } from 'react';
import { useDigitAnalysis, HISTORY_BUFFER_SIZE } from '@/hooks/use-digit-analysis';
import { DashboardHeader } from './DashboardHeader';
import { DigitCard } from './DigitCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, LabelList } from 'recharts';
import { SidebarProvider } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

export const CONTINUOUS_INDICES = [
  { id: '1HZ10V', name: 'Volatility 10 (1s) Index', short: '10 (1s)' },
  { id: 'R_10', name: 'Volatility 10 Index', short: '10' },
  { id: '1HZ15V', name: 'Volatility 15 (1s) Index', short: '15 (1s)' },
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

function LargePriceDisplay({ price }: { price: number | null }) {
  if (price === null) return null;
  
  const priceStr = price.toFixed(2);

  return (
    <div className="flex flex-col items-center justify-center py-4 mb-2">
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
  return (
    <Card className="border-border/50 bg-white/50 overflow-hidden shadow-sm">
      <CardHeader className="pb-2 border-b border-black/5">
        <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        {showDigitSelector && (
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold block">Prediction Digit</span>
            <div className="flex flex-wrap gap-1 justify-center bg-black/5 p-2 rounded-xl">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => onDigitSelect?.(num)}
                  className={cn(
                    "w-6 h-6 rounded-md text-[10px] font-bold transition-all",
                    selectedDigit === num 
                      ? "bg-primary text-primary-foreground shadow-[0_0_10px_rgba(251,191,36,0.3)]" 
                      : "bg-black/5 text-muted-foreground hover:bg-black/10"
                  )}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-around items-center text-center">
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">{label1}</span>
            <div className="text-2xl font-bold text-primary">{count1}</div>
          </div>
          <div className="h-8 w-px bg-black/5" />
          <div className="space-y-1">
            <span className="text-[10px] uppercase tracking-tighter text-muted-foreground font-bold">{label2}</span>
            <div className="text-2xl font-bold text-accent">{count2}</div>
          </div>
        </div>

        <div className="space-y-2">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold block">{title} Pattern</span>
          <div className="flex flex-wrap gap-1.5 justify-center p-3 bg-black/5 rounded-xl">
            {pattern.map((p, i) => (
              <div 
                key={i} 
                className={cn(
                  "w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shadow-sm transition-all duration-300",
                  p.color
                )}
              >
                {p.label}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold block">Probability Analysis</span>
          <div className="space-y-3">
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest px-1">
                <span className="text-primary">{label1}</span>
                <span className="text-primary">{val1}%</span>
              </div>
              <div className="h-6 w-full bg-black/10 rounded-md overflow-hidden p-0.5">
                <div 
                  className="h-full bg-primary rounded-sm transition-all duration-500 ease-out" 
                  style={{ width: `${val1}%` }} 
                />
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest px-1">
                <span className="text-accent">{label2}</span>
                <span className="text-accent">{val2}%</span>
              </div>
              <div className="h-6 w-full bg-black/10 rounded-md overflow-hidden p-0.5">
                <div 
                  className="h-full bg-accent rounded-sm transition-all duration-500 ease-out" 
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

  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);

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

    const lastTicks = ticks.slice(-20);
    const lastPrices = prices.slice(-21);

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

  const chartData = useMemo(() => {
    return distribution.map(d => ({
      name: d.digit.toString(),
      val: d.percentage
    }));
  }, [distribution]);

  return (
    <SidebarProvider>
      <div className="flex flex-col min-h-screen w-full bg-background text-foreground">
        <DashboardHeader 
          status={status} 
          symbol={symbol} 
          totalTicks={totalTicks} 
          price={latestPrice}
          onSymbolChange={setSymbol}
        />
        
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8 overflow-y-auto">
          <Card className="border-none bg-transparent shadow-none">
            <CardContent className="px-0 pt-0">
              <div className="bg-white/80 rounded-[2.5rem] p-6 sm:p-10 space-y-4 shadow-xl border border-black/5">
                <LargePriceDisplay price={latestPrice} />
                
                <div className="space-y-6 relative">
                  <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground/60 text-center">
                    Last digit prediction
                  </h3>
                  
                  <div className="grid grid-cols-5 gap-3 sm:gap-6 max-w-4xl mx-auto relative">
                    {/* Shared Moving Indicator - The Arrow Cursor */}
                    {mounted && latestDigit !== null && (
                      <div 
                        className="absolute -top-8 z-20 text-primary transition-all duration-300 ease-in-out pointer-events-none"
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
                        onClick={() => setSelectedDigit(d.digit === selectedDigit ? null : d.digit)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border/50 bg-white shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                    Distribution Overview
                  </CardTitle>
                  <div className="text-2xl font-bold text-primary">
                    {windowSize} <span className="text-xs text-muted-foreground font-normal">Ticks</span>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] w-full pt-8">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 10, left: 10, bottom: 10 }}>
                      <XAxis 
                        dataKey="name" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12, fontWeight: 600}} 
                      />
                      <YAxis hide domain={[0, 'auto']} />
                      <Tooltip 
                        cursor={{fill: 'hsl(var(--secondary))', opacity: 0.1, radius: 4}}
                        animationDuration={300}
                        contentStyle={{backgroundColor: 'white', border: '1px solid hsl(var(--border))', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}
                        labelStyle={{color: 'hsl(var(--primary))', fontWeight: 'bold'}}
                        formatter={(value: number) => [`${value}%`, 'Percentage']}
                      />
                      <Bar 
                        dataKey="val" 
                        radius={[4, 4, 0, 0]} 
                        isAnimationActive={true}
                        animationDuration={500}
                        animationEasing="ease-out"
                      >
                        <LabelList 
                          dataKey="val" 
                          position="top" 
                          formatter={(value: number) => `${value}%`}
                          style={{ fill: 'hsl(var(--foreground))', fontSize: '10px', fontWeight: 'bold', opacity: 0.8 }}
                        />
                        {chartData.map((entry, index) => {
                          const digit = parseInt(entry.name);
                          let fill = 'hsl(var(--secondary))';
                          if (digit === stats.high) fill = 'rgb(16, 185, 129)'; // emerald-500
                          else if (digit === stats.secondHigh) fill = 'rgb(59, 130, 246)'; // blue-500
                          else if (digit === stats.low) fill = 'rgb(244, 63, 94)'; // rose-500
                          else if (digit === stats.secondLow) fill = 'rgb(249, 115, 22)'; // orange-500

                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={fill}
                              className="transition-all duration-300"
                            />
                          );
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 bg-white flex flex-col shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70">
                  Analysis Window
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-8 pt-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-widest">Ticks Range</Label>
                    <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">1 - {HISTORY_BUFFER_SIZE}</span>
                  </div>
                  <Slider 
                    value={[windowSize]} 
                    onValueChange={(vals) => setWindowSize(vals[0])}
                    min={1} 
                    max={HISTORY_BUFFER_SIZE} 
                    step={1}
                    className="py-4"
                  />
                  <div className="text-[10px] text-muted-foreground/50 leading-relaxed italic">
                    Adjusting the window changes the probability baseline for all analysis modules.
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DetailedComparison 
              title="Even / Odd"
              label1="Even"
              label2="Odd"
              val1={stats.comparisons.even}
              val2={stats.comparisons.odd}
              count1={stats.counts.even}
              count2={stats.counts.odd}
              pattern={stats.patterns.eo}
            />
            <DetailedComparison 
              title="Over / Under"
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
              title="Rise / Fall"
              label1="Rise"
              label2="Fall"
              val1={stats.comparisons.rise}
              val2={stats.comparisons.fall}
              count1={stats.counts.rise}
              count2={stats.counts.fall}
              pattern={stats.patterns.rf}
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
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] pt-8 pb-4 border-t border-black/5">
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
