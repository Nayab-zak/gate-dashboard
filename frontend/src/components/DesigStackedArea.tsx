// src/components/DesigStackedArea.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

export default function DesigStackedArea({ points }:{ points:{date:string; hour:number; desig:string; pred:number}[] }) {
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
    series = desigs.map(dg => ({
      name: dg, type: "line", stack: "total", areaStyle: {}, symbol:"none",
      data: hours.map(h=> {
        const f = points.find(p=>p.hour===h && p.desig===dg);
        return f? Math.round(f.pred) : 0;
      }),
      lineStyle: { width: 2 },
      smooth: true
    }));
  }
  
  const option = {
    backgroundColor: 'transparent',
    title: { 
      text: "Designation composition (hourly)", 
      subtext: isEmpty ? "No designation data available" : !hasData ? "All values are zero" : "",
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
    grid: { left:48, right:20, top:36, bottom:32 },
    tooltip: isEmpty ? { show: false } : { 
      trigger:"axis",
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f9fafb',
        fontSize: 12
      }
    },
    legend: { 
      textStyle: { 
        color: isEmpty ? "#64748b" : "#e2e8f0",
        fontSize: 11
      }
    },
    xAxis: { 
      type:"category", 
      data: hours.map(h=>`${String(h).padStart(2,"0")}:00`), 
      axisLabel: { 
        color: isEmpty ? "#64748b" : "#e2e8f0",
        fontSize: 11,
        fontWeight: '500'
      },
      axisLine: { lineStyle: { color: "#64748b", width: 2 } }
    },
    yAxis: { 
      type:"value", 
      min:0, 
      axisLabel: { 
        color: isEmpty ? "#64748b" : "#e2e8f0",
        fontSize: 10,
        fontWeight: '500'
      }, 
      splitLine: { lineStyle: { color: "#475569", width: 1 } },
      axisLine: { lineStyle: { color: "#64748b", width: 2 } }
    },
    series
  };
  
  return (
    <div className="card relative">
      <h3>Desig over time</h3>
      <ReactECharts option={option} style={{height: 360}} />
      {isEmpty && (
        <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
            <div className="text-slate-200 text-sm text-center font-medium">
              No designation data available
            </div>
            <div className="text-slate-400 text-xs mt-1 text-center">
              Adjust time range or filters
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
