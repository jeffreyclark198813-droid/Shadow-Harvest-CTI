import { ReliabilityMetric } from '../types/atomic';

export const GEMINI_MAX_REQUESTS_PER_MINUTE = 15;

export interface RateLimitStatus {
  currentRPM: number;
  maxRPM: number;
  percentUsed: number;
  isApproaching: boolean; // >= 70%
  isWarning: boolean;     // >= 85%
  isCritical: boolean;    // >= 100%
  windowSeconds: number;
  recentTimestamps: number[];
}

type TelemetryListener = (metrics: ReliabilityMetric[]) => void;
type RateLimitListener = (status: RateLimitStatus) => void;

class TelemetryService {
  private metrics: ReliabilityMetric[] = [];
  private listeners: Set<TelemetryListener> = new Set();
  private rateLimitListeners: Set<RateLimitListener> = new Set();
  private readonly STORAGE_KEY = 'dwi_telemetry_metrics';

  constructor() {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(this.STORAGE_KEY);
      if (saved) {
        try {
          this.metrics = JSON.parse(saved);
        } catch (e) {
          console.error("Failed to parse saved telemetry", e);
        }
      }

      // Periodically evaluate rate limit decay every 2 seconds
      setInterval(() => {
        this.notifyRateLimit();
      }, 2000);
    }
  }

  logMetric(metric: ReliabilityMetric) {
    const metricWithTime = {
      ...metric,
      timestamp: metric.timestamp || Date.now()
    };
    this.metrics = [metricWithTime, ...this.metrics].slice(0, 100);
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.metrics));
    }
    this.notify();
    this.notifyRateLimit();
  }

  clearMetrics() {
    this.metrics = [];
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.STORAGE_KEY);
    }
    this.notify();
    this.notifyRateLimit();
  }

  getMetrics(): ReliabilityMetric[] {
    return [...this.metrics];
  }

  getRateLimitStatus(customMaxRPM?: number): RateLimitStatus {
    const maxRPM = customMaxRPM || GEMINI_MAX_REQUESTS_PER_MINUTE;
    const now = Date.now();
    const oneMinuteAgo = now - 60000;

    const recentRequests = this.metrics
      .filter(m => (m.timestamp || now) >= oneMinuteAgo)
      .map(m => m.timestamp || now);

    const currentRPM = recentRequests.length;
    const percentUsed = Math.round((currentRPM / maxRPM) * 100);

    return {
      currentRPM,
      maxRPM,
      percentUsed,
      isApproaching: percentUsed >= 70,
      isWarning: percentUsed >= 85,
      isCritical: percentUsed >= 100,
      windowSeconds: 60,
      recentTimestamps: recentRequests
    };
  }

  subscribe(listener: TelemetryListener) {
    this.listeners.add(listener);
    listener(this.getMetrics());
    return () => this.listeners.delete(listener);
  }

  subscribeRateLimit(listener: RateLimitListener) {
    this.rateLimitListeners.add(listener);
    listener(this.getRateLimitStatus());
    return () => this.rateLimitListeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.getMetrics()));
  }

  private notifyRateLimit() {
    const status = this.getRateLimitStatus();
    this.rateLimitListeners.forEach(listener => listener(status));
  }

  logRateLimitHit() {
    // Inject artificial critical metrics to trigger UI alerts across the app
    for (let i = 0; i < GEMINI_MAX_REQUESTS_PER_MINUTE; i++) {
      this.metrics.push({
        timestamp: Date.now(),
        model_id: 'quota-exceeded-placeholder',
        latency_ms: 0,
        token_efficiency: 0,
        failure_rate: 1,
        retry_count: 0
      });
    }
    this.notify();
    this.notifyRateLimit();
  }
}

export const telemetryService = new TelemetryService();

