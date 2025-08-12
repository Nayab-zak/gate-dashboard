// src/components/LollipopRanking.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

export default function LollipopRanking({ data }:{ data: {terminal:string; total_pred:number}[] }) {
  const sorted = [...data].sort((a,b)=>b.total_pred-a.total_pred);
  const y = sorted.map(d=>d.terminal);
  const x = sorted.map(d=>Math.round(d.total_pred));

  const option = {
    title: { text: "Terminal Ranking (predicted total)", textStyle:{color:"#cfd7f2", fontSize:12} },
    grid: { left: 90, right: 20, top: 36, bottom: 24 },
    xAxis: { type: "value", min:0, axisLabel:{color:"#b7c3e0"}, splitLine:{lineStyle:{color:"#1f2a44"}} },
    yAxis: { type: "category", data: y, axisLabel:{color:"#b7c3e0"} },
    series: [
      { // stems
        type: "bar", data: x, barWidth: 2, itemStyle:{opacity:0.4}, label:{show:false},
      },
      { // lollipop dots
        type: "scatter", data: x.map((v,i)=>[v,y[i]]), symbolSize: 12, itemStyle:{opacity:0.95},
      }
    ],
    tooltip: { formatter: (p:any)=> `${p.value[1]}: ${p.value[0]}` }
  };
  return <div className="card"><h3>Terminal leaderboard</h3><ReactECharts option={option} style={{height: 380}} /></div>;
}
