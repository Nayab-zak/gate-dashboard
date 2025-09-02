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
    <aside className="bg-white rounded-lg p-6 shadow-sm border border-gray-200 sticky top-6 h-fit">
      <h3 className="text-lg font-semibold text-gray-900 mb-6">Control Panel</h3>

      <div className="space-y-6">
        <Field label="Terminal" value={terminal} onChange={v=>set("terminal", v)} options={terminals} />
        <Field label="Move Type" value={movetype} onChange={v=>set("movetype", v)} options={moveTypes} />
        <Field label="Container Type" value={desig} onChange={v=>set("desig", v)} options={desigs} />
        
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Capacity Management</h4>
          <CapacityControl value={capacity} onChange={setCapacity} />
        </div>
      </div>
    </aside>
  );
}

function Field({label, value, onChange, options}:{label:string; value:string; onChange:(v:string)=>void; options:string[]}) {
  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">{label}</label>
      <select className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-gray-900 font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
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
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
          <span className="w-2 h-2 bg-green-500 rounded-full"></span>
          Hourly Capacity Limit
        </label>
        <div className="text-xl font-bold text-gray-900 bg-green-50 rounded-md px-3 py-2 border border-green-200">
          {value} tokens/hr
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Quick Settings</label>
        <div className="grid grid-cols-3 gap-1">
          {presets.map(preset => (
            <button
              key={preset}
              onClick={() => onChange(preset)}
              className={`px-2 py-1 text-sm rounded transition-all font-medium ${
                value === preset 
                  ? 'bg-blue-600 text-white font-bold shadow-md' 
                  : 'bg-gray-100 hover:bg-blue-50 border border-gray-300 text-gray-700 hover:border-blue-300'
              }`}
            >
              {preset}
            </button>
          ))}
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Custom Value</label>
        <input
          type="number"
          min="1"
          max="1000"
          step="5"
          value={isCustom ? value : ''}
          onChange={e => onChange(Math.max(1, parseInt(e.target.value) || 1))}
          placeholder="Enter capacity"
          className="w-full bg-white border border-gray-300 rounded-md px-3 py-2 text-sm text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
        />
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>🎯 Capacity represents max containers per hour</p>
        <p className="mt-1">💡 Alerts trigger when demand exceeds this threshold</p>
      </div>
    </div>
  );
}
