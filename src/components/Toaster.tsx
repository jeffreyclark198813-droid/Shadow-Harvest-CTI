import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration?: number;
}

// Global state for simple implementation without complex context providers
let addNotificationFn: (n: Omit<Notification, 'id'>) => void = () => {};

export const notify = (notification: Omit<Notification, 'id'>) => {
  addNotificationFn(notification);
};

export const Toaster: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    addNotificationFn = (n: Omit<Notification, 'id'>) => {
      const id = Math.random().toString(36).substring(2, 9);
      const newNotification = { ...n, id, duration: n.duration || 5000 };
      
      setNotifications(prev => [...prev, newNotification]);
      
      if (newNotification.duration > 0) {
        setTimeout(() => {
          removeNotification(id);
        }, newNotification.duration);
      }
    };
  }, []);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case 'success': return <CheckCircle2 size={16} className="text-harvest-accent" />;
      case 'error': return <AlertTriangle size={16} className="text-red-500" />;
      case 'warning': return <AlertTriangle size={16} className="text-yellow-500" />;
      case 'info': return <Info size={16} className="text-blue-500" />;
    }
  };

  return (
    <div className="fixed top-20 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {notifications.map(n => (
          <motion.div
            key={n.id}
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 50, scale: 0.95 }}
            layout
            className="pointer-events-auto hardware-surface !bg-black/95 border border-gray-800 shadow-xl w-80 p-3 flex gap-3 items-start relative overflow-hidden"
          >
            <div className="mt-0.5">{getIcon(n.type)}</div>
            <div className="flex-1 min-w-0 pr-4">
              <h4 className="text-[11px] font-bold text-white uppercase tracking-widest">{n.title}</h4>
              {n.message && <p className="text-[10px] text-gray-400 font-mono mt-1 leading-tight">{n.message}</p>}
            </div>
            <button 
              onClick={() => removeNotification(n.id)}
              className="absolute top-2 right-2 text-gray-500 hover:text-white"
            >
              <X size={12} />
            </button>
            {n.duration && n.duration > 0 && (
              <motion.div 
                className={`absolute bottom-0 left-0 h-[2px] ${
                  n.type === 'success' ? 'bg-harvest-accent' : 
                  n.type === 'error' ? 'bg-red-500' : 
                  n.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                }`}
                initial={{ width: '100%' }}
                animate={{ width: 0 }}
                transition={{ duration: n.duration / 1000, ease: 'linear' }}
              />
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};
