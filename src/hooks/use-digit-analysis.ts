"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DerivWS, type Tick, type ConnectionStatus } from '@/app/lib/deriv-ws';

export const HISTORY_BUFFER_SIZE = 5000;

export function useDigitAnalysis(symbol: string = 'R_100') {
  const [ticks, setTicks] = useState<number[]>([]);
  const [prices, setPrices] = useState<number[]>([]);
  const [latestDigit, setLatestDigit] = useState<number | null>(null);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState<number>(1000); 
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  
  const wsRef = useRef<DerivWS | null>(null);

  const onHistory = useCallback((historicalPrices: number[]) => {
    const historicalDigits = historicalPrices.map(price => {
      const quoteStr = price.toFixed(2);
      return parseInt(quoteStr.slice(-1));
    }).filter(d => !isNaN(d));

    setTicks(historicalDigits);
    setPrices(historicalPrices);
    if (historicalDigits.length > 0) {
      setLatestDigit(historicalDigits[historicalDigits.length - 1]);
      setLatestPrice(historicalPrices[historicalPrices.length - 1]);
    }
  }, []);

  const onTick = useCallback((tick: Tick) => {
    const quoteStr = tick.quote.toFixed(2);
    const digit = parseInt(quoteStr.slice(-1));
    
    if (isNaN(digit)) return;

    setLatestPrice(tick.quote);
    setLatestDigit(digit);
    
    setTicks(prev => {
      const next = [...prev, digit];
      return next.length > HISTORY_BUFFER_SIZE ? next.slice(-HISTORY_BUFFER_SIZE) : next;
    });

    setPrices(prev => {
      const next = [...prev, tick.quote];
      return next.length > HISTORY_BUFFER_SIZE ? next.slice(-HISTORY_BUFFER_SIZE) : next;
    });
  }, []);

  useEffect(() => {
    setTicks([]);
    setPrices([]);
    setLatestDigit(null);
    setLatestPrice(null);
    
    const ws = new DerivWS(symbol, onTick, setStatus, onHistory);
    wsRef.current = ws;
    ws.connect();
    
    return () => {
      ws.disconnect();
      wsRef.current = null;
    };
  }, [symbol, onTick, onHistory]);

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
    ticks,
    prices,
    latestDigit,
    latestPrice,
    windowSize,
    setWindowSize,
    totalTicks: ticks.length,
    status,
    currentSymbol: symbol
  };
}
