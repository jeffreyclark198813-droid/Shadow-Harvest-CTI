import { ReliabilityMetric } from '../types/atomic';

type TelemetryListener = (metrics: ReliabilityMetric[]) => void;

class TelemetryService {
  private metrics: ReliabilityMetric[] = [];
  private listeners: Set<TelemetryListener> = new Set();

  logMetric(metric: ReliabilityMetric) {
    this.metrics = [metric, ...this.metrics].slice(0, 50); // Keep last 50
    this.notify();
  }

  getMetrics(): ReliabilityMetric[] {
    return [...this.metrics];
  }

  subscribe(listener: TelemetryListener) {
    this.listeners.add(listener);
    listener(this.getMetrics());
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.getMetrics()));
  }
}

export const telemetryService = new TelemetryService();
