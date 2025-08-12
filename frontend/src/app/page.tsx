"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchNext8h, fetchRange, getTerminalRanking, getMoveTypeShare, getMoveTypeHourly, getDesigHourly, getTerminalHourHeatmap, getSunburst } from "@/lib/api";
import KpiStrip from "@/components/KpiStrip";
import FanChart from "@/components/FanChart";
import CapacityPanel from "@/components/CapacityPanel";
import FilterRail from "@/components/FilterRail";
import TimeRange from "@/components/TimeRange";
import TodayTimeline from "@/components/TodayTimeline";
import BreakdownStack from "@/components/BreakdownStack";
import LollipopRanking from "@/components/LollipopRanking";
import MoveTypeDonut from "@/components/MoveTypeDonut";
import MoveTypeTrend from "@/components/MoveTypeTrend";
import DesigStackedArea from "@/components/DesigStackedArea";
import TerminalHourHeatmap from "@/components/TerminalHourHeatmap";
import PrettyHeatmap from "@/components/PrettyHeatmap";
import BulletRanking from "@/components/BulletRanking";
import HourWheel from "@/components/HourWheel";
import CompositionSunburst from "@/components/CompositionSunburst";
import InsightsBox from "@/components/InsightsBox";
import UtilizationGauges from "@/components/UtilizationGauges";
import { useSearchParams } from "next/navigation";

function computeWindow(mode: string, start: string, end: string) {
  if (mode === "custom" && start && end) {
    return { startStr: start, endStr: end };
  }
  if (mode === "today") {
    const now = new Date();
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:00`;
    return { startStr: toLocal(startOfDay), endStr: toLocal(endOfDay) };
  }
  // Default to next8h
  const now = new Date();
  const toLocal = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:00`;
  return { startStr: toLocal(now), endStr: toLocal(new Date(now.getTime() + 8 * 60 * 60 * 1000)) };
}

export default function Page(){
  const sp = useSearchParams();
  const terminal = (sp.get("terminal") || "T1").toUpperCase();
  const moveType = (sp.get("movetype") || "ALL").toUpperCase(); 
  const desig = (sp.get("desig") || "ALL").toUpperCase();
  const capacity = parseInt(sp.get("capacity") || "100"); // Get capacity from URL
  const modeRaw = sp.get("mode") || "next8h";
  const mode = modeRaw === "range" ? "custom" : modeRaw; // Accept old URLs
  const start = sp.get("start") || "";
  const end   = sp.get("end")   || "";

  const { data, isLoading, error } = useQuery({
    queryKey: ["forecast", mode, terminal, moveType, desig, start, end],
    queryFn: async () => {
      // Guard: only call fetchRange when both are present & valid
      const both = Boolean(start && end);
      if (mode === "custom" && both) {
        return fetchRange(terminal, start, end, moveType, desig);
      }
      if (mode === "today") {
        const r = todayRange();
        return fetchRange(terminal, r.start, r.end, moveType, desig);
      }
      return fetchNext8h(terminal, moveType, desig);
    },
    // Don’t refetch custom unless the inputs change
    refetchInterval: mode === "next8h" || mode === "today" ? 60_000 : false,
  });

  const tRange = (() => {
    const now = new Date();
    const start = new Date(now); start.setHours(0,0,0,0);
    const end   = new Date(now); end.setHours(23,0,0,0);
    // Format as 'YYYY-MM-DDTHH:mm' without timezone
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:00`;
    return { start: toLocal(start), end: toLocal(end) };
  })();

  const todayQuery = useQuery({
    queryKey: ["today", terminal, moveType, desig],
    queryFn: () => fetchRange(terminal, tRange.start, tRange.end, moveType, desig),
    refetchInterval: 60_000,
  });

  const empty = !isLoading && !error && data && data.horizon_hours.every(h => (h.pred||0)===0);

  const todayRange = () => {
    const now = new Date();
    const start = new Date(now); start.setHours(0,0,0,0);
    const end   = new Date(now); end.setHours(23,0,0,0);
    // Format as 'YYYY-MM-DDTHH:mm' without timezone
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}T${String(d.getHours()).padStart(2,'0')}:00`;
    return { start: toLocal(start), end: toLocal(end) };
  };

  const { startStr, endStr } = computeWindow(mode, start, end);

  const qRanking = useQuery({
    queryKey: ["rank", startStr, endStr, moveType, desig],
    queryFn: () => getTerminalRanking(startStr, endStr, moveType, desig),
    refetchInterval: mode === "next8h" || mode === "today" ? 60_000 : false,
  });
  const qShare = useQuery({
    queryKey: ["share", startStr, endStr, terminal, desig],
    queryFn: () => getMoveTypeShare(startStr, endStr, terminal, desig),
    refetchInterval: mode === "next8h" || mode === "today" ? 60_000 : false,
  });
  const qMTTrend = useQuery({
    queryKey: ["mt_hourly", startStr, endStr, terminal, desig],
    queryFn: () => getMoveTypeHourly(startStr, endStr, terminal, desig),
    refetchInterval: mode === "next8h" || mode === "today" ? 60_000 : false,
  });
  const qDesig = useQuery({
    queryKey: ["desig_hourly", startStr, endStr, terminal, moveType],
    queryFn: () => getDesigHourly(startStr, endStr, terminal, moveType),
    refetchInterval: mode === "next8h" || mode === "today" ? 60_000 : false,
  });
  const qHeat = useQuery({
    queryKey: ["heatmap", startStr, endStr, moveType, desig],
    queryFn: () => getTerminalHourHeatmap(startStr, endStr, moveType, desig),
    refetchInterval: mode === "next8h" || mode === "today" ? 60_000 : false,
  });

  const qSun = useQuery({
    queryKey: ["sunburst", startStr, endStr, terminal, moveType, desig],
    queryFn: () => getSunburst(startStr, endStr, terminal, moveType, desig),
    refetchInterval: mode === "next8h" || mode === "today" ? 60_000 : false,
  });

  // Compute inputs for new charts
  
  // Utilization gauges need peak utilization by terminal
  const utilItems = (qHeat.data?.cells || []).reduce((acc:any, c:any) => {
    const t = c.terminal;
    acc[t] = Math.max(acc[t]||0, c.pred);
    return acc;
  }, {});
  const utilArray = Object.entries(utilItems).map(([t, maxPred]:any) => ({
    terminal: t,
    utilizationPct: Math.min(150, Math.round((maxPred / capacity) * 100))
  }));

  // Hour wheel: collapse to hour totals (sum across terminals/types for window)
  const hourWheel = (qMTTrend.data?.points || []).reduce((m:any, p:any) => {
    m[p.hour] = (m[p.hour]||0) + p.pred; 
    return m;
  }, {});
  const hourList = Object.keys(hourWheel).map(h => ({ hour: Number(h), pred: hourWheel[h] })).sort((a,b)=>a.hour-b.hour);
  
  // Debug: Check what's happening with the MoveType hourly data
  console.log("qMTTrend loading:", qMTTrend.isLoading);
  console.log("qMTTrend error:", qMTTrend.error);
  console.log("qMTTrend data:", qMTTrend.data);
  console.log("hourList length:", hourList.length);

  return (
    <div className="grid grid-cols-[280px_1fr] gap-6 px-6 py-6">
      <FilterRail />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <TimeRange />
        </div>

        {isLoading && <div>Loading...</div>}
        {error && <div>Error loading data</div>}

        {data && (
          <>
            <KpiStrip data={data} capacity={capacity} />

            <InsightsBox forecast={data} share={qShare.data?.share} ranking={qRanking.data?.ranking} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <FanChart rows={data.horizon_hours} title={mode==="custom" ? "Forecast for selected range" : "Next 8h Forecast"} capacity={capacity} />
              <CapacityPanel rows={data.horizon_hours} capacity={capacity} />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              {qRanking.data && <BulletRanking totals={qRanking.data.ranking} capacityPerHour={capacity} hours={data.horizon_hours.length} />}
              <HourWheel hourly={hourList} />
              {qSun.data && <CompositionSunburst data={qSun.data.sunburst} />}
            </div>

            {/* Optional, keep if space allows */}
            {qHeat.data && <PrettyHeatmap cells={qHeat.data.cells} />}
          </>
        )}
      </div>
    </div>
  );
}
