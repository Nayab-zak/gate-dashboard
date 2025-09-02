// src/components/Composition100Stack.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "./ThemeProvider";

type Row = { terminal: string; key: string; pred: number };

export default function Composition100Stack({ dim, rows }:{ dim: "desig"|"movetype"; rows: Row[] }) {
  const { theme } = useTheme();
  
  // Theme-aware colors
  const colors = {
    axisText: theme === 'light' ? '#002F6C' : '#b7c3e0',
    legendText: theme === 'light' ? '#002F6C' : '#cfd7f2',
    gridLines: theme === 'light' ? '#002F6C30' : '#1f2a44'
  };
  // terminals sorted by total pred
  const totalsByT: Record<string, number> = {};
  rows.forEach(r => totalsByT[r.terminal] = (totalsByT[r.terminal] || 0) + r.pred);
  const terminals = Object.keys(totalsByT).sort((a,b)=> (totalsByT[b]-totalsByT[a]));

  // keys (series) sorted for stable colors
  const wantedKeys = dim === "desig" ? ["EMPTY","FULL","EXP","UNK"] : ["IN","OUT"];
  const keys = Array.from(new Set([...wantedKeys, ...rows.map(r=>r.key)]));

  // build 100% data for each series
  const byTK: Record<string, Record<string, number>> = {};
  rows.forEach(r => {
    byTK[r.terminal] = byTK[r.terminal] || {};
    byTK[r.terminal][r.key] = (byTK[r.terminal][r.key] || 0) + r.pred;
  });

  const series = keys.map(k => ({
    name: k,
    type: "bar",
    stack: "total",
    emphasis: { focus: "series" },
    label: {
      show: true,
      formatter: (p:any) => (p.value>7 ? `${Math.round(p.value)}%` : ""), // show labels if >7%
      color: "#0b0f1a"
    },
    data: terminals.map(t => {
      const total = totalsByT[t] || 1;
      const part = (byTK[t]?.[k] || 0) / total * 100;
      return Math.round(part);
    })
  }));

  const title = dim === "desig" ? "Gate Load Distribution by Terminal (% of total volume)" 
                                : "Container Flow Distribution by Terminal (% of total volume)";

  const option = {
    grid: { left: 120, right: 20, top: 40, bottom: 32 }, // Increased top margin for legend
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
      formatter: (items:any[]) => {
        const t = items[0]?.name || "";
        const lines = items.map(it => `${it.marker} ${it.seriesName}: ${it.value}%`);
        return `<b>${t}</b><br/>${lines.join("<br/>")}`;
      }
    },
    legend: { 
      orient: 'horizontal',
      top: 10,
      right: 20, // Position legend at top-right
      textStyle:{ color: colors.legendText }
    },
    xAxis: { type: "value", min: 0, max: 100, axisLabel:{ color: colors.axisText, formatter: '{value}%' }, splitLine:{ lineStyle:{ color: '#B3B3B3', opacity: 0.3 } } }, // Lightened gridlines
    yAxis: { type: "category", data: terminals, axisLabel:{ color: colors.axisText } },
    series
  };

  return (
    <div className="h-full flex flex-col">
      <h3 className="card-header">{title}</h3>
      <div className="card-body flex-1">
        <ReactECharts 
          option={option} 
          style={{ 
            width: '100%',
            height: '100%',
            minHeight: '300px'
          }}
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  );
}
