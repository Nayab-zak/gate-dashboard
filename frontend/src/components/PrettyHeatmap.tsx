// src/components/PrettyHeatmap.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "./ThemeProvider";

export default function PrettyHeatmap({ cells }:{ cells:{terminal:string; hour:number; pred:number}[] }) {
  const { theme } = useTheme();
  
  // Theme-aware colors
  const colors = {
    axisText: theme === 'light' ? '#002F6C' : '#e2e8f0',
    axisLine: theme === 'light' ? '#002F6C' : '#64748b',
    visualMapText: theme === 'light' ? '#002F6C' : '#e2e8f0',
    tooltipBg: theme === 'light' ? '#FFFFFF' : '#1f2937',
    tooltipBorder: theme === 'light' ? '#002F6C20' : '#374151',
    heatmapBorder: theme === 'light' ? '#002F6C20' : '#1e293b'
  };
  // Check for empty data
  const isEmpty = !cells || cells.length === 0;
  const hasData = !isEmpty && cells.some(c => c.pred > 0);
  
  let terminals: string[];
  let hours: number[];
  let data: number[][];
  let vmax: number;
  
  if (isEmpty) {
    // Create empty skeleton data
    terminals = ["T1", "T2", "T3", "T4"];
    hours = [0, 6, 12, 18];
    data = [];
    vmax = 1;
  } else {
    terminals = Array.from(new Set(cells.map(c=>c.terminal))).sort();
    hours = Array.from(new Set(cells.map(c=>c.hour))).sort((a,b)=>a-b);
    data = cells.map(c => [hours.indexOf(c.hour), terminals.indexOf(c.terminal), Math.round(c.pred)]);
    vmax = Math.max(1, ...cells.map(c=>c.pred));
  }

  const option = {
    backgroundColor: 'transparent',
    grid: { left: 110, right: 20, top: 20, bottom: 50 },
    xAxis: { 
      type: "category", 
      data: hours.map(h=>`${String(h).padStart(2,"0")}`), 
      axisLabel: { 
        color: colors.axisText,
        fontSize: 11,
        fontWeight: '500'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: colors.axisLine
        }
      }
    },
    yAxis: { 
      type: "category", 
      data: terminals, 
      axisLabel: { 
        color: colors.axisText,
        fontSize: 11,
        fontWeight: '500'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: colors.axisLine
        }
      }
    },
    visualMap: {
      min: 0, max: vmax, calculable: true, orient: "horizontal", left: "center", bottom: 10,
      inRange: { color: isEmpty ? ["#374151", "#374151"] : ["#0f172a", "#1e3a8a", "#2563eb", "#38bdf8", "#10b981"] },
      textStyle: { 
        color: colors.visualMapText,
        fontSize: 11,
        fontWeight: '500'
      },
      show: !isEmpty
    },
    series: [{ 
      type: "heatmap", 
      data, 
      label: { show: false }, 
      itemStyle: { 
        borderRadius: 4,
        borderColor: '#1e293b',
        borderWidth: 1,
        opacity: isEmpty ? 0.3 : 1
      },
      silent: isEmpty
    }],
    tooltip: isEmpty ? { show: false } : { 
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: theme === 'light' ? '#002F6C' : '#f9fafb',
        fontSize: 12
      },
      formatter: (p:any)=> {
        const terminal = terminals[p.value[1]];
        const hour = hours[p.value[0]].toString().padStart(2,"0");
        const value = p.value[2];
        return `<strong>${terminal}</strong><br/>Time: <span style="color: #60a5fa">${hour}:00</span><br/>Volume: <span style="color: #34d399">${value}</span>`;
      }
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <h3 className="card-header">Peak Activity Times by Terminal</h3>
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
            <div className="text-theme-text text-sm text-center font-medium">
              No terminal activity data
            </div>
            <div className="text-theme-text-secondary text-xs mt-1 text-center">
              Adjust time range or filters
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
