
"use client"

import { useState, useEffect, useCallback, useMemo } from 'react';
import { DerivWS, type Tick, type ConnectionStatus } from '@/app/lib/deriv-ws';

export const HISTORY_BUFFER_SIZE = 1000;

export function useDigitAnalysis(symbol: string = 'R_100') {
  const [ticks, setTicks] = useState<number[]>([]);
  const [latestDigit, setLatestDigit] = useState<number | null>(null);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState<number>(1000); 
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    // Seed with 1000 digits to ensure meaningful percentages on load
    const seed = Array.from({ length: 1000 }, () => Math.floor(Math.random() * 10));
    setTicks(seed);
    setLatestDigit(seed[seed.length - 1]);
    setLatestPrice(100.00); 
  }, []);

  const onTick = useCallback((tick: Tick) => {
    // Derive digits based on the standard display precision for Volatility Indices in this app.
    // We standardize on 2 decimal places to match the UI's price display.
    // This ensures that trailing zeros (e.g., .10) are correctly identified as '0'.
    const quoteStr = tick.quote.toFixed(2);
    const digit = parseInt(quoteStr.slice(-1));
    
    // digit 0 is valid and parseInt correctly returns it. isNaN(0) is false.
    if (isNaN(digit)) return;

    setLatestPrice(tick.quote);
    setLatestDigit(digit);
    setTicks(prev => {
      const next = [...prev, digit];
      if (next.length > HISTORY_BUFFER_SIZE) {
        return next.slice(-HISTORY_BUFFER_SIZE);
      }
      return next;
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
    latestDigit,
    latestPrice,
    windowSize,
    setWindowSize,
    totalTicks: ticks.length,
    status,
    currentSymbol: symbol
  };
}
