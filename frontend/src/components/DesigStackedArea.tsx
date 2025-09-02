// src/components/DesigStackedArea.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "./ThemeProvider";

export default function DesigStackedArea({ points }:{ points:{date:string; hour:number; desig:string; pred:number}[] }) {
  const { theme } = useTheme();
  
  // Debug logging
  console.log("=== DesigStackedArea Debug ===");
  console.log("Received points:", points);
  console.log("Points length:", points.length);
  
  // Theme-aware colors
  const colors = {
    axisText: theme === 'light' ? '#002F6C' : '#ffffff',
    legendText: theme === 'light' ? '#002F6C' : '#ffffff',
    gridLines: '#B3B3B3',
    tooltipBg: theme === 'light' ? '#FFFFFF' : '#0E2F51',
    tooltipBorder: theme === 'light' ? '#002F6C20' : '#ffffff20',
    tooltipText: theme === 'light' ? '#002F6C' : '#ffffff'
  };
  // Check for empty data
  const isEmpty = !points || points.length === 0;
  const hasData = !isEmpty && points.some(p => p.pred > 0);
  
  let hours: number[];
  let desigs: string[];
  let series: any[];
  
  if (isEmpty) {
    // Create empty skeleton data
    hours = [0, 6, 12, 18];
    desigs = ["EXP", "FULL", "EMPTY"];
    series = desigs.map(dg => ({
      name: dg, 
      type: "line", 
      stack: "total", 
      areaStyle: { opacity: 0.1 }, 
      symbol:"none",
      data: new Array(4).fill(0),
      lineStyle: { color: "#64748b" },
      itemStyle: { color: "#64748b" },
      silent: true
    }));
  } else {
    hours = Array.from(new Set(points.map(p=>p.hour))).sort((a,b)=>a-b);
    desigs = Array.from(new Set(points.map(p=>p.desig))).sort();
    
    console.log("Processed hours:", hours);
    console.log("Processed desigs:", desigs);
    
    series = desigs.map(dg => ({
      name: dg, type: "line", stack: "total", areaStyle: {}, symbol:"none",
      data: hours.map(h=> {
        const f = points.find(p=>p.hour===h && p.desig===dg);
        const value = f? Math.round(f.pred) : 0;
        console.log(`Hour ${h}, Desig ${dg}: ${value} (from point:`, f, ")");
        return value;
      }),
      lineStyle: { width: 2 },
      smooth: true
    }));
    
    console.log("Final series data:", series);
  }
  
  const option = {
    backgroundColor: 'transparent',
    grid: { left:48, right:20, top:40, bottom:32 }, // Increased top margin for legend
    tooltip: isEmpty ? { show: false } : { 
      trigger:"axis",
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: colors.tooltipText,
        fontSize: 12
      }
    },
    legend: { 
      orient: 'horizontal',
      top: 10,
      right: 20, // Position legend at top-right
      textStyle: { 
        color: colors.legendText,
        fontSize: 11
      }
    },
    xAxis: { 
      type:"category", 
      data: hours.map(h=>`${String(h).padStart(2,"0")}:00`),
      interval: Math.ceil(hours.length / 7) - 1, // Reduce to 6-8 ticks
      axisLabel: { 
        color: colors.axisText,
        fontSize: 11,
        fontWeight: '500'
      },
      axisLine: { lineStyle: { color: colors.gridLines, width: 2 } }
    },
    yAxis: { 
      type:"value", 
      min:0, 
      axisLabel: { 
        color: colors.axisText,
        fontSize: 10,
        fontWeight: '500'
      }, 
      splitLine: { lineStyle: { color: '#B3B3B3', width: 1, opacity: 0.3 } }, // Lightened gridlines
      axisLine: { lineStyle: { color: colors.gridLines, width: 2 } }
    },
    series
  };
  
  return (
    <div className="h-full flex flex-col">
      <h3 className="card-header">Gate Load Status Over Time</h3>
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
              No gate status data available
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
