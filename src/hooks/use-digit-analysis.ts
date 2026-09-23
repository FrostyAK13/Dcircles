
"use client"

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { DerivWS, getQuoteDigit, type Tick, type ConnectionStatus } from '@/app/lib/deriv-ws';

export const HISTORY_BUFFER_SIZE = 5000;

export function useDigitAnalysis(symbol: string = 'R_10') {
  const [ticks, setTicks] = useState<number[]>([]);
  const [prices, setPrices] = useState<number[]>([]);
  const [latestDigit, setLatestDigit] = useState<number | null>(null);
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [windowSize, setWindowSize] = useState<number>(1000); 
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  
  const wsRef = useRef<DerivWS | null>(null);

  const onHistory = useCallback((_symbol: string, historicalPrices: number[]) => {
    if (!Array.isArray(historicalPrices)) return;
    
    const historicalDigits = historicalPrices
      .map(price => getQuoteDigit(price, _symbol))
      .filter((digit): digit is number => digit !== null);

    setTicks(historicalDigits);
    setPrices(historicalPrices);
    if (historicalDigits.length > 0) {
      setLatestDigit(historicalDigits[historicalDigits.length - 1]);
      setLatestPrice(historicalPrices[historicalPrices.length - 1]);
    }
  }, []);

  const onTick = useCallback((tick: Tick) => {
    const digit = getQuoteDigit(tick.quote, tick.symbol);
    if (digit === null) return;

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
    
    // Calculate precise percentages to 1 decimal place
    let rawPercentages = counts.map(count => (count / total) * 100);
    let formattedPercentages = rawPercentages.map(p => parseFloat(p.toFixed(1)));
    
    // Adjust sum to exactly 100% by modifying the highest frequency digit to handle rounding errors
    const currentSum = formattedPercentages.reduce((a, b) => a + b, 0);
    if (currentSum !== 100 && total > 0) {
      const diff = parseFloat((100 - currentSum).toFixed(1));
      const maxIdx = formattedPercentages.indexOf(Math.max(...formattedPercentages));
      if (maxIdx !== -1) {
        formattedPercentages[maxIdx] = parseFloat((formattedPercentages[maxIdx] + diff).toFixed(1));
      }
    }

    return counts.map((count, idx) => ({
      digit: idx,
      count,
      percentage: formattedPercentages[idx]
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
