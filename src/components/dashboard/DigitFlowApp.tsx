
"use client"

import { useState, useMemo } from 'react';
import { useDigitAnalysis, HISTORY_BUFFER_SIZE } from '@/hooks/use-digit-analysis';
import { DashboardHeader } from './DashboardHeader';
import { DigitCard } from './DigitCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, LabelList } from 'recharts';
import { SidebarProvider } from '@/components/ui/sidebar';

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
];

function LargePriceDisplay({ price }: { price: number | null }) {
  if (price === null) return null;
  
  const priceStr = price.toFixed(2);
  const mainPart = priceStr.slice(0, -1);
  const lastDigit = priceStr.slice(-1);

  return (
    <div className="flex flex-col items-center justify-center py-4 mb-2">
      <div className="text-4xl sm:text-6xl font-bold tracking-tighter flex items-baseline tabular-nums text-primary">
        <span className="opacity-90">{mainPart}</span>
        <span className="relative inline-block border-b-4 border-primary ml-1">
          {lastDigit}
        </span>
      </div>
    </div>
  );
}

function ComparisonRow({ label1, label2, val1, val2 }: { label1: string, label2: string, val1: number, val2: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
        <span className="text-primary">{label1} {val1}%</span>
        <span className="text-accent">{label2} {val2}%</span>
      </div>
      <div className="relative h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
        <div 
          className="absolute h-full bg-primary transition-all duration-300" 
          style={{ width: `${val1}%` }} 
        />
        <div 
          className="absolute h-full bg-accent transition-all duration-300 right-0" 
          style={{ width: `${val2}%` }} 
        />
      </div>
    </div>
  );
}

export default function DigitFlowApp() {
  const [symbol, setSymbol] = useState('R_100');
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

  const stats = useMemo(() => {
    const sorted = [...distribution].sort((a, b) => b.percentage - a.percentage);
    
    // Comparisons
    const windowTicks = ticks.slice(-windowSize);
    const windowPrices = prices.slice(-windowSize);
    
    const evenCount = windowTicks.filter(d => d % 2 === 0).length;
    const overCount = windowTicks.filter(d => d > 4).length;
    
    let riseCount = 0;
    for (let i = 1; i < windowPrices.length; i++) {
      if (windowPrices[i] > windowPrices[i-1]) riseCount++;
    }
    
    let matchCount = 0;
    for (let i = 1; i < windowTicks.length; i++) {
      if (windowTicks[i] === windowTicks[i-1]) matchCount++;
    }

    const total = windowTicks.length || 1;
    const totalMovements = Math.max(windowPrices.length - 1, 1);
    const totalSequences = Math.max(windowTicks.length - 1, 1);

    return {
      high: sorted[0]?.digit,
      secondHigh: sorted[1]?.digit,
      low: sorted[9]?.digit,
      secondLow: sorted[8]?.digit,
      comparisons: {
        even: Math.round((evenCount / total) * 100),
        odd: Math.round(((total - evenCount) / total) * 100),
        over: Math.round((overCount / total) * 100),
        under: Math.round(((total - overCount) / total) * 100),
        rise: Math.round((riseCount / totalMovements) * 100),
        fall: Math.round(((totalMovements - riseCount) / totalMovements) * 100),
        matches: Math.round((matchCount / totalSequences) * 100),
        differs: Math.round(((totalSequences - matchCount) / totalSequences) * 100),
      }
    };
  }, [distribution, ticks, prices, windowSize]);

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
        
        <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8 overflow-y-auto">
          <Card className="border-none bg-transparent shadow-none">
            <CardHeader className="px-0 pt-0 pb-2">
              <CardTitle className="text-xl font-medium text-foreground/80">Set your trade</CardTitle>
            </CardHeader>
            <CardContent className="px-0">
              <div className="bg-secondary/10 rounded-[2.5rem] p-6 sm:p-10 space-y-4 icy-glass">
                <LargePriceDisplay price={latestPrice} />
                
                <div className="space-y-6">
                  <h3 className="text-sm font-medium text-muted-foreground/60">
                    Last digit prediction
                  </h3>
                  
                  <div className="grid grid-cols-5 gap-3 sm:gap-6">
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
            <Card className="lg:col-span-2 border-border/50 bg-card/10 overflow-hidden icy-glass">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
                        cursor={{fill: 'hsl(var(--secondary))', opacity: 0.2}}
                        contentStyle={{backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px'}}
                        labelStyle={{color: 'hsl(var(--primary))', fontWeight: 'bold'}}
                        formatter={(value: number) => [`${value}%`, 'Percentage']}
                      />
                      <Bar dataKey="val" radius={[4, 4, 0, 0]} animationDuration={300}>
                        <LabelList 
                          dataKey="val" 
                          position="top" 
                          formatter={(value: number) => `${value}%`}
                          style={{ fill: 'hsl(var(--foreground))', fontSize: '10px', fontWeight: 'bold', opacity: 0.8 }}
                        />
                        {chartData.map((entry, index) => {
                          const digit = parseInt(entry.name);
                          let fill = 'hsl(var(--muted))';
                          if (digit === stats.high) fill = 'hsl(var(--primary))';
                          else if (digit === stats.secondHigh) fill = 'hsl(var(--accent))';
                          else if (digit === stats.low) fill = 'rgb(244, 63, 94)';
                          else if (digit === stats.secondLow) fill = 'rgb(245, 158, 11)';

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

            <Card className="border-border/50 bg-card/10 flex flex-col icy-glass">
              <CardContent className="pt-6 space-y-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-widest">Analysis Window</Label>
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
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest border-b border-white/5 pb-2">Comparisons</h4>
                  <ComparisonRow label1="Even" label2="Odd" val1={stats.comparisons.even} val2={stats.comparisons.odd} />
                  <ComparisonRow label1="Over" label2="Under" val1={stats.comparisons.over} val2={stats.comparisons.under} />
                  <ComparisonRow label1="Rise" label2="Fall" val1={stats.comparisons.rise} val2={stats.comparisons.fall} />
                  <ComparisonRow label1="Matches" label2="Differs" val1={stats.comparisons.matches} val2={stats.comparisons.differs} />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] pt-8 pb-4 border-t border-white/5">
            <span>&copy; {new Date().getFullYear()} frostytraders</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Live Golden Feed
              </span>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
