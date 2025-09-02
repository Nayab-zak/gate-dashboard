/**
 * Frontend Data Guardrails and Utilities
 * 
 * Ensures data consistency, handles missing data, prevents divide-by-zero errors,
 * and maintains consistent naming conventions across the frontend.
 */

export interface HourlyDataPoint {
  date: string;
  hour: number;
  pred: number;
  move_type?: string;
  desig?: string;
}

export interface ZeroFilledHour {
  ts: string;
  pred: number;
  hour: number;
}

export interface RiskLevel {
  level: "High Risk" | "Warning" | "Safe";
  desc: string;
  color: "red" | "orange" | "green";
}

export interface FlowBalance {
  inPercent: number;
  outPercent: number;
  totalFlow: number;
  inFlow: number;
  outFlow: number;
}

/**
 * Zero-fill missing hours in time series data
 * Creates hourly bins and ensures all hours have data points (defaulting to 0)
 */
export function zeroFillHours(
  startTs: string, 
  hours: number, 
  data: HourlyDataPoint[]
): ZeroFilledHour[] {
  // Create lookup by hour for fast access
  const dataByHour = data.reduce((acc, point) => {
    const key = `${point.date}-${point.hour}`;
    acc[key] = (acc[key] || 0) + point.pred;
    return acc;
  }, {} as Record<string, number>);

  const out: ZeroFilledHour[] = [];
  const startDate = new Date(startTs);
  
  for (let i = 0; i < hours; i++) {
    const currentTime = new Date(startDate.getTime() + i * 3600 * 1000);
    const dateStr = currentTime.toISOString().split('T')[0];
    const hour = currentTime.getHours();
    const key = `${dateStr}-${hour}`;
    
    out.push({
      ts: currentTime.toISOString(),
      pred: dataByHour[key] ?? 0,
      hour
    });
  }
  
  return out;
}

/**
 * Calculate flow balance with divide-by-zero protection
 */
export function calculateFlowBalance(data: Array<{ move_type: string; pred: number }>): FlowBalance {
  const flowTotals = data.reduce((acc, point) => {
    const moveType = point.move_type.toLowerCase();
    acc[moveType] = (acc[moveType] || 0) + point.pred;
    return acc;
  }, {} as Record<string, number>);
  
  const inFlow = flowTotals['in'] || 0;
  const outFlow = flowTotals['out'] || 0;
  const totalFlow = inFlow + outFlow;
  
  // Divide-by-zero protection
  const inPercent = totalFlow > 0 ? Math.round((inFlow / totalFlow) * 100) : 0;
  const outPercent = totalFlow > 0 ? Math.round((outFlow / totalFlow) * 100) : 0;
  
  return {
    inPercent,
    outPercent,
    totalFlow,
    inFlow,
    outFlow
  };
}

/**
 * Determine risk level based on capacity utilization and overload hours
 */
export function calculateRiskLevel(overloadHours: number, maxUtilization: number): RiskLevel {
  if (maxUtilization >= 1.2 || overloadHours >= 3) {
    return { 
      level: "High Risk", 
      desc: "Immediate action needed", 
      color: "red" 
    };
  }
  
  if (maxUtilization >= 1.0 || overloadHours >= 1) {
    return { 
      level: "Warning", 
      desc: "Monitor closely", 
      color: "orange" 
    };
  }
  
  return { 
    level: "Safe", 
    desc: "All systems normal", 
    color: "green" 
  };
}

/**
 * Safely calculate peak hour volume with validation
 */
export function calculatePeakHour(data: Array<{ pred: number }>): number {
  if (!data || data.length === 0) return 0;
  
  return data.reduce((max, point) => {
    const pred = typeof point.pred === 'number' ? point.pred : 0;
    return Math.max(max, pred);
  }, 0);
}

/**
 * Safely calculate total volume with validation
 */
export function calculateTotalVolume(data: Array<{ pred: number }>): number {
  if (!data || data.length === 0) return 0;
  
  return data.reduce((sum, point) => {
    const pred = typeof point.pred === 'number' ? point.pred : 0;
    return sum + pred;
  }, 0);
}

/**
 * Calculate capacity utilization metrics
 */
export function calculateCapacityMetrics(
  data: Array<{ pred: number }>, 
  capacity: number
): {
  overloadHours: number;
  maxUtilization: number;
  avgUtilization: number;
} {
  if (!data || data.length === 0 || capacity <= 0) {
    return { overloadHours: 0, maxUtilization: 0, avgUtilization: 0 };
  }
  
  let overloadHours = 0;
  let maxUtilization = 0;
  let totalUtilization = 0;
  
  data.forEach(point => {
    const pred = typeof point.pred === 'number' ? point.pred : 0;
    const utilization = pred / capacity;
    
    if (pred > capacity) {
      overloadHours++;
    }
    
    maxUtilization = Math.max(maxUtilization, utilization);
    totalUtilization += utilization;
  });
  
  const avgUtilization = totalUtilization / data.length;
  
  return {
    overloadHours,
    maxUtilization: Math.round(maxUtilization * 100) / 100, // Round to 2 decimal places
    avgUtilization: Math.round(avgUtilization * 100) / 100
  };
}

/**
 * Validate and normalize API response data
 */
export function validateApiData<T extends { pred?: number }>(data: T[]): T[] {
  if (!Array.isArray(data)) {
    console.warn('Invalid API data: expected array, got:', typeof data);
    return [];
  }
  
  return data.map(item => ({
    ...item,
    pred: typeof item.pred === 'number' && item.pred >= 0 ? item.pred : 0
  }));
}

/**
 * Format numbers consistently across the application
 */
export function formatNumber(value: number, decimals: number = 1): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0';
  }
  
  return value.toFixed(decimals);
}

/**
 * Format percentage with divide-by-zero protection
 */
export function formatPercentage(numerator: number, denominator: number): string {
  if (denominator === 0 || typeof numerator !== 'number' || typeof denominator !== 'number') {
    return '0%';
  }
  
  const percentage = (numerator / denominator) * 100;
  return `${Math.round(percentage)}%`;
}

/**
 * Create tooltip text for volume breakdown
 */
export function createVolumeTooltip(totalIn: number, totalOut: number, netFlow: number): string {
  return `IN: ${formatNumber(totalIn, 0)} | OUT: ${formatNumber(totalOut, 0)} | Net: ${netFlow >= 0 ? '+' : ''}${formatNumber(netFlow, 0)}`;
}

/**
 * Generate time window description
 */
export function getTimeWindowDescription(windowHours: number): string {
  if (windowHours === 8) return '8h';
  if (windowHours === 24) return '24h';
  if (windowHours < 24) return `${windowHours}h`;
  
  const days = Math.floor(windowHours / 24);
  const remainingHours = windowHours % 24;
  
  if (remainingHours === 0) {
    return `${days}d`;
  }
  
  return `${days}d ${remainingHours}h`;
}
