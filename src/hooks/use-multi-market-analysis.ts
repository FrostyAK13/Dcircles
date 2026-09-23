"use client"

import { useState, useEffect, useCallback, useRef } from 'react';
import { DerivWS, getQuoteDigit, type Tick, type ConnectionStatus } from '@/app/lib/deriv-ws';

export interface MarketData {
  ticks: number[];
  prices: number[];
  latestPrice: number | null;
  latestDigit: number | null;
}

export function useMultiMarketAnalysis(symbols: string[]) {
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [status, setStatus] = useState<ConnectionStatus>('disconnected');
  const wsRef = useRef<DerivWS | null>(null);

  const onHistory = useCallback((symbol: string, historyPrices: number[]) => {
    const historyDigits = historyPrices
      .map(price => getQuoteDigit(price, symbol))
      .filter((digit): digit is number => digit !== null);
    setMarketData(prev => ({
      ...prev,
      [symbol]: {
        ticks: historyDigits,
        prices: historyPrices,
        latestPrice: historyPrices[historyPrices.length - 1] || null,
        latestDigit: historyDigits[historyDigits.length - 1] ?? null
      }
    }));
  }, []);

  const onTick = useCallback((tick: Tick) => {
    const digit = getQuoteDigit(tick.quote, tick.symbol);
    if (digit === null) return;

    setMarketData(prev => {
      const current = prev[tick.symbol] || { ticks: [], prices: [], latestPrice: null, latestDigit: null };
      const newTicks = [...current.ticks, digit].slice(-500);
      const newPrices = [...current.prices, tick.quote].slice(-500);
      
      return {
        ...prev,
        [tick.symbol]: {
          ticks: newTicks,
          prices: newPrices,
          latestPrice: tick.quote,
          latestDigit: digit
        }
      };
    });
  }, []);

  useEffect(() => {
    const ws = new DerivWS(symbols, onTick, setStatus, onHistory);
    wsRef.current = ws;
    ws.connect();
    
    return () => {
      ws.disconnect();
      wsRef.current = null;
    };
  }, [symbols, onTick, onHistory]);

  return { marketData, status };
}