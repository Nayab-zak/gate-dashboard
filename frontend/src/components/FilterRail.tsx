// src/components/FilterRail.tsx
"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchEnums } from "@/lib/api";
import TimeRange from "./TimeRange";

export default function FilterRail() {
  const { data } = useQuery({ queryKey: ["enums"], queryFn: fetchEnums, staleTime: 5*60_000 });
  const terminals = data?.terminals ?? ["T1","T2","T3","T4"];
  const moveTypes = data?.move_types ?? ["ALL","IN","OUT"];
  const desigs = data?.desigs ?? ["ALL","EMPTY","FULL","EXP"];

  const router = useRouter(); 
  const path = usePathname(); 
  const sp = useSearchParams();
  const terminal = (sp.get("terminal") || terminals[0]).toUpperCase();
  const movetype = (sp.get("movetype") || "ALL").toUpperCase();
  const desig = (sp.get("desig") || "ALL").toUpperCase();
  const capacity = parseInt(sp.get("capacity") || "100"); // Default capacity

  const set = (k: "terminal"|"movetype"|"desig"|"capacity", v: string) => {
    const next = new URLSearchParams(sp.toString()); 
    next.set(k, v.toUpperCase());
    router.replace(`${path}?${next.toString()}`, { scroll:false });
  };

  const setCapacity = (value: number) => {
    const next = new URLSearchParams(sp.toString()); 
    next.set("capacity", value.toString());
    router.replace(`${path}?${next.toString()}`, { scroll:false });
  };

  return (
    <aside className="w-[260px] py-6 space-y-6">
      {/* Time Range Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>TIME RANGE</h3>
        
        <div className="px-3"> {/* 12px column grid alignment */}
          <TimeRange />
        </div>
      </div>
      
      {/* Filters Section */}
      <div className="pt-4 border-t border-white/20 space-y-6">
        <h3 className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>FILTERS</h3>
        
        <div className="space-y-5 px-3"> {/* 12px column grid alignment */}
          <Field label="Terminal" value={terminal} onChange={v=>set("terminal", v)} options={terminals} />
          <Field label="Move Type" value={movetype} onChange={v=>set("movetype", v)} options={moveTypes} />
          <Field label="Container Type" value={desig} onChange={v=>set("desig", v)} options={desigs} />
        </div>
      </div>
      
      {/* Capacity Management Section */}
      <div className="pt-4 border-t border-white/20 space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wide mb-4" style={{ color: 'rgba(255, 255, 255, 0.7)' }}>CAPACITY MANAGEMENT</h3>
        
        <div className="px-3"> {/* 12px column grid alignment */}
          <CapacityControl value={capacity} onChange={setCapacity} />
        </div>
      </div>
    </aside>
  );
}

function Field({label, value, onChange, options}:{label:string; value:string; onChange:(v:string)=>void; options:string[]}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-white/90 uppercase tracking-wide">{label}</label>
      <select className="w-full bg-dp-navy/80 border border-white/30 rounded-md px-3 py-2.5 text-sm text-white font-medium focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all"
              value={value} onChange={e=>onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o} className="bg-dp-navy text-white">{o}</option>)}
      </select>
    </div>
  );
}

function CapacityControl({value, onChange}:{value: number; onChange:(v: number)=>void}) {
  const presets = [50, 75, 100, 125, 150, 200];
  const isCustom = !presets.includes(value);
  
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-xs font-medium text-white/90 uppercase tracking-wide flex items-center gap-2">
          <span className="w-2 h-2 bg-green-400 rounded-full"></span>
          Hourly Capacity Limit
        </label>
        <div className="text-lg font-bold text-green-400 bg-white/10 rounded-md px-3 py-2.5 border border-white/20">
          {value} tokens/hr
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-xs font-medium text-white/90 uppercase tracking-wide">Quick Settings</label>
        <div className="grid grid-cols-3 gap-1">
          {presets.map(preset => (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              className={`px-2 py-1.5 text-xs rounded transition-all font-medium ${
                value === preset 
                  ? 'bg-green-500 text-white font-bold shadow-md' 
                  : 'bg-white/10 hover:bg-green-500/20 border border-white/20 text-white hover:border-green-400/50'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-xs font-medium text-white/90 uppercase tracking-wide">Custom Value</label>
        <input
          type="number"
          min="1"
          max="1000"
          step="5"
          value={isCustom ? value : ''}
          onChange={e => onChange(Math.max(1, parseInt(e.target.value) || 1))}
          placeholder="Enter capacity"
          className="w-full bg-dp-navy/80 border border-white/30 rounded-md px-3 py-2.5 text-xs text-white placeholder-white/50 focus:border-green-400 focus:ring-1 focus:ring-green-400 transition-all"
        />
      </div>
      
      <div className="mt-4 text-xs text-dp-silver space-y-1">
        <p className="flex items-center gap-1.5">
          <span>🎯</span>
          <span>Capacity represents max containers per hour</span>
        </p>
        <p className="flex items-center gap-1.5">
          <span>💡</span>
          <span>Alerts trigger when demand exceeds this threshold</span>
        </p>
      </div>
    </div>
  );
}