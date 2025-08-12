import React from "react";
import { Next8HResponse } from "@/lib/api";

export default function KpiStrip({ data }: { data: Next8HResponse }) {
  const total = data.horizon_hours.reduce((s, x) => s + (x.pred || 0), 0);
  const peak = data.horizon_hours.reduce((m, x) => Math.max(m, x.pred || 0), 0);
  const capacity = data.capacity_per_hour;
  const overloadHours = data.horizon_hours.filter(h => (h.pred||0) > capacity).length;
  const tone = overloadHours >= 3 ? "bg-red-600" : overloadHours > 0 ? "bg-amber-600" : "bg-slate-800";

  return (
    <div className="grid grid-cols-4 gap-4">
      <Tile label="Next 8h Tokens" value={total.toFixed(0)} />
      <Tile label="Peak / hr" value={peak.toFixed(0)} />
      <Tile label="Overload hours" value={`${overloadHours}/8`} className={tone} />
      <Tile label="Data freshness" value={new Date(data.updated_at).toLocaleTimeString()} />
    </div>
  );
}

function Tile({label, value, className}:{label:string; value:string; className?:string}) {
  return (
    <div className={`rounded-lg p-4 ${className}`}>
      <div className="text-sm opacity-80">{label}</div>
      <div className="text-3xl font-semibold mt-1">{value}</div>
    </div>
  );
}
