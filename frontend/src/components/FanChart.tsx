// src/components/FanChart.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { ForecastPoint } from "@/lib/api";

export default function FanChart({ rows, title, capacity: capacityValue }:{ rows: ForecastPoint[]; title:string; capacity?: number }) {
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
    title: { 
      text: title, 
      subtext: isEmpty ? "No forecast data available" : !hasData ? "All forecast values are zero" : "",
      textStyle: { 
        color: "#f1f5f9", 
        fontSize: 14,
        fontWeight: 'bold'
      },
      subtextStyle: { 
        color: "#cbd5e1", 
        fontSize: 10
      }
    },
    grid: { left: 48, right: 20, top: 36, bottom: 32 },
    tooltip: isEmpty ? { show: false } : {
      trigger: "axis",
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f9fafb',
        fontSize: 12
      },
      formatter: (params: any) => {
        const timeStr = params[0]?.axisValue || '';
        let result = `<strong>Time: ${timeStr}</strong><br/>`;
        
        params.forEach((param: any) => {
          if (param.seriesName === "Predicted" && param.value !== null) {
            result += `Predicted: <span style="color: #3b82f6">${param.value}</span><br/>`;
          }
          if (param.seriesName === "Capacity" && param.value !== null) {
            result += `Capacity: <span style="color: #f59e0b">${param.value}</span><br/>`;
          }
          if (param.seriesName === "Overload" && param.value > 0) {
            result += `<span style="color: #ef4444">⚠️ Overload: ${param.value}</span><br/>`;
          }
        });
        return result;
      },
    },
    xAxis: { 
      type: "category", 
      data: x, 
      axisLine: { lineStyle: { color: "#64748b", width: 2 } }, 
      axisLabel: { 
        color: isEmpty ? "#64748b" : "#e2e8f0", 
        fontSize: 11, 
        fontWeight: '500' 
      } 
    },
    yAxis: { 
      type: "value", 
      min: 0, 
      axisLine: { lineStyle: { color: "#64748b", width: 2 } }, 
      splitLine: { lineStyle: { color: "#475569", width: 1 } }, 
      axisLabel: { 
        color: isEmpty ? "#64748b" : "#e2e8f0", 
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
            if (isEmpty) return '#374151';
            const value = params.value;
            const cap = capacity[params.dataIndex];
            return value > cap ? "#dc2626" : "#3b82f6"; // Red for overload, blue for normal
          },
          opacity: isEmpty ? 0.3 : 0.8,
          borderColor: '#1e293b',
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
          color: "#ef4444",
          opacity: isEmpty ? 0 : 0.9,
          borderColor: '#dc2626',
          borderWidth: 2,
          shadowBlur: 4,
          shadowColor: '#ef444440'
        },
        z: 3,
        silent: isEmpty
      },
      // main forecast line
      { name: "Predicted", type: "line", data: y, symbol: "circle", symbolSize: 6, smooth: true, lineStyle:{width:3, color: isEmpty ? "#64748b" : "#60a5fa"}, itemStyle:{opacity: isEmpty ? 0.3 : 0.9}, z:4,
        markPoint: isEmpty ? undefined : { data: [{ name: "Peak", xAxis: x[peakIdx], yAxis: y[peakIdx], value: Math.round(y[peakIdx]) }], label:{color:"#fff"} },
        silent: isEmpty
      },
      { name: "Capacity", type: "line", data: capacity, symbol: "none", lineStyle: { type: "dashed", color: isEmpty ? "#64748b" : "#f59e0b", width: 3 }, z: 1, silent: isEmpty },
    ]
  };

  return (
    <div className="card relative">
      <h3>{title}</h3>
      <ReactECharts option={option} style={{ height: 460 }} />
      {isEmpty && (
        <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
            <div className="text-slate-200 text-sm text-center font-medium">
              No forecast data available
            </div>
            <div className="text-slate-400 text-xs mt-1 text-center">
              Check time range selection
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
