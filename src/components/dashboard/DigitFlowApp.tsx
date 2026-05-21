"use client"

import { useState, useMemo } from 'react';
import { useDigitAnalysis, HISTORY_BUFFER_SIZE } from '@/hooks/use-digit-analysis';
import { DashboardHeader } from './DashboardHeader';
import { DigitCard } from './DigitCard';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, Tooltip } from 'recharts';

export default function DigitFlowApp() {
  const { 
    distribution, 
    windowSize, 
    setWindowSize, 
    totalTicks, 
    status, 
    tickSpeed, 
    currentSymbol 
  } = useDigitAnalysis('R_100');

  const [selectedDigit, setSelectedDigit] = useState<number | null>(null);

  const stats = useMemo(() => {
    // distribution always has 10 elements due to robust mapping in the hook
    const percentages = distribution.map(d => d.percentage);
    const maxVal = Math.max(...percentages);
    const minVal = Math.min(...percentages);
    
    return {
      high: distribution.findIndex(d => d.percentage === maxVal),
      low: distribution.findIndex(d => d.percentage === minVal)
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
        speed={tickSpeed} 
      />
      
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full space-y-8">
        {/* Controls Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-border/50 bg-card/20 overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                  Distribution Overview
                </CardTitle>
                <div className="text-2xl font-bold text-primary">
                  {windowSize} <span className="text-xs text-muted-foreground font-normal">Ticks Window</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fill: 'hsl(var(--muted-foreground))', fontSize: 12}} 
                    />
                    <YAxis hide />
                    <Tooltip 
                      cursor={{fill: 'hsl(var(--secondary))', opacity: 0.4}}
                      contentStyle={{backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px'}}
                      labelStyle={{color: 'hsl(var(--primary))', fontWeight: 'bold'}}
                    />
                    <Bar dataKey="val" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={index === stats.high ? 'rgb(16, 185, 129)' : index === stats.low ? 'rgb(244, 63, 94)' : 'hsl(var(--primary))'} 
                        />
                      ))}
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
                <div className="flex justify-between text-[10px] text-muted-foreground font-medium">
                  <span>FASTEST</span>
                  <span>SMOOTHEST</span>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                <h4 className="text-[10px] font-bold uppercase text-muted-foreground mb-3 tracking-widest">Legend</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-medium">Highest Percentage</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-medium">Lowest Percentage</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                    <span className="font-medium">Selected Digit</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Digit Grid Section */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {distribution.map((d) => (
            <DigitCard
              key={d.digit}
              digit={d.digit}
              percentage={d.percentage}
              count={d.count}
              isHigh={d.digit === stats.high}
              isLow={d.digit === stats.low}
              isSelected={d.digit === selectedDigit}
              onClick={() => setSelectedDigit(d.digit === selectedDigit ? null : d.digit)}
            />
          ))}
        </div>

        {/* Footer Info */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-muted-foreground font-medium uppercase tracking-[0.2em] border-t border-border/30 pt-8 pb-4">
          <span>&copy; {new Date().getFullYear()} DigitFlow Analysis</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Real-time WebSocket Data
            </span>
            <span className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-accent" />
              Buffer: {HISTORY_BUFFER_SIZE} Ticks
            </span>
          </div>
        </div>
      </main>
    </div>
  );
}
