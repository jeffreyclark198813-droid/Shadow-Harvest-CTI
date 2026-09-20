import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Zap, Clock, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { telemetryService, RateLimitStatus, GEMINI_MAX_REQUESTS_PER_MINUTE } from '../services/telemetryService';

interface RateLimitAlertProps {
  customMaxRPM?: number;
  className?: string;
}

export const RateLimitAlert: React.FC<RateLimitAlertProps> = ({ customMaxRPM, className = '' }) => {
  const [status, setStatus] = useState<RateLimitStatus>(() => 
    telemetryService.getRateLimitStatus(customMaxRPM)
  );
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const unsub = telemetryService.subscribeRateLimit(newStatus => {
      setStatus(newStatus);
      // Auto un-dismiss if situation becomes critical or changes significantly
      if (newStatus.isCritical) {
        setIsDismissed(false);
      }
    });
    return () => {
      unsub();
    };
  }, [customMaxRPM]);

  // If usage is below 70%, we can display an ambient minimal chip or nothing
  const showFullAlert = (status.isApproaching || status.isWarning || status.isCritical) && !isDismissed;

  if (!showFullAlert && !status.isApproaching) {
    return null;
  }

  const alertColor = status.isCritical 
    ? 'border-red-500/80 bg-red-950/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.25)]' 
    : status.isWarning 
      ? 'border-amber-500/80 bg-amber-950/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
      : 'border-yellow-500/60 bg-yellow-950/30 text-yellow-300';

  const badgeColor = status.isCritical 
    ? 'bg-red-500 text-white animate-pulse' 
    : status.isWarning 
      ? 'bg-amber-500 text-black' 
      : 'bg-yellow-400 text-black';

  const progressBg = status.isCritical 
    ? 'bg-red-500' 
    : status.isWarning 
      ? 'bg-amber-400' 
      : 'bg-yellow-400';

  return (
    <AnimatePresence>
      {showFullAlert && (
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          className={`relative border rounded-2xl p-4 overflow-hidden backdrop-blur-md transition-all ${alertColor} ${className}`}
        >
          {/* Top warning line with glow */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${status.isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}`}>
                {status.isCritical ? <ShieldAlert size={20} className="animate-bounce" /> : <AlertTriangle size={20} />}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                    {status.isCritical 
                      ? 'GEMINI API RATE LIMIT THRESHOLD EXCEEDED' 
                      : status.isWarning 
                        ? 'APPROACHING GEMINI MAXIMUM REQUESTS PER MINUTE' 
                        : 'GEMINI RPM ELEVATED LOAD ALERT'}
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${badgeColor}`}>
                    {status.currentRPM} / {status.maxRPM} RPM ({status.percentUsed}%)
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 font-mono mt-1 leading-relaxed">
                  {status.isCritical
                    ? `Current request volume exceeds the safety cap of ${status.maxRPM} req/min. AI calls may trigger HTTP 429 quota exhaustion. Background retries with exponential backoff active.`
                    : status.isWarning
                      ? `Operating at ${status.percentUsed}% of maximum throughput (${status.currentRPM} of ${status.maxRPM} requests in the rolling 60-second window). Automated throttling and caching recommended.`
                      : `Request rate is nearing capacity (${status.currentRPM}/${status.maxRPM} RPM). Pacing automated synthesis requests to preserve service continuity.`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all text-[10px] font-mono uppercase tracking-wider"
                title={isCollapsed ? 'Expand Alert Details' : 'Collapse Details'}
              >
                {isCollapsed ? 'Expand' : 'Details'}
              </button>
              <button
                onClick={() => setIsDismissed(true)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                title="Dismiss Alert"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Progress bar representing RPM capacity */}
          <div className="mt-3.5 space-y-1.5">
            <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
              <span className="flex items-center gap-1.5">
                <Clock size={11} className="text-gray-400" />
                Sliding 60-Second Quota Window
              </span>
              <span className="font-bold text-white">
                {Math.min(100, status.percentUsed)}% Consumed
              </span>
            </div>
            <div className="w-full h-2 bg-black/50 rounded-full overflow-hidden border border-white/10">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, status.percentUsed)}%` }}
                transition={{ duration: 0.4 }}
                className={`h-full rounded-full ${progressBg} shadow-[0_0_8px_currentColor]`}
              />
            </div>
          </div>

          {/* Detailed metrics section (collapsible) */}
          {!isCollapsed && (
            <div className="mt-3 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-gray-400 block text-[9px]">MAX_CAPACITY</span>
                <span className="text-white font-bold">{status.maxRPM} req/min</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-gray-400 block text-[9px]">ACTIVE_IN_WINDOW</span>
                <span className="text-white font-bold">{status.currentRPM} requests</span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-gray-400 block text-[9px]">BURST_HEADROOM</span>
                <span className={`font-bold ${status.maxRPM - status.currentRPM <= 2 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {Math.max(0, status.maxRPM - status.currentRPM)} remaining
                </span>
              </div>
              <div className="bg-black/30 p-2 rounded-lg border border-white/5">
                <span className="text-gray-400 block text-[9px]">BACKOFF_STATUS</span>
                <span className="text-cyan-400 font-bold">RELIABILITY_ENG_ON</span>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
