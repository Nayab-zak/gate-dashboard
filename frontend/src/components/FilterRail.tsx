// src/components/FilterRail.tsx
"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchEnums } from "@/lib/api";

export default function FilterRail() {
  const { data } = useQuery({ queryKey: ["enums"], queryFn: fetchEnums, staleTime: 5*60_000 });
  const terminals = data?.terminals ?? ["T1","T2","T3","T4"];
  const moveTypes = data?.move_types ?? ["ALL","IN","OUT"];
  const desigs = data?.desigs ?? ["ALL","EMPTY","FULL","EXP"];

  const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  const terminal = (sp.get("terminal") || terminals[0]).toUpperCase();
  const movetype = (sp.get("movetype") || "ALL").toUpperCase();
  const desig = (sp.get("desig") || "ALL").toUpperCase();
  const capacity = parseInt(sp.get("capacity") || "100"); // Default capacity

  const set = (k: "terminal"|"movetype"|"desig"|"capacity", v: string) => {
    const next = new URLSearchParams(sp.toString()); next.set(k, v.toUpperCase());
    router.replace(`${path}?${next.toString()}`, { scroll:false });
  };

  const setCapacity = (value: number) => {
    const next = new URLSearchParams(sp.toString()); 
    next.set("capacity", value.toString());
    router.replace(`${path}?${next.toString()}`, { scroll:false });
  };

  return (
    <aside className="w-64 shrink-0 space-y-4 bg-slate-700/50 rounded-lg p-4 text-slate-100">
      <h3 className="text-xs font-semibold tracking-wide">FILTERS</h3>

      <Field label="Terminal" value={terminal} onChange={v=>set("terminal", v)} options={terminals} />
      <Field label="Move Type" value={movetype} onChange={v=>set("movetype", v)} options={moveTypes} />
      <Field label="Desig" value={desig} onChange={v=>set("desig", v)} options={desigs} />
      
      <div className="pt-2 border-t border-slate-600">
        <h3 className="text-xs font-semibold tracking-wide mb-3 text-amber-400">CAPACITY MANAGEMENT</h3>
        <CapacityControl value={capacity} onChange={setCapacity} />
      </div>
    </aside>
  );
}

function Field({label, value, onChange, options}:{label:string; value:string; onChange:(v:string)=>void; options:string[]}) {
  return (
    <div className="space-y-1">
      <label className="block text-xs opacity-80">{label}</label>
      <select className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-2"
              value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function CapacityControl({value, onChange}:{value: number; onChange:(v: number)=>void}) {
  const presets = [50, 75, 100, 125, 150, 200];
  const isCustom = !presets.includes(value);
  
  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <label className="block text-xs opacity-80 flex items-center gap-2">
          <span className="w-2 h-2 bg-amber-400 rounded-full"></span>
          Hourly Capacity Limit
        </label>
        <div className="text-lg font-bold text-amber-400">
          {value} tokens/hr
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-xs opacity-80">Quick Settings</label>
        <div className="grid grid-cols-3 gap-1">
          {presets.map(preset => (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              className={`px-2 py-1 text-xs rounded transition-all ${
                value === preset 
                  ? 'bg-amber-500 text-slate-900 font-semibold' 
                  : 'bg-slate-800 hover:bg-slate-700 border border-slate-600'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-1">
        <label className="block text-xs opacity-80">Custom Value</label>
        <input
          type="number"
          min="1"
          max="1000"
          step="5"
          value={isCustom ? value : ''}
          onChange={e => onChange(Math.max(1, parseInt(e.target.value) || 1))}
          placeholder="Enter capacity"
          className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1 text-sm"
        />
      </div>
      
      <div className="text-xs opacity-60 bg-slate-800/50 rounded p-2">
        <div className="flex items-center gap-1 mb-1">
          <span className="text-amber-400">⚠️</span>
          <span className="font-medium">Impact:</span>
        </div>
        <div>Values exceeding this limit will trigger overload alerts and appear in red on forecasts.</div>
      </div>
    </div>
  );
}
