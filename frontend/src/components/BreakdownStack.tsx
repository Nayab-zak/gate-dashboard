"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { ForecastPoint } from "@/lib/api";

export default function BreakdownStack({ rows }:{ rows: ForecastPoint[] }) {
  const groups = new Map<string, number>(); // key = `${move_type}-${desig}`
  for (const r of rows) {
    const k = `${r.move_type}-${r.desig}`;
    groups.set(k, (groups.get(k) || 0) + (r.pred || 0));
  }
  const keys = Array.from(groups.keys()).sort(); // e.g. EXP-IN etc if you prefer change
  const values = keys.map(k => Math.round(groups.get(k) || 0));

  const option = {
    title: { text: "Breakdown by MoveType × Desig (Predicted sum)" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: keys },
    yAxis: { type: "value" },
    series: [{ type: "bar", data: values }]
  };
  return <div className="card"><h3>Breakdown</h3><ReactECharts option={option} style={{height: 360}} /></div>;
}
