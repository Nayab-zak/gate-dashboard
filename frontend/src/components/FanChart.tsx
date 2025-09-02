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

  const option = {
    backgroundColor: "transparent",
    grid: { 
      left: 60, 
      right: 20, 
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
            result += `Predicted: <span style="color: #0B4FA7">${param.value}</span><br/>`;
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
      splitLine: { lineStyle: { color: colors.gridLines, width: 1, opacity: 0.3 } }, 
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
        markPoint: isEmpty ? undefined : { data: [{ name: "Peak", xAxis: x[peakIdx], yAxis: y[peakIdx], value: Math.round(y[peakIdx]) }], label:{color: colors.text} },
        silent: isEmpty
      },
      { name: "Capacity", type: "line", data: capacity, symbol: "none", lineStyle: { type: "dashed", color: isEmpty ? colors.gridLines : colors.capacity, width: 3 }, z: 1, silent: isEmpty },
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
