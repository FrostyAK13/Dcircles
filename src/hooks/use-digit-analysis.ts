"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DerivWS, type Tick, type ConnectionStatus } from '@/app/lib/deriv-ws';

export const HISTORY_BUFFER_SIZE = 1000;

export function useDigitAnalysis(symbol: string = 'R_100') {
  const [ticks, setTicks] = useState<number[]>([]);
  const [windowSize, setWindowSize] = useState<number>(1000); // Default to full buffer
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const [lastTickTime, setLastTickTime] = useState<number | null>(null);
  const [tickSpeed, setTickSpeed] = useState<number>(0);

  // Initialize with 1000 random ticks on mount to ensure analysis is ready immediately
  useEffect(() => {
    const seed = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 10));
    setTicks(seed);
  }, []);

  const onTick = useCallback((tick: Tick) => {
    // Safely extract the last digit of the quote based on its actual precision
    const quoteStr = tick.quote.toString();
    const decimalPart = quoteStr.split('.')[1] || '';
    const precision = decimalPart.length;
    const digit = parseInt(tick.quote.toFixed(precision).slice(-1));
    
    if (isNaN(digit)) return;

    setTicks(prev => {
      const next = [...prev, digit];
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
    
    // Always return a full array of digits 0-9 even if history is empty
    if (windowTicks.length === 0) {
      return Array.from({ length: 10 }, (_, i) => ({
        digit: i,
        count: 0,
        percentage: 0
      }));
    }

    windowTicks.forEach(digit => {
      if (digit >= 0 && digit <= 9) {
        counts[digit]++;
      }
    });

    const total = windowTicks.length;
    let percentages = counts.map(count => Math.round((count / total) * 1000) / 10);
    
    // Ensure total is exactly 100% due to floating point rounding
    const sum = percentages.reduce((a, b) => a + b, 0);
    if (sum !== 100 && total > 0) {
      const diff = Math.round((100 - sum) * 10) / 10;
      const maxIdx = percentages.indexOf(Math.max(...percentages));
      if (maxIdx !== -1) {
        percentages[maxIdx] = Math.round((percentages[maxIdx] + diff) * 10) / 10;
      }
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
