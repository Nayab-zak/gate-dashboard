"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { ForecastPoint } from "@/lib/api";

export default function CapacityPanel({ rows, capacity }:{rows: ForecastPoint[]; capacity: number}) {
  const x = rows.map(r => new Date(r.ts).toLocaleTimeString([], {hour: "2-digit"}));
  const pred = rows.map(r => r.pred ?? 0);
  const cap  = rows.map(_ => capacity);

  const option = {
    title: { 
      text: "Capacity vs Demand (next 8h)",
      textStyle: { color: "#e2e8f0" }
    },
    tooltip: { trigger: "axis" },
    xAxis: { 
      type: "category", 
      data: x,
      axisLabel: { color: "#94a3b8" },
      axisLine: { lineStyle: { color: "#475569" } }
    },
    yAxis: { 
      type: "value",
      axisLabel: { color: "#94a3b8" },
      axisLine: { lineStyle: { color: "#475569" } },
      splitLine: { lineStyle: { color: "#475569" } }
    },
    series: [
      { 
        type: "bar", 
        data: pred, 
        name: "Predicted",
        itemStyle: {
          color: function(params: any) {
            return params.value > capacity ? "#ef4444" : "#3b82f6";
          }
        }
      },
      { 
        type: "line", 
        data: cap, 
        name: "Capacity", 
        symbol: "none",
        lineStyle: { color: "#fbbf24", width: 2 }
      }
    ]
  };
  return <div className="bg-slate-800 rounded-lg p-4 text-slate-100"><ReactECharts option={option} style={{ height: 440 }} /></div>;
}
