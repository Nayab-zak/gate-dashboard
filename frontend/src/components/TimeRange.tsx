// src/components/TimeRange.tsx
"use client";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

const modes = [
  { key: "next8h", label: "Latest (Next 8h)" },
  { key: "today",  label: "Today 00–23" },
  { key: "custom", label: "Custom range" },
];

export default function TimeRange(){
  const router = useRouter(); const path = usePathname(); const sp = useSearchParams();
  const mode = sp.get("mode") || "next8h";           // next8h | today | custom
  const startStr = sp.get("start"); const endStr = sp.get("end");

  const start = useMemo(()=> startStr ? new Date(startStr) : null, [startStr]);
  const end   = useMemo(()=> endStr ? new Date(endStr) : null, [endStr]);

  const set = (kv: Record<string,string|null>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(kv).forEach(([k,v]) => v===null ? next.delete(k) : next.set(k, v));
    router.replace(`${path}?${next.toString()}`, {scroll:false});
  };

  const toLocalStr = (d: Date | null) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:00` : "";

  return (
    <div className="flex flex-wrap items-end gap-4">
      <div className="space-y-1">
        <label className="block text-xs opacity-80">Mode</label>
        <div className="flex flex-wrap gap-2">
          {modes.map(m => (
            <button
              key={m.key}
              onClick={()=> set({ mode: m.key })}
              className={`px-3 py-1.5 rounded-md text-sm
                          ${mode===m.key ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200 hover:bg-slate-700"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "custom" && (
        <>
          <div className="space-y-1">
            <label className="block text-xs opacity-80">Start</label>
            <DatePicker
              selected={start}
              onChange={(d: Date | null) => set({ start: toLocalStr(d) })}
              showTimeSelect
              timeIntervals={60}
              dateFormat="yyyy-MM-dd HH:mm"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-2"
              placeholderText="Select start time"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-xs opacity-80">End</label>
            <DatePicker
              selected={end}
              onChange={(d: Date | null) => set({ end: toLocalStr(d) })}
              showTimeSelect
              timeIntervals={60}
              dateFormat="yyyy-MM-dd HH:mm"
              className="bg-slate-900 border border-slate-700 rounded px-2 py-2"
              placeholderText="Select end time"
              minDate={start ?? undefined}
            />
          </div>
        </>
      )}
    </div>
  );
}
