// src/components/FanChart.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { ForecastPoint } from "@/lib/api";

export default function FanChart({ rows, title }:{ rows: ForecastPoint[]; title:string }) {
  const x = rows.map(r => new Date(r.ts).toLocaleTimeString([], { hour: "2-digit" }));
  const y = rows.map(r => r.pred ?? 0);
  const lower = rows.map(r => (r.lower ?? null));
  const upper = rows.map(r => (r.upper ?? null));
  const capacity = rows.map(() => 100); // Static capacity value
  const haveBand = upper.some(v => v !== null) && lower.some(v => v !== null);

  const peakIdx = y.reduce((m, v, i) => (v > y[m] ? i : m), 0);

  const option = {
    backgroundColor: "transparent",
    title: { text: title, textStyle: { color: "#cfd7f2", fontSize: 12 } },
    grid: { left: 48, right: 20, top: 36, bottom: 32 },
    tooltip: {
      trigger: "axis",
      formatter: (params) => {
        const [pred, actual, cap] = params;
        return `Predicted: ${pred.value}<br>Actual: ${actual.value}<br>Capacity: ${cap.value}`;
      },
    },
    xAxis: { type: "category", data: x, axisLine:{lineStyle:{color:"#2f3b55"}}, axisLabel:{color:"#b7c3e0"} },
    yAxis: { type: "value", min: 0, axisLine:{lineStyle:{color:"#2f3b55"}}, splitLine:{lineStyle:{color:"#1f2a44"}}, axisLabel:{color:"#b7c3e0"} },
    series: [
      ...(haveBand ? [
        // shaded band between lower & upper
        { name: "Upper", type: "line", data: upper, symbol: "none", lineStyle:{width:0}, areaStyle:{opacity:0.15}, z:1 },
        { name: "Lower", type: "line", data: lower, symbol: "none", lineStyle:{width:0}, areaStyle:{opacity:0.15}, z:1 },
      ] : []),
      // main forecast
      { name: "Predicted", type: "line", data: y, symbol: "circle", symbolSize: 6, smooth: true, lineStyle:{width:2}, itemStyle:{opacity:0.9}, z:2,
        markPoint: { data: [{ name: "Peak", xAxis: x[peakIdx], yAxis: y[peakIdx], value: Math.round(y[peakIdx]) }], label:{color:"#fff"} }
      },
      { name: "Overload", type: "bar", data: y.map((v, i) => v > capacity[i] ? v : null), itemStyle: { color: "red" } },
      { name: "Capacity", type: "line", data: capacity, symbol: "none", lineStyle: { type: "dashed", color: "#888" }, z: 1 },
    ]
  };

  return <div className="card"><h3>{title}</h3><ReactECharts option={option} style={{ height: 460 }} /></div>;
}
