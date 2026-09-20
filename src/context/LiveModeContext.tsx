import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

export interface LiveModeContextType {
  isLiveMode: boolean;
  setIsLiveMode: (active: boolean) => void;
  toggleLiveMode: () => void;
  refreshInterval: number; // in seconds
  setRefreshInterval: (seconds: number) => void;
  secondsLeft: number;
  isRefreshing: boolean;
  lastRefreshedAt: Date | null;
  manualRefresh: () => Promise<void>;
  registerRefreshHandler: (id: string, handler: () => Promise<void> | void) => () => void;
}

const LiveModeContext = createContext<LiveModeContextType | null>(null);

export const LiveModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLiveMode, setIsLiveModeState] = useState<boolean>(() => {
    const saved = localStorage.getItem('dwi_live_mode_enabled');
    return saved !== null ? saved === 'true' : true;
  });

  const [refreshInterval, setRefreshIntervalState] = useState<number>(() => {
    const saved = localStorage.getItem('dwi_live_mode_interval');
    return saved !== null ? parseInt(saved, 10) : 30;
  });

  const [secondsLeft, setSecondsLeft] = useState<number>(refreshInterval);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date | null>(new Date());

  const handlersRef = useRef<Map<string, () => Promise<void> | void>>(new Map());

  const setIsLiveMode = useCallback((active: boolean) => {
    setIsLiveModeState(active);
    localStorage.setItem('dwi_live_mode_enabled', String(active));
    if (active) {
      setSecondsLeft(refreshInterval);
    }
  }, [refreshInterval]);

  const toggleLiveMode = useCallback(() => {
    setIsLiveMode(!isLiveMode);
  }, [isLiveMode, setIsLiveMode]);

  const setRefreshInterval = useCallback((seconds: number) => {
    setRefreshIntervalState(seconds);
    localStorage.setItem('dwi_live_mode_interval', String(seconds));
    setSecondsLeft(seconds);
  }, []);

  const registerRefreshHandler = useCallback((id: string, handler: () => Promise<void> | void) => {
    handlersRef.current.set(id, handler);
    return () => {
      handlersRef.current.delete(id);
    };
  }, []);

  const manualRefresh = useCallback(async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      const promises: Promise<any>[] = [];
      handlersRef.current.forEach((handler) => {
        try {
          const res = handler();
          if (res instanceof Promise) {
            promises.push(res);
          }
        } catch (e) {
          console.error('[LiveModeContext] Error in refresh handler:', e);
        }
      });
      await Promise.allSettled(promises);
      setLastRefreshedAt(new Date());
    } finally {
      setIsRefreshing(false);
      setSecondsLeft(refreshInterval);
    }
  }, [isRefreshing, refreshInterval]);

  // Interval timer for live countdown
  useEffect(() => {
    if (!isLiveMode || refreshInterval <= 0) {
      setSecondsLeft(0);
      return;
    }

    setSecondsLeft(refreshInterval);

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          manualRefresh();
          return refreshInterval;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLiveMode, refreshInterval, manualRefresh]);

  return (
    <LiveModeContext.Provider
      value={{
        isLiveMode,
        setIsLiveMode,
        toggleLiveMode,
        refreshInterval,
        setRefreshInterval,
        secondsLeft,
        isRefreshing,
        lastRefreshedAt,
        manualRefresh,
        registerRefreshHandler,
      }}
    >
      {children}
    </LiveModeContext.Provider>
  );
};

export const useLiveMode = () => {
  const context = useContext(LiveModeContext);
  if (!context) {
    throw new Error('useLiveMode must be used within a LiveModeProvider');
  }
  return context;
};
