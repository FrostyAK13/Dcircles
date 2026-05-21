"use client"

import { useState, useMemo } from 'react';
import { useDigitAnalysis, HISTORY_BUFFER_SIZE } from '@/hooks/use-digit-analysis';
import { DashboardHeader } from './DashboardHeader';
import { DigitCard } from './DigitCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip, LabelList } from 'recharts';

function LargePriceDisplay({ price }: { price: number | null }) {
  if (price === null) return null;
  
  const priceStr = price.toFixed(2);
  const mainPart = priceStr.slice(0, -1);
  const lastDigit = priceStr.slice(-1);

  return (
    <div className="flex flex-col items-center justify-center py-4 mb-2">
      <div className="text-4xl sm:text-6xl font-bold tracking-tighter flex items-baseline tabular-nums">
        <span className="opacity-90">{mainPart}</span>
        <span className="relative inline-block border-b-4 border-foreground ml-1">
          {lastDigit}
        </span>
      </div>
    </div>
  );
}

export default function DigitFlowApp() {
  const { 
    distribution, 
    latestDigit,
    latestPrice,
    windowSize, 
    setWindowSize, 
    totalTicks, 
    status, 
    currentSymbol 
  } = useDigitAnalysis('R_100');

  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);

  const stats = useMemo(() => {
    // Sort to find ranks
    const sorted = [...distribution].sort((a, b) => b.percentage - a.percentage);
    
    return {
      high: sorted[0]?.digit,
      secondHigh: sorted[1]?.digit,
      low: sorted[9]?.digit,
      secondLow: sorted[8]?.digit
    };
  }, [distribution]);

  const chartData = useMemo(() => {
    return distribution.map(d => ({
      name: d.digit.toString(),
      val: d.percentage
    }));
  }, [distribution]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <DashboardHeader 
        status={status} 
        symbol={currentSymbol} 
        totalTicks={totalTicks} 
        price={latestPrice}
      />
      
      <main className="flex-1 p-4 md:p-8 max-w-6xl mx-auto w-full space-y-8">
        {/* Set Your Trade Section */}
        <Card className="border-none bg-card/10 shadow-none">
          <CardHeader className="px-0 pt-0 pb-2">
            <CardTitle className="text-xl font-medium text-foreground/80">Set your trade</CardTitle>
          </CardHeader>
          <CardContent className="px-0">
            <div className="bg-secondary/20 rounded-[2.5rem] p-6 sm:p-10 space-y-4">
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

        {/* Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 bg-card/20 overflow-hidden">
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
                      cursor={{fill: 'hsl(var(--secondary))', opacity: 0.4}}
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
                        let fill = 'hsl(var(--primary))';
                        if (digit === stats.high) fill = 'rgb(16, 185, 129)';
                        else if (digit === stats.secondHigh) fill = 'rgb(56, 189, 248)';
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

          <Card className="border-border/50 bg-card/20 flex flex-col justify-center">
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-xs font-semibold uppercase text-muted-foreground tracking-widest">Analysis Window</Label>
                  <span className="text-xs font-bold text-accent bg-accent/10 px-2 py-0.5 rounded">1 - {HISTORY_BUFFER_SIZE}</span>
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
              
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3 tracking-widest">Legend</h4>
                <div className="grid grid-cols-1 gap-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span className="font-medium">1st Highest</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-sky-400" />
                    <span className="font-medium">2nd Highest</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-rose-500" />
                    <span className="font-medium">1st Lowest</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2 h-2 rounded-full bg-amber-500" />
                    <span className="font-medium">2nd Lowest</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <div className="w-2 h-2 rounded-full bg-foreground" />
                    <span className="font-medium">Latest Digit</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] pt-8 pb-4 border-t border-border/10">
          <span>&copy; {new Date().getFullYear()} frostytraders</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Feed
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
