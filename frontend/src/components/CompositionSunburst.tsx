// src/components/CompositionSunburst.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

type Node = { name: string; value?: number; children?: Node[] };

export default function CompositionSunburst({ data }:{ data: Node[] }) {
  // Check for empty data
  const isEmpty = !data || data.length === 0;
  const hasData = !isEmpty && data.some(d => (d.value ?? 0) > 0 || (d.children && d.children.some(c => (c.value ?? 0) > 0)));
  
  let sunburstData: Node[];
  
  if (isEmpty) {
    // Create empty skeleton data
    sunburstData = [
      { 
        name: "No Data", 
        value: 1, 
        children: [
          { name: "Empty", value: 1 }
        ]
      }
    ];
  } else {
    sunburstData = data;
  }
  
  const option = {
    backgroundColor: 'transparent',
    title: { 
      text: "Composition (Terminal → MoveType → Desig)", 
      subtext: isEmpty ? "No composition data available" : !hasData ? "All values are zero" : "",
      left: "center", 
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
    series: [{
      type: "sunburst",
      radius: [0, "85%"],
      label: { 
        rotate: "radial", 
        color: isEmpty ? "#64748b" : "#e2e8f0",
        fontSize: isEmpty ? 10 : 12
      },
      itemStyle: { 
        borderColor: "#0b0f1a", 
        borderWidth: 2,
        opacity: isEmpty ? 0.3 : 1
      },
      data: sunburstData,
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
      formatter: (p:any) => {
        const path = p.treePathInfo.map((x:any)=>x.name).slice(1).join(" / ");
        const value = Math.round(p.value);
        return `<strong>${path}</strong><br/>Volume: <span style="color: #60a5fa">${value}</span>`;
      }
    }
  };
  
  return (
    <div className="card relative">
      <h3>Composition</h3>
      <ReactECharts option={option} style={{height: 360}} />
      {isEmpty && (
        <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
            <div className="text-slate-200 text-sm text-center font-medium">
              No composition data available
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
