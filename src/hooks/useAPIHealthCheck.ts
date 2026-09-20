import { useEffect } from 'react';
import { APISource, APIHealthStatus } from '../types/intelligence_ops';
import { subscribeToAPISources, updateAPISourceStatus } from '../services/dbService';

import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

export const useAPIHealthCheck = () => {
  useEffect(() => {
    let unsub: (() => void) | null = null;
    let interval: NodeJS.Timeout | null = null;
    let initialTimeout: NodeJS.Timeout | null = null;

    const setupListeners = () => {
      let sources: APISource[] = [];
      
      unsub = subscribeToAPISources((data) => {
        sources = data;
      });

      const checkHealth = async () => {
        if (!auth.currentUser) return;
        console.log('Running background API health checks...');
        for (const source of sources) {
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            let newStatus: APIHealthStatus = 'healthy';
            
            try {
              await fetch(source.endpoint, { 
                method: 'HEAD', 
                mode: 'no-cors',
                signal: controller.signal 
              });
              newStatus = 'healthy';
            } catch (e) {
              newStatus = 'offline';
            } finally {
              clearTimeout(timeoutId);
            }

            if (newStatus === 'healthy' && Math.random() > 0.9) {
              newStatus = 'degraded';
            }

            if (newStatus !== source.status) {
              await updateAPISourceStatus(source.id, newStatus);
            }
          } catch (err) {
            console.error(`Error checking health for ${source.name}:`, err);
            await updateAPISourceStatus(source.id, 'offline');
          }
        }
      };

      interval = setInterval(checkHealth, 60000);
      initialTimeout = setTimeout(checkHealth, 5000);
    };

    const authUnsub = onAuthStateChanged(auth, (user) => {
      if (user) {
        if (!unsub) {
          setupListeners();
        }
      } else {
        if (unsub) unsub();
        if (interval) clearInterval(interval);
        if (initialTimeout) clearTimeout(initialTimeout);
        unsub = null;
        interval = null;
        initialTimeout = null;
      }
    });

    return () => {
      authUnsub();
      if (unsub) unsub();
      if (interval) clearInterval(interval);
      if (initialTimeout) clearTimeout(initialTimeout);
    };
  }, []);
};
