// src/components/BulletRanking.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

export default function BulletRanking({ totals, capacityPerHour, hours, subtitle }:{
  totals: { terminal:string; total_pred:number }[];
  capacityPerHour: number;
  hours: number;                     // window length in hours
  subtitle?: string;                 // Optional subtitle for context
}) {
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
    title: { 
      text: "Terminal Performance Ranking", 
      subtext: subtitle || `Container volume forecast over ${hours}h period`,
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
    grid: { left: 60, right: 40, top: 50, bottom: 24 },
    xAxis: { 
      type: "value", 
      min: 0, 
      max: Math.round(maxTotal * 1.1),
      axisLabel: { 
        color: "#e2e8f0", 
        fontSize: 10,
        fontWeight: '500'
      }, 
      splitLine: { 
        lineStyle: { 
          color: "#4b5563",
          width: 1
        } 
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
      data: y, 
      axisLabel: { 
        color: "#e2e8f0", 
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
            if (ratio > 0.6) return "#f59e0b"; // amber for high
            return "#3b82f6"; // blue for normal
          }
        }, 
        label: { 
          show: true, 
          position: "right", 
          color: "#e2e8f0",
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
      backgroundColor: '#1f2937',
      borderColor: '#374151',
      borderWidth: 1,
      textStyle: {
        color: '#f9fafb',
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
    <div className="card">
      <h3>Terminal Performance Ranking</h3>
      <ReactECharts option={option} style={{height: 380}} />
    </div>
  );
}
