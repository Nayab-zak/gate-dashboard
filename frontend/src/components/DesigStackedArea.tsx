// src/components/DesigStackedArea.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

export default function DesigStackedArea({ points }:{ points:{date:string; hour:number; desig:string; pred:number}[] }) {
  const hours = Array.from(new Set(points.map(p=>p.hour))).sort((a,b)=>a-b);
  const desigs = Array.from(new Set(points.map(p=>p.desig))).sort();
  const series = desigs.map(dg => ({
    name: dg, type: "line", stack: "total", areaStyle: {}, symbol:"none",
    data: hours.map(h=> {
      const f = points.find(p=>p.hour===h && p.desig===dg);
      return f? Math.round(f.pred) : 0;
    })
  }));
  const option = {
    title: { text: "Designation composition (hourly)", textStyle:{color:"#cfd7f2", fontSize:12} },
    grid: { left:48, right:20, top:36, bottom:32 },
    tooltip: { trigger:"axis" },
    legend: { textStyle:{color:"#cfd7f2"} },
    xAxis: { type:"category", data: hours.map(h=>`${String(h).padStart(2,"0")}:00`), axisLabel:{color:"#b7c3e0"} },
    yAxis: { type:"value", min:0, axisLabel:{color:"#b7c3e0"}, splitLine:{lineStyle:{color:"#1f2a44"}} },
    series
  };
  return <div className="card"><h3>Desig over time</h3><ReactECharts option={option} style={{height: 360}} /></div>;
}
