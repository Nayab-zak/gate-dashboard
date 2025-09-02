// src/components/CapacityPanel.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { ForecastPoint } from "@/lib/api";
import { useTheme } from "./ThemeProvider";

export default function CapacityPanel({ rows, capacity }:{rows: ForecastPoint[]; capacity: number}) {
  const { theme } = useTheme();
  
  // Theme-aware colors
  const colors = {
    axisText: theme === 'light' ? '#002F6C' : '#ffffff',
    gridLines: '#B3B3B3',
    tooltipBg: theme === 'light' ? '#FFFFFF' : '#0E2F51',
    tooltipBorder: theme === 'light' ? '#002F6C20' : '#ffffff20',
    tooltipText: theme === 'light' ? '#002F6C' : '#ffffff'
  };
  
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
    grid: { left: 48, right: 20, top: 20, bottom: 32 },
    tooltip: isEmpty ? { show: false } : { 
      trigger: "axis",
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: colors.tooltipText,
        fontSize: 12
      }
    },
    xAxis: { 
      type: "category", 
      data: x,
      axisLabel: { 
        color: colors.axisText,
        fontSize: 11,
        fontWeight: '500'
      },
      axisLine: { lineStyle: { color: colors.gridLines, width: 2 } }
    },
    yAxis: { 
      type: "value",
      min: 0,
      axisLabel: { 
        color: colors.axisText,
        fontSize: 10,
        fontWeight: '500'
      },
      axisLine: { lineStyle: { color: colors.gridLines, width: 2 } },
      splitLine: { lineStyle: { color: colors.gridLines, width: 1, opacity: 0.3 } }
    },
    series: [
      { 
        type: "bar", 
        data: pred, 
        name: "Predicted",
        itemStyle: {
          color: function(params: any) {
            if (isEmpty) return '#0E2F51';
            return params.value > capacity ? "#ED1C24" : "#0B4FA7";
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
          color: isEmpty ? "#B3B3B3" : "#00A859", 
          width: 2,
          type: "dashed"
        },
        silent: isEmpty
      }
    ]
  };
  
  return (
    <div className="card relative">
      <h3>Capacity vs Demand</h3>
      <ReactECharts option={option} style={{ height: 440 }} />
      {isEmpty && (
        <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-dp-card-dark/90 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="theme-card-text text-sm text-center font-medium">
              No capacity data available
            </div>
            <div className="theme-card-text-secondary text-xs mt-1 text-center">
              Check forecast data source
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
