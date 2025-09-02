import React from "react";
import { Next8HResponse } from "@/lib/api";
import { 
  calculateFlowBalance, 
  calculateRiskLevel, 
  calculateCapacityMetrics,
  formatNumber,
  getTimeWindowDescription,
  createVolumeTooltip,
  validateApiData
} from "@/lib/dataUtils";

interface KpiStripProps {
  data: Next8HResponse;
  capacity: number;
  flowData?: Array<{ move_type: string; pred: number }>;
  totalVolumeData?: {
    total_volume: number;
    total_in: number;
    total_out: number;
    net_flow: number;
    window_hours: number;
  };
}

export default function KpiStrip({ data, capacity, flowData = [], totalVolumeData }: KpiStripProps) {
  // Validate and normalize input data
  const validatedHorizonData = validateApiData(data.horizon_hours || []);
  const validatedFlowData = validateApiData(flowData);
  
  // Use dedicated total volume data if available, otherwise fallback to current calculation
  const totalVolume = totalVolumeData?.total_volume ?? validatedHorizonData.reduce((s, x) => s + x.pred, 0);
  const totalIn = totalVolumeData?.total_in ?? 0;
  const totalOut = totalVolumeData?.total_out ?? 0;
  const netFlow = totalVolumeData?.net_flow ?? 0;
  const windowHours = totalVolumeData?.window_hours ?? 8;
  
  // Calculate metrics with guardrails
  const peak = validatedHorizonData.reduce((m, x) => Math.max(m, x.pred), 0);
  const capacityMetrics = calculateCapacityMetrics(validatedHorizonData, capacity);
  const flowBalance = calculateFlowBalance(validatedFlowData);
  const riskInfo = calculateRiskLevel(capacityMetrics.overloadHours, capacityMetrics.maxUtilization);
  
  // Create tooltip for total volume
  const volumeTooltip = totalVolumeData ? createVolumeTooltip(totalIn, totalOut, netFlow) : undefined;
  const timeWindowDesc = getTimeWindowDescription(windowHours);

  return (
    <div className="grid grid-cols-5 gap-6 mb-8">
      {/* Total Forecast Volume */}
      <div className="theme-card-kpi rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>Total Forecast Volume</div>
          <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" style={{ color: 'var(--theme-card-text, #002F6C)' }} fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
            </svg>
          </div>
        </div>
        <div className="text-4xl font-bold mb-2" style={{ color: 'var(--theme-card-text, #002F6C)' }} title={volumeTooltip}>
          {formatNumber(totalVolume, 0)}
        </div>
        <div className="text-sm" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>containers in {timeWindowDesc}</div>
      </div>

      {/* Peak Hour Volume */}
      <div className="theme-card-kpi rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>Peak Hour Volume</div>
          <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" style={{ color: 'var(--theme-card-text, #002F6C)' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd"/>
            </svg>
          </div>
        </div>
        <div className="text-4xl font-bold mb-2" style={{ color: 'var(--theme-card-text, #002F6C)' }}>{formatNumber(peak, 0)}</div>
        <div className="text-sm" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>max containers/hour</div>
      </div>

      {/* Current Flow Balance */}
      <div className="theme-card-kpi rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium uppercase tracking-wide" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>Current Flow Balance</div>
          <div className="w-10 h-10 bg-gray-200 dark:bg-white/10 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5" style={{ color: 'var(--theme-card-text, #002F6C)' }} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 10a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM6 12a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM6 15a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zM6 9a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1z" clipRule="evenodd"/>
            </svg>
          </div>
        </div>
        <div className="text-2xl font-bold mb-2" style={{ color: 'var(--theme-card-text, #002F6C)' }}>
          {flowBalance.inPercent}% In / {flowBalance.outPercent}% Out
        </div>
        <div className="text-sm" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>
          ({formatNumber(flowBalance.totalFlow, 0)} total containers)
        </div>
      </div>

      {/* Capacity Alerts */}
      <div className={`rounded-2xl p-8 shadow-lg border ${
        riskInfo.color === 'red' ? 'bg-dp-red border-red-400/30' :
        riskInfo.color === 'orange' ? 'bg-red-600 border-red-400/30' :
        'bg-dp-green border-green-400/30'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium text-white uppercase tracking-wide">Capacity Alerts</div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              {capacityMetrics.overloadHours > 0 ? (
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              ) : (
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
              )}
            </svg>
          </div>
        </div>
        <div className="flex items-baseline gap-1 mb-2">
          <span className="text-4xl font-bold text-white">{capacityMetrics.overloadHours}</span>
          <span className="text-2xl text-white/80">/{windowHours}</span>
        </div>
        <div className="text-sm text-white/80">hours over capacity</div>
      </div>

      {/* Capacity Risk Level */}
      <div className="theme-card-kpi rounded-2xl p-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm font-medium theme-text-secondary uppercase tracking-wide">Risk Level</div>
          <div className="flex gap-1">
            <div className={`w-3 h-3 rounded-full ${riskInfo.color === 'green' ? 'bg-dp-green' : 'bg-gray-300 dark:bg-white/20'}`}></div>
            <div className={`w-3 h-3 rounded-full ${riskInfo.color === 'orange' ? 'bg-red-500' : 'bg-gray-300 dark:bg-white/20'}`}></div>
            <div className={`w-3 h-3 rounded-full ${riskInfo.color === 'red' ? 'bg-dp-red' : 'bg-gray-300 dark:bg-white/20'}`}></div>
          </div>
        </div>
        <div className={`text-3xl font-bold mb-2 ${
          riskInfo.color === 'red' ? 'text-dp-red' :
          riskInfo.color === 'orange' ? 'text-red-400' :
          'text-dp-green'
        }`}>
          {riskInfo.level}
        </div>
        <div className="text-sm theme-text-secondary">
          {capacityMetrics.overloadHours === 0 ? 'All systems normal' : 
           capacityMetrics.overloadHours < 3 ? 'Monitor closely' : 
           'Immediate action needed'}
        </div>
      </div>
    </div>
  );
}
