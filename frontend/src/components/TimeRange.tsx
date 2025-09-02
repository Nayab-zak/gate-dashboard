// src/components/TimeRange.tsx
"use client";
import DatePicker from "react-datepicker";
// import "react-datepicker/dist/react-datepicker.css"; // Commented out to fix compilation issue
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
        <label className="block text-sm theme-text font-bold">Mode</label>
        <div className="flex flex-wrap gap-2">
          {modes.map(m => (
            <button
              key={m.key}
              onClick={()=> set({ mode: m.key })}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors
                          ${mode===m.key 
                            ? "bg-theme-accent text-white" 
                            : "bg-theme-card text-theme-card-text border border-theme-border hover:bg-theme-bg-secondary hover:text-theme-text"}`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {mode === "custom" && (
        <>
          <div className="space-y-1">
            <label className="block text-sm theme-text font-bold">Start</label>
            <DatePicker
              selected={start}
              onChange={(d: Date | null) => set({ start: toLocalStr(d) })}
              showTimeSelect
              timeIntervals={60}
              dateFormat="yyyy-MM-dd HH:mm"
              className="bg-theme-card border border-theme-border rounded px-3 py-2 theme-text placeholder-theme-text-secondary focus:border-theme-accent focus:outline-none"
              placeholderText="Select start time"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-sm theme-text font-bold">End</label>
            <DatePicker
              selected={end}
              onChange={(d: Date | null) => set({ end: toLocalStr(d) })}
              showTimeSelect
              timeIntervals={60}
              dateFormat="yyyy-MM-dd HH:mm"
              className="bg-theme-card border border-theme-border rounded px-3 py-2 theme-text placeholder-theme-text-secondary focus:border-theme-accent focus:outline-none"
              placeholderText="Select end time"
              minDate={start ?? undefined}
            />
          </div>
        </>
      )}
    </div>
  );
}
