// src/components/MoveTypeTrend.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "./ThemeProvider";

export default function MoveTypeTrend({ points }:{ points:{date:string; hour:number; move_type:string; pred:number}[] }) {
  const { theme } = useTheme();
  
  // Theme-aware colors
  const colors = {
    axisText: theme === 'light' ? '#002F6C' : '#e2e8f0',
    legendText: theme === 'light' ? '#002F6C' : '#e2e8f0',
    gridLines: theme === 'light' ? '#002F6C30' : '#475569',
    axisLine: theme === 'light' ? '#002F6C' : '#64748b',
    tooltipBg: theme === 'light' ? '#FFFFFF' : '#1f2937',
    tooltipBorder: theme === 'light' ? '#002F6C20' : '#374151',
    tooltipText: theme === 'light' ? '#002F6C' : '#f9fafb'
  };
  // Check for empty data
  const isEmpty = !points || points.length === 0;
  const hasData = !isEmpty && points.some(p => p.pred > 0);
  
  let hours: number[];
  let inData: number[];
  let outData: number[];
  
  if (isEmpty) {
    // Create empty skeleton data
    hours = [0, 6, 12, 18];
    inData = new Array(4).fill(0);
    outData = new Array(4).fill(0);
  } else {
    hours = Array.from(new Set(points.map(p=>p.hour))).sort((a,b)=>a-b);
    const by = (mt:string)=> hours.map(h=> {
      const f = points.find(p=>p.hour===h && p.move_type===mt);
      return f? Math.round(f.pred) : 0;
    });
    inData = by("IN");
    outData = by("OUT");
  }

  const option = {
    backgroundColor: 'transparent',
    grid: { left:48, right:20, top:20, bottom:32 },
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
      type:"category", 
      data: hours.map(h=>`${String(h).padStart(2,"0")}:00`), 
      axisLabel: { 
        color: colors.axisText,
        fontSize: 11,
        fontWeight: '500'
      },
      axisLine: { lineStyle: { color: colors.axisLine, width: 2 } }
    },
    yAxis: { 
      type:"value", 
      min:0, 
      axisLabel: { 
        color: colors.axisText,
        fontSize: 10,
        fontWeight: '500'
      }, 
      splitLine: { lineStyle: { color: colors.gridLines, width: 1 } },
      axisLine: { lineStyle: { color: colors.axisLine, width: 2 } }
    },
    legend: { 
      textStyle: { 
        color: colors.legendText,
        fontSize: 11
      }
    },
    series: [
      { 
        name:"IN",  
        type:"line", 
        data: inData,  
        smooth:true, 
        symbol:"circle", 
        symbolSize:6,
        lineStyle: { 
          color: isEmpty ? "#64748b" : "#3b82f6",
          width: 2
        },
        itemStyle: {
          color: isEmpty ? "#64748b" : "#3b82f6"
        },
        silent: isEmpty
      },
      { 
        name:"OUT", 
        type:"line", 
        data: outData, 
        smooth:true, 
        symbol:"circle", 
        symbolSize:6,
        lineStyle: { 
          color: isEmpty ? "#64748b" : "#10b981",
          width: 2
        },
        itemStyle: {
          color: isEmpty ? "#64748b" : "#10b981"
        },
        silent: isEmpty
      },
    ]
  };
  
  return (
    <div className="card relative">
      <h3>Container Flow Trends</h3>
      <ReactECharts option={option} style={{height: 360}} />
      {isEmpty && (
        <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-theme-card/90 backdrop-blur-sm rounded-lg p-4 border border-theme-border">
            <div className="text-theme-text text-sm text-center font-medium">
              No move type trend data
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
