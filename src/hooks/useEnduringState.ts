import { useState, useCallback } from 'react';

export function useEnduringState<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(() => {
    try {
      const cached = sessionStorage.getItem(`target_tab_data_${key}`);
      return cached ? JSON.parse(cached) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setEnduringState = useCallback((val: T | ((prev: T) => T)) => {
    setState((prevState) => {
      const nextVal = typeof val === 'function' ? (val as (prev: T) => T)(prevState) : val;
      try {
        if (nextVal === undefined || nextVal === null) {
          sessionStorage.removeItem(`target_tab_data_${key}`);
        } else {
          sessionStorage.setItem(`target_tab_data_${key}`, JSON.stringify(nextVal));
        }
      } catch {}
      return nextVal;
    });
  }, [key]);

  return [state, setEnduringState];
}
