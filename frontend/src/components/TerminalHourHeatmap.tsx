// src/components/TerminalHourHeatmap.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

export default function TerminalHourHeatmap({ cells }:{ cells:{terminal:string; hour:number; pred:number}[] }) {
  const terminals = Array.from(new Set(cells.map(c=>c.terminal))).sort();
  const hours = Array.from(new Set(cells.map(c=>c.hour))).sort((a,b)=>a-b);
  const data = cells.map(c => [hours.indexOf(c.hour), terminals.indexOf(c.terminal), Math.round(c.pred)]);

  const option = {
    title: { text: "Terminal × Hour heatmap", textStyle:{color:"#cfd7f2", fontSize:12} },
    grid: { left: 100, right: 20, top: 36, bottom: 32 },
    xAxis: { type: "category", data: hours.map(h=>`${String(h).padStart(2,"0")}:00`), axisLabel:{color:"#b7c3e0"} },
    yAxis: { type: "category", data: terminals, axisLabel:{color:"#b7c3e0"} },
    visualMap: { min: 0, max: Math.max(1, ...cells.map(c=>c.pred)), orient: "horizontal", left: "center", bottom: 0, textStyle:{color:"#cfd7f2"} },
    series: [{ type: "heatmap", data, label: { show: false } }],
    tooltip: { formatter: (p:any)=> `${terminals[p.value[1]]} @ ${hours[p.value[0]].toString().padStart(2,"0")}:00 → ${p.value[2]}` }
  };
  return <div className="card"><h3>Hot hours by terminal</h3><ReactECharts option={option} style={{height: 420}} /></div>;
}
