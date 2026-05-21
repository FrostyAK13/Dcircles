"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DerivWS, type Tick, type ConnectionStatus } from '@/app/lib/deriv-ws';

export const HISTORY_BUFFER_SIZE = 1000;

export function useDigitAnalysis(symbol: string = 'R_100') {
  const [ticks, setTicks] = useState<number[]>([]);
  const [windowSize, setWindowSize] = useState<number>(100);
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastTickTime, setLastTickTime] = useState<number | null>(null);
  const [tickSpeed, setTickSpeed] = useState<number>(0);

  const onTick = useCallback((tick: Tick) => {
    // Safely extract the last digit of the quote
    const quoteStr = tick.quote.toString();
    const decimalPart = quoteStr.split('.')[1] || '';
    const precision = decimalPart.length;
    const lastDigit = parseInt(tick.quote.toFixed(precision).slice(-1));
    
    setTicks(prev => {
      const next = [...prev, lastDigit];
      if (next.length > HISTORY_BUFFER_SIZE) {
        return next.slice(-HISTORY_BUFFER_SIZE);
      }
      return next;
    });

    setLastTickTime(prev => {
      const now = Date.now();
      if (prev) {
        setTickSpeed(now - prev);
      }
      return now;
    });
  }, []);

  useEffect(() => {
    const ws = new DerivWS(symbol, onTick, setStatus);
    ws.connect();
    return () => ws.disconnect();
  }, [symbol, onTick]);

  const distribution = useMemo(() => {
    const windowTicks = ticks.slice(-windowSize);
    const counts = new Array(10).fill(0);
    
    if (windowTicks.length === 0) {
      return counts.map((count, idx) => ({ 
        digit: idx, 
        count, 
        percentage: 0 
      }));
    }

    windowTicks.forEach(digit => {
      counts[digit]++;
    });

    const total = windowTicks.length;
    let percentages = counts.map(count => Math.round((count / total) * 1000) / 10);
    
    // Ensure total is exactly 100% due to rounding
    const sum = percentages.reduce((a, b) => a + b, 0);
    if (sum !== 100 && total > 0) {
      const diff = Math.round((100 - sum) * 10) / 10;
      // Adjust the largest percentage to keep it 100%
      const maxIdx = percentages.indexOf(Math.max(...percentages));
      percentages[maxIdx] = Math.round((percentages[maxIdx] + diff) * 10) / 10;
    }

    return counts.map((count, idx) => ({
      digit: idx,
      count,
      percentage: percentages[idx]
    }));
  }, [ticks, windowSize]);

  return {
    distribution,
    windowSize,
    setWindowSize,
    totalTicks: ticks.length,
    status,
    tickSpeed,
    currentSymbol: symbol
  };
}
