export class MetricsService {
  private metrics: Map<string, number>;

  constructor() {
    this.metrics = new Map();
  }

  public increment(metric: string, value: number = 1): void {
    const currentValue = this.metrics.get(metric) || 0;
    this.metrics.set(metric, currentValue + value);
  }

  public getValue(metric: string): number {
    return this.metrics.get(metric) || 0;
  }

  public reset(metric: string): void {
    this.metrics.delete(metric);
  }

  public getAllMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }

  public gauge(metric: string, value: number): void {
    this.metrics.set(metric, value);
  }
} 