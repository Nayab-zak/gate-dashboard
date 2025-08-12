// src/components/InsightsBox.tsx
"use client";
import React from "react";
import { Next8HResponse } from "@/lib/api";

type Inputs = {
  forecast: Next8HResponse;                            // /forecast/next8h or /forecast/range
  share?: { IN: number; OUT: number };                 // /analytics/movetype_share
  ranking?: { terminal: string; total_pred: number }[];// /analytics/terminal_ranking
};

export default function InsightsBox({ forecast, share, ranking }: Inputs) {
  const pts = forecast.horizon_hours;
  const cap = forecast.capacity_per_hour || 0;  const total = Math.round(pts.reduce((a,b)=>a+(b.pred||0),0));
  const peak = pts.reduce((m,p)=> (p.pred||0)>(m.pred||0) ? p : m, pts[0]||{pred:0, ts:""});
  const overload = pts.filter(p => (p.pred||0) > cap).map(p => p.ts);
  const winnerTerminal = ranking && ranking[0]?.terminal;
  const mtDom = share ? (share.IN>=share.OUT ? "IN" : "OUT") : "—";
  const risk = overload.length>=3 ? "High overload risk" : overload.length>0 ? "Overload in some hours" : "Within capacity";

  return (
    <div className="card">
      <h3>Insights</h3>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
        <Insight label="Total tokens (window)" value={total} />
        <Insight label="Peak hour" value={peak.ts ? `${new Date(peak.ts).toLocaleTimeString([], {hour:"2-digit"})} • ${Math.round(peak.pred||0)}` : `${Math.round(peak.pred||0)}`} />
        <Insight label="Overload hours" value={`${overload.length}`} tone={overload.length>=3?"red":overload.length>0?"amber":"slate"} />
        <Insight label="Dominant MoveType" value={mtDom} />
        <Insight label="Busiest terminal" value={winnerTerminal || "—"} />
        <Insight label="Risk" value={risk} tone={risk.startsWith("High")?"red":risk.includes("Overload")?"amber":"green"} />
      </div>
    </div>
  );
}

function Insight({label, value, tone="slate"}:{label:string; value:React.ReactNode; tone?:"slate"|"amber"|"red"|"green"}) {
  const bg = tone==="red"?"bg-red-600/15":tone==="amber"?"bg-amber-500/15":tone==="green"?"bg-emerald-600/15":"bg-slate-700/30";
  return (
    <div className={`rounded-lg p-3 ${bg}`}>
      <div className="text-xs opacity-80">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
