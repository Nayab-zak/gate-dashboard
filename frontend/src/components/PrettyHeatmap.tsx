// src/components/PrettyHeatmap.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

export default function PrettyHeatmap({ cells }:{ cells:{terminal:string; hour:number; pred:number}[] }) {
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
    title: { 
      text: "Terminal × Hour (window total)", 
      subtext: isEmpty ? "No heatmap data available" : hasData ? "" : "All values are zero",
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
    grid: { left: 110, right: 20, top: 36, bottom: 50 },
    xAxis: { 
      type: "category", 
      data: hours.map(h=>`${String(h).padStart(2,"0")}`), 
      axisLabel: { 
        color: isEmpty ? "#64748b" : "#e2e8f0",
        fontSize: 11,
        fontWeight: '500'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#64748b"
        }
      }
    },
    yAxis: { 
      type: "category", 
      data: terminals, 
      axisLabel: { 
        color: isEmpty ? "#64748b" : "#e2e8f0",
        fontSize: 11,
        fontWeight: '500'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#64748b"
        }
      }
    },
    visualMap: {
      min: 0, max: vmax, calculable: true, orient: "horizontal", left: "center", bottom: 10,
      inRange: { color: isEmpty ? ["#374151", "#374151"] : ["#0f172a", "#1e3a8a", "#2563eb", "#38bdf8", "#fbbf24"] },
      textStyle: { 
        color: "#e2e8f0",
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
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f9fafb',
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
    <div className="card relative">
      <h3>Hot hours by terminal</h3>
      <ReactECharts option={option} style={{height: 420}} />
      {isEmpty && (
        <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
            <div className="text-slate-200 text-sm text-center font-medium">
              No terminal activity data
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
