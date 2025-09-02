// src/components/TimeRange.tsx
"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState, useRef, useEffect } from "react";

const modes = [
  { key: "next8h", label: "Next 8h" },
  { key: "today",  label: "Today" },
  { key: "custom", label: "Custom" },
];

// Quick preset options for common time ranges
const quickPresets = [
  { label: "Last 24h", hours: 24 },
  { label: "Last 3d", hours: 72 },
  { label: "Last week", hours: 168 },
];

// Generate hour options for dropdown
const hourOptions = Array.from({ length: 24 }, (_, i) => ({
  value: i,
  label: `${String(i).padStart(2, '0')}:00`
}));

export default function TimeRange(){
  const router = useRouter(); 
  const path = usePathname(); 
  const sp = useSearchParams();
  const mode = sp.get("mode") || "next8h";
  const startStr = sp.get("start"); 
  const endStr = sp.get("end");
  
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const start = useMemo(()=> startStr ? new Date(startStr) : null, [startStr]);
  const end   = useMemo(()=> endStr ? new Date(endStr) : null, [endStr]);

  const set = (kv: Record<string,string|null>) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(kv).forEach(([k,v]) => v===null ? next.delete(k) : next.set(k, v));
    router.replace(`${path}?${next.toString()}`, {scroll:false});
  };

  const toLocalStr = (d: Date | null) => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:00` : "";

  // Helper function to set quick presets
  const setQuickPreset = (hours: number) => {
    const now = new Date();
    const endTime = new Date(now);
    const startTime = new Date(now.getTime() - hours * 60 * 60 * 1000);
    
    set({
      mode: "custom",
      start: toLocalStr(startTime),
      end: toLocalStr(endTime)
    });
  };

  // Helper to format date for input
  const formatDateForInput = (date: Date | null) => {
    if (!date) return '';
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  // Helper to create date from date string and hour
  const createDateFromInputs = (dateStr: string, hour: number) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    date.setHours(hour, 0, 0, 0);
    return date;
  };

  // Format display text for the current selection
  const getDisplayText = () => {
    if (mode === "next8h") return "Next 8 Hours";
    if (mode === "today") return "Today (00:00-23:00)";
    if (mode === "custom" && start && end) {
      const duration = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60));
      return `${start.toLocaleDateString()} ${String(start.getHours()).padStart(2, '0')}:00 → ${end.toLocaleDateString()} ${String(end.getHours()).padStart(2, '0')}:00 (${duration}h)`;
    }
    return "Select Time Range";
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Compact Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-3 py-2.5 bg-dp-navy/80 border border-white/30 rounded-md hover:bg-white/10 transition-colors text-white text-sm font-medium w-full"
      >
        <svg className="w-4 h-4 text-white/80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="flex-1 text-left truncate text-xs">{getDisplayText()}</span>
        <svg 
          className={`w-4 h-4 text-white/60 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-[380px] bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
          {/* Mode Selection */}
          <div className="p-4 border-b border-gray-100">
            <div className="grid grid-cols-3 gap-2">
              {modes.map(m => (
                <button
                  key={m.key}
                  onClick={() => {
                    set({ mode: m.key });
                    if (m.key !== "custom") {
                      setIsOpen(false);
                    }
                  }}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    mode === m.key 
                      ? "bg-green-500 text-white" 
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Mode Details */}
          {mode === "custom" && (
            <div className="p-4 space-y-4">
              {/* Quick Presets */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-2 uppercase tracking-wide">Quick Select</label>
                <div className="grid grid-cols-3 gap-2">
                  {quickPresets.map((preset, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setQuickPreset(preset.hours);
                        setIsOpen(false);
                      }}
                      className="px-3 py-2 text-xs bg-gray-50 text-gray-700 border border-gray-200 rounded hover:bg-green-50 hover:border-green-300 hover:text-green-700 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Date/Time Selection */}
              <div className="grid grid-cols-2 gap-4">
                {/* Start Date/Time */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">Start Time</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={formatDateForInput(start)}
                      onChange={(e) => {
                        const hour = start?.getHours() || 0;
                        const newDate = createDateFromInputs(e.target.value, hour);
                        set({ start: toLocalStr(newDate) });
                      }}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                    <select
                      value={start?.getHours() || 0}
                      onChange={(e) => {
                        const dateStr = formatDateForInput(start);
                        if (dateStr) {
                          const newDate = createDateFromInputs(dateStr, parseInt(e.target.value));
                          set({ start: toLocalStr(newDate) });
                        }
                      }}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    >
                      {hourOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* End Date/Time */}
                <div className="space-y-2">
                  <label className="block text-xs font-medium text-gray-600 uppercase tracking-wide">End Time</label>
                  <div className="space-y-2">
                    <input
                      type="date"
                      value={formatDateForInput(end)}
                      min={formatDateForInput(start)}
                      onChange={(e) => {
                        const hour = end?.getHours() || 23;
                        const newDate = createDateFromInputs(e.target.value, hour);
                        set({ end: toLocalStr(newDate) });
                      }}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    />
                    <select
                      value={end?.getHours() || 23}
                      onChange={(e) => {
                        const dateStr = formatDateForInput(end);
                        if (dateStr) {
                          const newDate = createDateFromInputs(dateStr, parseInt(e.target.value));
                          set({ end: toLocalStr(newDate) });
                        }
                      }}
                      className="w-full bg-white border border-gray-300 rounded px-3 py-2 text-sm text-gray-900 focus:border-green-500 focus:ring-1 focus:ring-green-500"
                    >
                      {hourOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Selected Range Summary */}
              {start && end && (
                <div className="p-3 bg-green-50 rounded-md border border-green-200">
                  <div className="text-sm text-green-900">
                    <div className="font-medium">Selected Range:</div>
                    <div className="text-green-700 mt-1">
                      {start.toLocaleDateString()} {String(start.getHours()).padStart(2, '0')}:00 
                      {' → '}
                      {end.toLocaleDateString()} {String(end.getHours()).padStart(2, '0')}:00
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Duration: {Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60))} hours
                    </div>
                  </div>
                </div>
              )}

              {/* Apply Button */}
              <div className="flex justify-end pt-2 border-t border-gray-100">
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded-md hover:bg-green-600 transition-colors"
                >
                  Apply
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
