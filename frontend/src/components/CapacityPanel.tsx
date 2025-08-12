"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { ForecastPoint } from "@/lib/api";

export default function CapacityPanel({ rows, capacity }:{rows: ForecastPoint[]; capacity: number}) {
  // Check for empty data
  const isEmpty = !rows || rows.length === 0;
  const hasData = !isEmpty && rows.some(r => (r.pred ?? 0) > 0);
  
  let x: string[];
  let pred: number[];
  let cap: number[];
  
  if (isEmpty) {
    // Create empty skeleton data
    x = ["00", "01", "02", "03", "04", "05", "06", "07"];
    pred = new Array(8).fill(0);
    cap = new Array(8).fill(capacity);
  } else {
    x = rows.map(r => new Date(r.ts).toLocaleTimeString([], {hour: "2-digit"}));
    pred = rows.map(r => r.pred ?? 0);
    cap = rows.map(_ => capacity);
  }

  const option = {
    backgroundColor: 'transparent',
    title: { 
      text: "Capacity vs Demand",
      subtext: isEmpty ? "No capacity data available" : !hasData ? "All demand values are zero" : "",
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
    tooltip: isEmpty ? { show: false } : { 
      trigger: "axis",
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f9fafb',
        fontSize: 12
      }
    },
    xAxis: { 
      type: "category", 
      data: x,
      axisLabel: { 
        color: isEmpty ? "#64748b" : "#e2e8f0",
        fontSize: 11,
        fontWeight: '500'
      },
      axisLine: { lineStyle: { color: "#64748b", width: 2 } }
    },
    yAxis: { 
      type: "value",
      min: 0,
      axisLabel: { 
        color: isEmpty ? "#64748b" : "#e2e8f0",
        fontSize: 10,
        fontWeight: '500'
      },
      axisLine: { lineStyle: { color: "#64748b", width: 2 } },
      splitLine: { lineStyle: { color: "#475569", width: 1 } }
    },
    series: [
      { 
        type: "bar", 
        data: pred, 
        name: "Predicted",
        itemStyle: {
          color: function(params: any) {
            if (isEmpty) return '#374151';
            return params.value > capacity ? "#ef4444" : "#3b82f6";
          },
          opacity: isEmpty ? 0.3 : 1
        },
        silent: isEmpty
      },
      { 
        type: "line", 
        data: cap, 
        name: "Capacity", 
        symbol: "none",
        lineStyle: { 
          color: isEmpty ? "#64748b" : "#fbbf24", 
          width: 2,
          type: "dashed"
        },
        silent: isEmpty
      }
    ]
  };
  
  return (
    <div className="bg-slate-800 rounded-lg p-4 text-slate-100 relative">
      <ReactECharts option={option} style={{ height: 440 }} />
      {isEmpty && (
        <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-slate-700/90 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
            <div className="text-slate-200 text-sm text-center font-medium">
              No capacity data available
            </div>
            <div className="text-slate-400 text-xs mt-1 text-center">
              Check forecast data source
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
