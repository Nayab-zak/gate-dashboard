// src/components/BulletRanking.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "./ThemeProvider";

export default function BulletRanking({ totals, capacityPerHour, hours, subtitle }:{
  totals: { terminal:string; total_pred:number }[];
  capacityPerHour: number;
  hours: number;                     // window length in hours
  subtitle?: string;                 // Optional subtitle for context
}) {
  const { theme } = useTheme();
  
  // Theme-aware colors
  const colors = {
    axisText: theme === 'light' ? '#002F6C' : '#ffffff',
    gridLines: '#B3B3B3',
    tooltipBg: theme === 'light' ? '#FFFFFF' : '#1f2937',
    tooltipBorder: theme === 'light' ? '#002F6C20' : '#374151',
    tooltipText: theme === 'light' ? '#002F6C' : '#f9fafb'
  };
  
  // Debug logging
  console.log("BulletRanking data:", { totals, capacityPerHour, hours });
  
  if (!totals || totals.length === 0) {
    return (
      <div className="card">
        <h3>Terminal ranking (bullet)</h3>
        <div className="flex items-center justify-center h-96 text-slate-400">
          No ranking data available
        </div>
      </div>
    );
  }

  // The totals are TokenCount_pred sums over the analytics time window
  // We should show the relative ranking, not compare against forecast capacity
  // Since these are totals over potentially different time periods
  
  const maxTotal = Math.max(...totals.map(t => t.total_pred));
  const y = totals.map(t => t.terminal);
  const pred = totals.map(t => Math.round(t.total_pred));
  
  // For visualization, create a reference line at 80% of max value
  const reference = totals.map(_ => Math.round(maxTotal * 0.8));

  const option = {
    grid: { left: 60, right: 40, top: 30, bottom: 24 },
    xAxis: { 
      type: "value", 
      min: 0, 
      max: Math.round(maxTotal * 1.1),
      axisLabel: { 
        color: colors.axisText, 
        fontSize: 10,
        fontWeight: '500'
      }, 
      splitLine: { 
        lineStyle: { 
          color: colors.gridLines,
          width: 1,
          opacity: 0.3
        } 
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: colors.gridLines
        }
      }
    },
    yAxis: { 
      type: "category", 
      data: y, 
      axisLabel: { 
        color: colors.axisText, 
        fontSize: 11,
        fontWeight: '500'
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: "#64748b"
        }
      },
      axisTick: {
        show: false
      }
    },
    series: [
      { 
        name: "Reference (80% of max)", 
        type: "bar", 
        data: reference, 
        barGap: "-100%", 
        barWidth: 20, 
        itemStyle: { 
          color: "#374151", 
          opacity: 0.3 
        },
        silent: true
      },
      { 
        name: "Token total", 
        type: "bar", 
        data: pred, 
        barWidth: 14, 
        itemStyle: { 
          color: (params: any) => {
            const value = params.value;
            const ratio = value / maxTotal;
            if (ratio > 0.8) return "#ef4444"; // red for highest
            if (ratio > 0.6) return "#dc2626"; // darker red for high
            return "#3b82f6"; // blue for normal
          }
        }, 
        label: { 
          show: true, 
          position: "right", 
          color: colors.axisText,
          fontSize: 10,
          formatter: (params: any) => {
            return params.value.toLocaleString();
          }
        }
      }
    ],
    tooltip: { 
      trigger: "axis", 
      axisPointer: { type: "shadow" },
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: colors.tooltipText,
        fontSize: 12
      },
      formatter: (p: any) => {
        const terminal = p[1]?.name;
        const total = p[1]?.data;
        const pct = ((total / maxTotal) * 100).toFixed(1);
        return `<strong>${terminal}</strong><br/>Total volume: <span style="color: #60a5fa">${total.toLocaleString()}</span><br/>% of peak terminal: <span style="color: #34d399">${pct}%</span>`;
      }
    },
    legend: { 
      show: false
    }
  };
  
  return (
    <div className="h-full flex flex-col">
      <h3 className="card-header">Terminal Performance Ranking</h3>
      <div className="card-body flex-1">
        <ReactECharts 
          option={option} 
          style={{
            width: '100%',
            height: '100%',
            minHeight: '280px'
          }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  );
}
