"use client";
import { useQuery } from "@tanstack/react-query";
import { fetchNext8h, fetchRange, getTerminalRanking, getMoveTypeShare, getMoveTypeHourly, getDesigHourly, getTerminalHourHeatmap, getSunburst, getHourlyTotals, getCompositionByTerminal, getTotalForecastVolume } from "@/lib/api";
import KpiStrip from "@/components/KpiStrip";
import FanChart from "@/components/FanChart";
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
import { useState } from "react";
import Composition100Stack from "@/components/Composition100Stack";
import Header from "@/components/Header";
import GateLoadStatus from "@/components/GateLoadStatus";
import ExportButton from "@/components/ExportButton";


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
  // Use local state for ranking dimension instead of URL parameter to prevent full page reload
  const [rankingDim, setRankingDim] = useState<"total" | "average">(
    (sp.get("rankingdim") || "total") as "total" | "average"
  );
  const dim = (sp.get("compdim") || "desig").toLowerCase() as "desig"|"movetype";

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

  const qComp = useQuery({
    queryKey: ["comp_by_terminal", startStr, endStr, dim, terminal, moveType, desig],
    queryFn: () => getCompositionByTerminal(startStr, endStr, dim, terminal, moveType, desig),
    refetchInterval: mode === "next8h" || mode === "today" ? 60_000 : false,
  });

  const qHourlyTotals = useQuery({
    queryKey: ["hourly_totals", startStr, endStr, terminal],
    queryFn: () => getHourlyTotals(startStr, endStr, terminal),
    refetchInterval: mode === "next8h" || mode === "today" ? 60_000 : false,
  });

  const qTotalVolume = useQuery({
    queryKey: ["total_forecast_volume", startStr, endStr, terminal, moveType, desig],
    queryFn: () => getTotalForecastVolume(startStr, endStr, terminal, moveType, desig),
    refetchInterval: mode === "next8h" || mode === "today" ? 60_000 : false,
  });

  // Calculate the number of hours in the selected time window
  const windowHours = (() => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60)));
    } catch {
      return 1; // Fallback to prevent division by zero
    }
  })();

  // Transform ranking data based on dimension selection
  const transformedRanking = qRanking.data?.ranking ? {
    ranking: qRanking.data.ranking.map((item: any) => ({
      ...item,
      total_pred: rankingDim === "average" 
        ? Math.round((item.total_pred / windowHours) * 100) / 100 // Average per hour, rounded to 2 decimals
        : item.total_pred // Keep original total
    }))
  } : null;

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

  // Hour wheel: use aggregated hourly totals (no manual aggregation needed)
  const hourList = (qHourlyTotals.data?.points || []).map(p => ({ 
    hour: p.hour, 
    pred: p.pred 
  })).sort((a,b)=>a.hour-b.hour);
  
  // Debug: Check what's happening with the Hourly Totals data
  console.log("qHourlyTotals loading:", qHourlyTotals.isLoading);
  console.log("qHourlyTotals error:", qHourlyTotals.error);
  console.log("qHourlyTotals data:", qHourlyTotals.data);
  console.log("hourList length:", hourList.length);

  return (
    <>
      <Header />
      <div className="min-h-screen theme-bg-secondary">
        {/* Fixed Sidebar - Control Panel */}
        <div className="fixed left-0 top-0 w-80 h-full pt-20 z-40" style={{ background: 'var(--theme-header-gradient, linear-gradient(135deg, #3C2E8F 0%, #2B2C7A 50%, #002F6C 100%))' }}>
          <div className="p-6">
            <FilterRail />
          </div>
        </div>

        {/* Main Content Area */}
        <div className="ml-80">
          {/* Time Controls Bar */}
          <div className="theme-bg-secondary theme-border border-b px-6 py-4">
            <div className="flex items-center justify-between">
              <TimeRange />
              <ExportButton />
            </div>
          </div>

          {/* Dashboard Content with consistent grid system - Fixed container */}
          <div className="px-6 py-6 dashboard-container">
            {isLoading && <div className="text-center py-12 theme-text-secondary text-lg">Loading dashboard data...</div>}
            {error && <div className="text-center py-12 text-red-600 text-lg">Error loading data. Please refresh.</div>}

            {data && (
              <div className="space-y-8">
                {/* ROW 1: Executive Summary KPIs - Full Width Section */}
                <section className="dashboard-row">
                  <div className="flex items-center justify-between mb-6">
                    <h1 className="text-3xl font-bold theme-text">Executive Summary</h1>
                    <div className="flex items-center gap-2 text-sm theme-text-secondary">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Live Data
                    </div>
                  </div>
                  <div className="w-full">
                    <KpiStrip data={data} capacity={capacity} flowData={qMTTrend.data?.points || []} totalVolumeData={qTotalVolume.data} />
                  </div>
                </section>

                {/* ROW 2: Demand & Capacity Trends - 2/3 + 1/3 Layout */}
                <section className="dashboard-row">
                  <h2 className="text-3xl font-bold theme-text mb-6">Demand & Capacity Trends</h2>
                  <div className="grid-12-col adaptive-row">
                    {/* Primary Forecast Chart - 8/12 columns */}
                    <div className="grid-col-8 dashboard-card-wrapper">
                      <div className="theme-card rounded-2xl p-6 shadow-lg w-full adaptive-card adaptive-card-large">
                        <div className="card-content h-full">
                          <FanChart 
                            rows={data.horizon_hours} 
                            title={mode==="custom" ? "Demand Forecast - Selected Period" : "Demand Forecast - Next 8 Hours"} 
                            capacity={capacity} 
                          />
                        </div>
                      </div>
                    </div>
                    {/* Gate Flow Status - 4/12 columns */}
                    <div className="grid-col-4 dashboard-card-wrapper">
                      <div className="theme-card rounded-2xl p-6 shadow-lg w-full adaptive-card adaptive-card-large">
                        <div className="card-content h-full">
                          <GateLoadStatus points={qMTTrend.data?.points || []} />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ROW 3: Operational Performance - 50/50 Layout */}
                <section className="dashboard-row">
                  <h2 className="text-3xl font-bold theme-text mb-6">Operational Performance</h2>
                  <div className="grid-12-col adaptive-row">
                    {/* Terminal Performance Ranking - 6/12 columns */}
                    <div className="grid-col-6 dashboard-card-wrapper">
                      <div className="theme-card rounded-2xl p-6 shadow-lg w-full adaptive-card adaptive-card-medium">
                        <div className="card-content h-full">
                          {transformedRanking && (
                            <div className="h-full flex flex-col">
                              {/* Dimension Switcher */}
                              <div className="flex items-center gap-2 text-sm mb-4 flex-shrink-0 card-header">
                                <span className="theme-text-accent font-medium">View Mode:</span>
                                <div className="flex bg-white/20 rounded-lg p-1">
                                  <button 
                                    onClick={() => setRankingDim('total')}
                                    className={`px-3 py-1 rounded-md transition-colors ${
                                      rankingDim === 'total' 
                                        ? 'bg-dp-green text-white font-medium shadow-sm' 
                                        : 'text-white hover:text-dp-green hover:bg-white/10'
                                    }`}
                                  >
                                    Total Period ({windowHours}h)
                                  </button>
                                  <button 
                                    onClick={() => setRankingDim('average')}
                                    className={`px-3 py-1 rounded-md transition-colors ${
                                      rankingDim === 'average' 
                                        ? 'bg-dp-green text-white font-medium shadow-sm' 
                                        : 'text-white hover:text-dp-green hover:bg-white/10'
                                    }`}
                                  >
                                    Hourly Average
                                  </button>
                                </div>
                              </div>
                              <div className="flex-1 min-h-0 overflow-hidden card-body">
                                <BulletRanking 
                                  totals={transformedRanking.ranking} 
                                  capacityPerHour={capacity} 
                                  hours={rankingDim === 'average' ? 1 : windowHours}
                                  subtitle={rankingDim === 'average' ? 'Average containers per hour by terminal' : `Total containers over ${windowHours}h period by terminal`}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Daily Activity Pattern - 6/12 columns */}
                    <div className="grid-col-6 dashboard-card-wrapper">
                      <div className="theme-card rounded-2xl p-6 shadow-lg w-full adaptive-card adaptive-card-medium">
                        <div className="card-content h-full">
                          <HourWheel hourly={hourList} />
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* ROW 4: Deep Dive Analysis - Side by Side Charts */}
                <section className="dashboard-row">
                  <h2 className="text-3xl font-bold theme-text mb-6">Deep Dive Analysis</h2>
                  <div className="grid-12-col gap-6">
                    {/* Gate Load Distribution by Terminal - Half width */}
                    <div className="grid-col-6 dashboard-card-wrapper">
                      <div className="theme-card rounded-2xl p-6 shadow-lg w-full adaptive-card adaptive-card-medium">
                        <div className="card-content h-full">
                          {qComp.data && (
                            <Composition100Stack dim={qComp.data.dim} rows={qComp.data.rows} />
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Peak Activity Times Heatmap - Half width */}
                    <div className="grid-col-6 dashboard-card-wrapper">
                      <div className="theme-card rounded-2xl p-6 shadow-lg w-full adaptive-card adaptive-card-medium">
                        <div className="card-content h-full">
                          {qHeat.data && <PrettyHeatmap cells={qHeat.data.cells} />}
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Optional: Operations Breakdown - Side by side when available */}
                  {qSun.data && (
                    <div className="grid-12-col mt-6">
                      <div className="grid-col-6 dashboard-card-wrapper">
                        <div className="theme-card rounded-2xl p-6 shadow-lg w-full adaptive-card adaptive-card-medium">
                          <div className="card-content h-full">
                            <CompositionSunburst data={qSun.data.sunburst} />
                          </div>
                        </div>
                      </div>
                      {qDesig.data && (
                        <div className="grid-col-6 dashboard-card-wrapper">
                          <div className="theme-card rounded-2xl p-6 shadow-lg w-full adaptive-card adaptive-card-medium">
                            <div className="card-content h-full">
                              <DesigStackedArea points={qDesig.data.points} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
