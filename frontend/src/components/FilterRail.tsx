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

  const set = (k: "terminal"|"movetype"|"desig", v: string) => {
    const next = new URLSearchParams(sp.toString()); next.set(k, v.toUpperCase());
    router.replace(`${path}?${next.toString()}`, { scroll:false });
  };

  return (
    <aside className="w-64 shrink-0 space-y-4 bg-slate-700/50 rounded-lg p-4 text-slate-100">
      <h3 className="text-xs font-semibold tracking-wide">FILTERS</h3>

      <Field label="Terminal" value={terminal} onChange={v=>set("terminal", v)} options={terminals} />
      <Field label="Move Type" value={movetype} onChange={v=>set("movetype", v)} options={moveTypes} />
      <Field label="Desig" value={desig} onChange={v=>set("desig", v)} options={desigs} />
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
