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
    series: [{
      type: "sunburst",
      radius: [20, "85%"], // Add inner radius for better center visibility
      label: { 
        rotate: "radial", 
        color: isEmpty ? "#64748b" : "#ffffff",
        fontSize: isEmpty ? 10 : 13,
        fontWeight: "bold",
        // Add text stroke for better contrast
        textBorderColor: "#000000",
        textBorderWidth: 1,
        distance: 5
      },
      itemStyle: { 
        borderColor: "#0f172a", // Darker border for better contrast
        borderWidth: 2,
        opacity: isEmpty ? 0.3 : 0.9,
        // Add shadow for depth
        shadowBlur: 3,
        shadowColor: "rgba(0, 0, 0, 0.3)"
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: "rgba(0, 0, 0, 0.5)"
        },
        label: {
          fontSize: 14,
          fontWeight: "bold"
        }
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
    <div className="h-full flex flex-col">
      <h3 className="card-header">Operations Breakdown</h3>
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
          <div className="bg-dp-card-dark/90 backdrop-blur-sm rounded-lg p-4 border border-white/20">
            <div className="theme-card-text text-sm text-center font-medium">
              No composition data available
            </div>
            <div className="theme-card-text-secondary text-xs mt-1 text-center">
              Adjust time range or filters
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
