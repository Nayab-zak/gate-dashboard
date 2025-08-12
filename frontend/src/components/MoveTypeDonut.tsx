// src/components/MoveTypeDonut.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

export default function MoveTypeDonut({ share }:{ share: Record<"IN"|"OUT", number> }) {
  // Check for empty data
  const isEmpty = !share || (share.IN === 0 && share.OUT === 0) || (!share.IN && !share.OUT);
  const total = (share?.IN || 0) + (share?.OUT || 0);
  
  let pieData: any[];
  
  if (isEmpty) {
    // Create empty skeleton data
    pieData = [
      { value: 1, name: "No Data", itemStyle: { color: '#374151', opacity: 0.3 } }
    ];
  } else {
    pieData = [
      { 
        value: share.IN || 0, 
        name: "IN",
        itemStyle: { color: '#3b82f6' }
      },
      { 
        value: share.OUT || 0, 
        name: "OUT",
        itemStyle: { color: '#f59e0b' }
      },
    ];
  }
  
  const option = {
    backgroundColor: 'transparent',
    title: { 
      text: "MoveType share", 
      subtext: isEmpty ? "No move type data" : "",
      left: "center", 
      top: 10, 
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
      trigger: "item",
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f9fafb',
        fontSize: 12
      },
      formatter: (params: any) => {
        return `<strong>${params.name}</strong><br/>Count: <span style="color: #60a5fa">${params.value}</span><br/>Share: <span style="color: #34d399">${params.percent}%</span>`;
      }
    },
    series: [{
      type: "pie", 
      radius: ["55%","80%"], 
      avoidLabelOverlap: false,
      label: { 
        color: isEmpty ? "#64748b" : "#e2e8f0", 
        formatter: isEmpty ? "" : "{b}: {d}%",
        fontSize: 11,
        fontWeight: '500'
      },
      data: pieData,
      silent: isEmpty
    }],
    graphic: total > 0 && !isEmpty ? [{
      type: "text", 
      left: "center", 
      top: "45%", 
      style: { 
        text: `${Math.round(total)}`, 
        fill: "#f1f5f9", 
        fontSize: 18, 
        fontWeight: 600 
      }
    }] : isEmpty ? [{
      type: "text", 
      left: "center", 
      top: "45%", 
      style: { 
        text: "No Data", 
        fill: "#64748b", 
        fontSize: 14, 
        fontWeight: 400 
      }
    }] : []
  };
  
  return (
    <div className="card relative">
      <h3>MoveType share</h3>
      <ReactECharts option={option} style={{height: 320}} />
      {isEmpty && (
        <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
            <div className="text-slate-200 text-sm text-center font-medium">
              No move type data available
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
