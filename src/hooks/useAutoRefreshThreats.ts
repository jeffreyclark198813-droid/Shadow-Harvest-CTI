import { useState, useEffect, useCallback, useRef } from 'react';

export interface AutoRefreshOptions {
  intervalSeconds: number; // 0 = disabled
  onRefresh: () => Promise<void> | void;
  enabled?: boolean;
}

export interface AutoRefreshState {
  secondsLeft: number;
  isRefreshing: boolean;
  lastRefreshedAt: Date | null;
  manualRefresh: () => Promise<void>;
  isAutoRefreshActive: boolean;
}

export function useAutoRefreshThreats({
  intervalSeconds,
  onRefresh,
  enabled = true
}: AutoRefreshOptions): AutoRefreshState {
  const [secondsLeft, setSecondsLeft] = useState<number>(intervalSeconds > 0 ? intervalSeconds : 0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(new Date());
  const onRefreshRef = useRef(onRefresh);

  useEffect(() => {
    onRefreshRef.current = onRefresh;
  }, [onRefresh]);

  const manualRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await onRefreshRef.current();
      setLastRefreshedAt(new Date());
    } catch (err) {
      console.error('[useAutoRefreshThreats] Failed to refresh threat data:', err);
    } finally {
      setIsRefreshing(false);
      if (intervalSeconds > 0) {
        setSecondsLeft(intervalSeconds);
      }
    }
  }, [intervalSeconds]);

  useEffect(() => {
    if (!enabled || intervalSeconds <= 0) {
      setSecondsLeft(0);
      return;
    }

    setSecondsLeft(intervalSeconds);

    const timer = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          // Trigger refresh
          manualRefresh();
          return intervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [intervalSeconds, enabled, manualRefresh]);

  return {
    secondsLeft,
    isRefreshing,
    lastRefreshedAt,
    manualRefresh,
    isAutoRefreshActive: enabled && intervalSeconds > 0
  };
}
