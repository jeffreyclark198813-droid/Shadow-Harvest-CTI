import React, { useState, useEffect } from 'react';
import { AlertTriangle, ShieldAlert, Zap, Clock, X, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { telemetryService, RateLimitStatus, GEMINI_MAX_REQUESTS_PER_MINUTE } from '../services/telemetryService';

interface RateLimitAlertProps {
  customMaxRPM?: number;
  className?: string;
}

interface CircuitBreakerStatus {
  active: boolean;
  timeLeft: number;
}

export const RateLimitAlert: React.FC<RateLimitAlertProps> = ({ customMaxRPM, className = '' }) => {
  const [status, setStatus] = useState<RateLimitStatus>(() => 
    telemetryService.getRateLimitStatus(customMaxRPM)
  );
  const [circuitStatus, setCircuitStatus] = useState<CircuitBreakerStatus>({ active: false, timeLeft: 0 });
  const [isDismissed, setIsDismissed] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Subscribe to rate limit telemetry
  useEffect(() => {
    const unsub = telemetryService.subscribeRateLimit(newStatus => {
      setStatus(newStatus);
      if (newStatus.isCritical) {
        setIsDismissed(false);
      }
    });
    return () => {
      unsub();
    };
  }, [customMaxRPM]);

  // Poll server-side circuit breaker status for absolute transparency (no silent fallback)
  useEffect(() => {
    const checkCircuitBreaker = async () => {
      try {
        const res = await fetch('/api/v1/observability/circuit-breaker');
        if (res.ok) {
          const data = await res.json();
          setCircuitStatus(data);
        }
      } catch (err) {
        console.warn("Failed to fetch circuit breaker state (standard transient network state):", err instanceof Error ? err.message : err);
      }
    };

    checkCircuitBreaker();
    const interval = setInterval(checkCircuitBreaker, 4000);
    return () => clearInterval(interval);
  }, []);

  const showFullAlert = (status.isApproaching || status.isWarning || status.isCritical) && !isDismissed;
  const showCircuitAlert = circuitStatus.active;

  if (!showFullAlert && !status.isApproaching && !showCircuitAlert) {
    return null;
  }

  return (
    <AnimatePresence>
      <div className={`space-y-3 ${className}`}>
        {/* ========================================== */}
        {/* CIRCUIT BREAKER ACTIVE HUD WARNING        */}
        {/* ========================================== */}
        {showCircuitAlert && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="relative border border-orange-500/80 bg-orange-950/40 text-orange-300 rounded-2xl p-4 overflow-hidden backdrop-blur-md shadow-[0_0_20px_rgba(249,115,22,0.25)]"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 shrink-0 mt-0.5">
                  <ShieldAlert size={20} className="animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-white">
                      OFF-GRID LOCAL INFERENCE FALLBACK BYPASS ACTIVE
                    </h4>
                    <span className="px-2 py-0.5 bg-orange-500 text-black rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">
                      CIRCUIT_BREAKER_OPEN
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-300 font-mono mt-1 leading-relaxed">
                    The server-side Gemini API has triggered a rate-limiting cooldown (Quota Exceeded / HTTP 429). The system's **Circuit Breaker** has tripped. All OSINT & CTI intelligence pipelines are automatically routed to **Off-Grid Local Heuristic Inference** to protect operational flow and preserve zero-latency performance.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCircuitStatus(prev => ({ ...prev, active: false }))}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all shrink-0"
                title="Dismiss Warning"
              >
                <X size={16} />
              </button>
            </div>

            {/* Countdown / Cooldown bar representation */}
            <div className="mt-3.5 space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Clock size={11} className="text-orange-400" />
                  Self-Healing Cool-Down Timer (Automatic Reset Attempt)
                </span>
                <span className="font-bold text-orange-400">
                  Resets in {circuitStatus.timeLeft}s
                </span>
              </div>
              <div className="w-full h-1.5 bg-black/50 rounded-full overflow-hidden border border-white/5">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: `${(circuitStatus.timeLeft / 60) * 100}%` }}
                  transition={{ ease: "linear" }}
                  className="h-full rounded-full bg-orange-500 shadow-[0_0_8px_#f97316]"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* ========================================== */}
        {/* STANDARD SLIDING WINDOW RPM ALERT          */}
        {/* ========================================== */}
        {showFullAlert && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className={`relative border rounded-2xl p-4 overflow-hidden backdrop-blur-md transition-all ${
              status.isCritical 
                ? 'border-red-500/80 bg-red-950/40 text-red-300 shadow-[0_0_20px_rgba(239,68,68,0.25)]' 
                : status.isWarning 
                  ? 'border-amber-500/80 bg-amber-950/40 text-amber-300 shadow-[0_0_20px_rgba(245,158,11,0.2)]' 
                  : 'border-yellow-500/60 bg-yellow-950/30 text-yellow-300'
            }`}
          >
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
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      status.isCritical 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : status.isWarning 
                          ? 'bg-amber-500 text-black' 
                          : 'bg-yellow-400 text-black'
                    }`}>
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
                >
                  {isCollapsed ? 'Expand' : 'Details'}
                </button>
                <button
                  onClick={() => setIsDismissed(true)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

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
                  className={`h-full rounded-full ${
                    status.isCritical 
                      ? 'bg-red-500' 
                      : status.isWarning 
                        ? 'bg-amber-400' 
                        : 'bg-yellow-400'
                  } shadow-[0_0_8px_currentColor]`}
                />
              </div>
            </div>

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
      </div>
    </AnimatePresence>
  );
};
