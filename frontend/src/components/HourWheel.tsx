// src/components/HourWheel.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

export default function HourWheel({ hourly }:{ hourly: { hour:number; pred:number }[] }) {
  // Debug: log the input data
  console.log("HourWheel data:", hourly);
  
  // Always render the chart container, but show different content based on data availability
  let hours: number[];
  let values: number[];
  let isEmpty = false;
  
  if (!hourly || hourly.length === 0) {
    console.log("HourWheel: No data, showing empty state");
    isEmpty = true;
    // Create empty 24-hour structure for consistent visualization
    hours = Array.from({ length: 24 }, (_, i) => i);
    values = new Array(24).fill(0);
  } else {
    // Ensure we have a complete 24-hour range with zeros for missing hours
    const allHours = Array.from({ length: 24 }, (_, i) => i);
    const dataMap = new Map(hourly.map(h => [h.hour, h.pred]));
    
    hours = allHours;
    values = allHours.map(h => Math.round(dataMap.get(h) || 0));
    
    console.log("Hours:", hours);
    console.log("Values:", values);
    
    // Check if all values are zero
    const maxValue = Math.max(...values);
    if (maxValue === 0) {
      console.warn("All values are zero in HourWheel");
      isEmpty = true;
    }
  }

  const maxValue = isEmpty ? 0 : Math.max(...values);

  const option = {
    backgroundColor: 'transparent',
    title: { 
      text: "Hour wheel", 
      subtext: isEmpty ? "No data available" : "Hourly intensity distribution",
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
    polar: {
      radius: ['20%', '85%'],
      center: ['50%', '55%']
    },
    angleAxis: { 
      type: "category", 
      data: hours.map(h => `${String(h).padStart(2,"0")}`), 
      axisLabel: { 
        color: "#f8fafc", 
        fontSize: 12,
        fontWeight: 'bold',
        rotate: 0
      },
      axisLine: { 
        show: true, 
        lineStyle: { 
          color: "#94a3b8",
          width: 3
        } 
      },
      axisTick: { 
        show: true, 
        lineStyle: { 
          color: "#94a3b8",
          width: 2
        } 
      },
      splitLine: { 
        show: true, 
        lineStyle: { 
          color: "#64748b",
          width: 2,
          type: 'solid'
        } 
      }
    },
    radiusAxis: { 
      type: "value",
      min: 0,
      max: isEmpty ? 10 : undefined,
      axisLabel: { 
        color: "#f1f5f9", 
        fontSize: 11,
        fontWeight: 'bold',
        show: !isEmpty
      }, 
      splitLine: { 
        show: true,
        lineStyle: { 
          color: "#64748b",
          width: 2,
          type: 'solid'
        } 
      },
      axisLine: { 
        show: true,
        lineStyle: {
          color: "#94a3b8",
          width: 2
        }
      },
      axisTick: { show: false }
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
        return `<strong>Hour ${params.name}:00</strong><br/>Volume: <span style="color: #60a5fa">${params.value.toLocaleString()}</span>`;
      }
    },
    series: [{
      type: "bar",
      coordinateSystem: "polar",
      data: values,
      roundCap: true,
      barWidth: '70%',
      itemStyle: {
        color: (params: any) => {
          if (isEmpty) return '#374151';
          
          const value = params.value;
          if (maxValue === 0) return '#475569';
          
          const intensity = value / maxValue;
          if (intensity >= 0.8) return '#ef4444'; // High - red
          if (intensity >= 0.6) return '#f59e0b'; // Medium-high - amber
          if (intensity >= 0.4) return '#3b82f6'; // Medium - blue
          if (intensity >= 0.2) return '#10b981'; // Low-medium - green
          if (value > 0) return '#6366f1'; // Low - indigo
          return '#374151'; // Zero - gray
        },
        opacity: isEmpty ? 0.3 : 1,
        borderColor: '#1e293b',
        borderWidth: 1,
        shadowBlur: isEmpty ? 0 : 2,
        shadowColor: 'rgba(0,0,0,0.3)'
      },
      emphasis: {
        itemStyle: {
          color: isEmpty ? '#374151' : '#fbbf24',
          borderColor: isEmpty ? '#374151' : '#f59e0b',
          borderWidth: 2,
          shadowBlur: 10,
          shadowColor: isEmpty ? 'transparent' : '#fbbf24'
        }
      },
      silent: isEmpty
    }]
  };
  
  return (
    <div className="card relative">
      <h3>Hourly intensity (polar)</h3>
      <ReactECharts option={option} style={{height: 360}} />
      {isEmpty && (
        <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-slate-800/90 backdrop-blur-sm rounded-lg p-4 border border-slate-600">
            <div className="text-slate-200 text-sm text-center font-medium">
              No hourly data available
            </div>
            <div className="text-slate-400 text-xs mt-1 text-center">
              Check time range and filters
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
