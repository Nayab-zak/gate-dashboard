// src/components/UtilizationGauges.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

export default function UtilizationGauges({ items }:{
  items: { terminal: string; utilizationPct: number }[]; // 0..100
}) {
  // show up to 8 per row
  const option = {
    grid: { top: 20 },
    series: items.map((it, idx) => ({
      type: "gauge",
      center: [`${(idx%4)*25 + 12.5}%`, `${Math.floor(idx/4)*50 + 50}%`], // 4 per row
      radius: "30%",
      startAngle: 210, endAngle: -30,
      min: 0, max: 100,
      axisLine: { lineStyle: { width: 10 } },
      pointer: { show: true, length: "65%" },
      progress: { show: true, width: 10 },
      axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
      title: { offsetCenter: [0, "65%"], color:"#b7c3e0" },
      detail: { valueAnimation: true, fontSize: 16, color:"#fff", formatter: "{value}%" },
      data: [{ value: Math.round(it.utilizationPct), name: it.terminal }]
    }))
  };
  return <div className="card"><h3>Terminal Capacity Utilization</h3><ReactECharts option={option} style={{height: items.length<=4 ? 260 : 500}} /></div>;
}
