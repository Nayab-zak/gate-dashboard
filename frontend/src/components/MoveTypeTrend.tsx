// src/components/MoveTypeTrend.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

export default function MoveTypeTrend({ points }:{ points:{date:string; hour:number; move_type:string; pred:number}[] }) {
  const hours = Array.from(new Set(points.map(p=>p.hour))).sort((a,b)=>a-b);
  const by = (mt:string)=> hours.map(h=> {
    const f = points.find(p=>p.hour===h && p.move_type===mt);
    return f? Math.round(f.pred) : 0;
  });

  const option = {
    title: { text: "IN vs OUT — hourly trend", textStyle:{color:"#cfd7f2", fontSize:12} },
    grid: { left:48, right:20, top:36, bottom:32 },
    tooltip: { trigger: "axis" },
    xAxis: { type:"category", data: hours.map(h=>`${String(h).padStart(2,"0")}:00`), axisLabel:{color:"#b7c3e0"} },
    yAxis: { type:"value", min:0, axisLabel:{color:"#b7c3e0"}, splitLine:{lineStyle:{color:"#1f2a44"}} },
    legend: { textStyle:{color:"#cfd7f2"} },
    series: [
      { name:"IN",  type:"line", data: by("IN"),  smooth:true, symbol:"circle", symbolSize:6 },
      { name:"OUT", type:"line", data: by("OUT"), smooth:true, symbol:"circle", symbolSize:6 },
    ]
  };
  return <div className="card"><h3>MoveType hourly trend</h3><ReactECharts option={option} style={{height: 360}} /></div>;
}
