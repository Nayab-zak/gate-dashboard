"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { ForecastPoint } from "@/lib/api";

export default function TodayTimeline({ rows }:{ rows: ForecastPoint[] }) {
  const x = rows.map(r => new Date(r.ts).toLocaleTimeString([], {hour:"2-digit"}));
  const pred = rows.map(r => r.pred ?? 0);
  const actual = rows.map(r => (r.actual ?? null));

  const option = {
    title: { text: "Today (00–23): Predicted vs Actual" },
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: x },
    yAxis: { type: "value" },
    series: [
      { name: "Predicted", type: "bar", data: pred, barWidth: "60%" },
      { name: "Actual", type: "line", data: actual, symbol: "circle" }
    ]
  };
  return <div className="card"><h3>Today timeline</h3><ReactECharts option={option} style={{height: 420}} /></div>;
}
