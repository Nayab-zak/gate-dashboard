// src/components/FanChart.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { ForecastPoint } from "@/lib/api";
import { useTheme } from "./ThemeProvider";

export default function FanChart({ rows, title, capacity: capacityValue }:{ rows: ForecastPoint[]; title:string; capacity?: number }) {
  const { theme } = useTheme();
  
  // Theme-aware colors
  const colors = {
    text: theme === 'light' ? '#002F6C' : '#FFFFFF',
    textSecondary: theme === 'light' ? '#3A4757' : '#B3B3B3',
    gridLines: '#B3B3B3',
    tooltipBg: theme === 'light' ? '#FFFFFF' : '#0E2F51',
    tooltipBorder: theme === 'light' ? '#002F6C20' : '#ffffff20',
    forecastNormal: '#0B4FA7',
    forecastOverload: '#ED1C24',
    capacity: '#00A859',
    emptyState: theme === 'light' ? '#B3B3B3' : '#0E2F51'
  };

  // Check for empty data
  const isEmpty = !rows || rows.length === 0;
  const hasData = !isEmpty && rows.some(r => (r.pred ?? 0) > 0);
  
  let x: string[];
  let y: number[];
  let lower: (number | null)[];
  let upper: (number | null)[];
  let capacity: number[];
  let haveBand: boolean;
  let peakIdx: number;
  
  if (isEmpty) {
    // Create empty skeleton data
    x = ["00", "01", "02", "03", "04", "05", "06", "07"];
    y = new Array(8).fill(0);
    lower = new Array(8).fill(null);
    upper = new Array(8).fill(null);
    capacity = new Array(8).fill(capacityValue ?? 100);
    haveBand = false;
    peakIdx = 0;
  } else {
    x = rows.map(r => new Date(r.ts).toLocaleTimeString([], { hour: "2-digit" }));
    y = rows.map(r => r.pred ?? 0);
    lower = rows.map(r => (r.lower ?? null));
    upper = rows.map(r => (r.upper ?? null));
    capacity = rows.map(() => capacityValue ?? 100);
    haveBand = upper.some(v => v !== null) && lower.some(v => v !== null);
    peakIdx = y.reduce((m, v, i) => (v > y[m] ? i : m), 0);
  }

  // Create bars for all forecast values, not just overloads
  const forecastBars = y.map((v, i) => v);
  const overloadBars = y.map((v, i) => v > capacity[i] ? v : 0); // Show 0 instead of null for non-overloads

  // Detect spikes for outlier annotations
  const avgValue = y.reduce((sum, val) => sum + val, 0) / y.length;
  const spikeThreshold = avgValue * 2.5; // Consider values 2.5x average as spikes
  const spikePoints = y.map((value, index) => {
    if (value > spikeThreshold && value > 0) {
      return {
        coord: [index, value], // Use index instead of x[index] for proper alignment
        value: Math.round(value),
        itemStyle: { color: '#ED1C24' }
      };
    }
    return null;
  }).filter(point => point !== null);

  // Reduce X-axis ticks to 6-8 per chart
  const xAxisInterval = Math.ceil(x.length / 7); // Target ~7 ticks

  const option = {
    backgroundColor: "transparent",
    grid: { 
      left: 60, 
      right: 80, // Increased right margin for capacity label
      top: 20, 
      bottom: 40,
      containLabel: true
    },
    tooltip: isEmpty ? { show: false } : {
      trigger: "axis",
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: colors.text,
        fontSize: 12
      },
      formatter: (params: any) => {
        const timeStr = params[0]?.axisValue || '';
        let result = `<strong>Time: ${timeStr}</strong><br/>`;
        
        params.forEach((param: any) => {
          if (param.seriesName === "Predicted" && param.value !== null) {
            const isSpike = param.value > spikeThreshold;
            result += `Predicted: <span style="color: #0B4FA7">${param.value}</span>`;
            if (isSpike) {
              result += `<br/><span style="color: #ED1C24">🚨 Why spike? Potential causes:</span><br/>`;
              result += `<span style="color: #ED1C24">• Terminal capacity overload</span><br/>`;
              result += `<span style="color: #ED1C24">• Operational shift change</span><br/>`;
              result += `<span style="color: #ED1C24">• Weather/external factors</span>`;
            }
            result += `<br/>`;
          }
          if (param.seriesName === "Capacity" && param.value !== null) {
            result += `Capacity: <span style="color: #00A859">${param.value}</span><br/>`;
          }
          if (param.seriesName === "Overload" && param.value > 0) {
            result += `<span style="color: #ED1C24">⚠️ Overload: ${param.value}</span><br/>`;
          }
        });
        return result;
      },
    },
    xAxis: { 
      type: "category", 
      data: x,
      interval: xAxisInterval - 1, // Reduce tick density
      axisLine: { lineStyle: { color: colors.gridLines, width: 2 } }, 
      axisLabel: { 
        color: isEmpty ? colors.gridLines : colors.text, 
        fontSize: 11, 
        fontWeight: '500' 
      } 
    },
    yAxis: { 
      type: "value", 
      min: 0, 
      axisLine: { lineStyle: { color: colors.gridLines, width: 2 } }, 
      splitLine: { lineStyle: { color: '#B3B3B3', width: 1, opacity: 0.3 } }, // Lightened gridlines
      axisLabel: { 
        color: isEmpty ? colors.gridLines : colors.text, 
        fontSize: 10, 
        fontWeight: '500' 
      } 
    },
    series: [
      ...(haveBand ? [
        // shaded band between lower & upper
        { name: "Upper", type: "line", data: upper, symbol: "none", lineStyle:{width:0}, areaStyle:{opacity:0.15}, z:1 },
        { name: "Lower", type: "line", data: lower, symbol: "none", lineStyle:{width:0}, areaStyle:{opacity:0.15}, z:1 },
      ] : []),
      // forecast bars (main visualization)
      { 
        name: "Forecast", 
        type: "bar", 
        data: forecastBars, 
        barWidth: "60%",
        itemStyle: { 
          color: (params: any) => {
            if (isEmpty) return colors.emptyState;
            const value = params.value;
            const cap = capacity[params.dataIndex];
            return value > cap ? colors.forecastOverload : colors.forecastNormal;
          },
          opacity: isEmpty ? 0.3 : 0.8,
          borderColor: '#ffffff20',
          borderWidth: 1
        },
        z: 2,
        silent: isEmpty
      },
      // overload bars (highlighted on top)
      { 
        name: "Overload", 
        type: "bar", 
        data: overloadBars, 
        barWidth: "60%",
        barGap: "-100%", // Overlay on forecast bars
        itemStyle: { 
          color: colors.forecastOverload,
          opacity: isEmpty ? 0 : 0.9,
          borderColor: '#B3010F',
          borderWidth: 2,
          shadowBlur: 4,
          shadowColor: '#ED1C2440'
        },
        z: 3,
        silent: isEmpty
      },
      // main forecast line
      { name: "Predicted", type: "line", data: y, symbol: "circle", symbolSize: 6, smooth: true, lineStyle:{width:3, color: isEmpty ? colors.gridLines : colors.forecastNormal}, itemStyle:{opacity: isEmpty ? 0.3 : 0.9}, z:4,
        markPoint: isEmpty ? undefined : { 
          data: [
            { name: "Peak", coord: [peakIdx, y[peakIdx]], value: Math.round(y[peakIdx]), label:{color: colors.text} },
            ...spikePoints.map(spike => ({
              name: "Spike",
              coord: spike.coord,
              value: spike.value,
              symbol: 'pin',
              symbolSize: 20,
              itemStyle: { color: '#ED1C24', borderColor: '#B3010F', borderWidth: 2 },
              label: { show: true, position: 'top', color: '#ED1C24', fontWeight: 'bold' }
            }))
          ]
        },
        silent: isEmpty
      },
      { name: "Capacity", type: "line", data: capacity, symbol: "none", lineStyle: { type: "dashed", color: isEmpty ? colors.gridLines : colors.capacity, width: 2 }, z: 1, silent: isEmpty,
        markLine: {
          symbol: 'none',
          label: {
            show: true,
            position: 'end',
            formatter: 'Capacity',
            color: colors.capacity,
            fontSize: 12,
            fontWeight: 'bold',
            backgroundColor: 'transparent',
            padding: [4, 8]
          },
          lineStyle: {
            type: 'dashed',
            color: colors.capacity,
            width: 2
          },
          data: [{
            yAxis: capacity[0],
            x: '95%' // Position label at far right
          }]
        }
      },
    ]
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="card-header" style={{ color: 'var(--theme-card-text, #002F6C)' }}>{title}</h3>
      <div className="card-body flex-1">
        <ReactECharts 
          option={option} 
          style={{ 
            width: '100%', 
            height: '100%',
            minHeight: '300px'
          }} 
          opts={{ renderer: 'canvas' }}
        />
      </div>
      {isEmpty && (
        <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-theme-card/90 backdrop-blur-sm rounded-lg p-4 border border-theme-border">
            <div className="text-sm text-center font-medium" style={{ color: 'var(--theme-card-text, #002F6C)' }}>
              No forecast data available
            </div>
            <div className="text-xs mt-1 text-center" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>
              Check time range selection
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
