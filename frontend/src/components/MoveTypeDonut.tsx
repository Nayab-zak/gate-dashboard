// src/components/MoveTypeDonut.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";

export default function MoveTypeDonut({ share }:{ share: Record<"IN"|"OUT", number> }) {
  const total = (share.IN||0)+(share.OUT||0);
  const option = {
    title: { text: "MoveType share", left: "center", top: 10, textStyle:{color:"#cfd7f2", fontSize:12}},
    tooltip: { trigger: "item" },
    series: [{
      type: "pie", radius:["55%","80%"], avoidLabelOverlap: false,
      label: { color:"#cfd7f2", formatter: "{b}: {d}%"},
      data: [
        { value: share.IN || 0, name: "IN" },
        { value: share.OUT || 0, name: "OUT" },
      ]
    }],
    graphic: total>0 ? [{
      type: "text", left: "center", top: "45%", style: { text: `${Math.round(total)}`, fill: "#fff", fontSize: 18, fontWeight: 600 }
    }] : []
  };
  return <div className="card"><h3>MoveType share</h3><ReactECharts option={option} style={{height: 320}} /></div>;
}
