import axios from "axios";
const base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
export const api = axios.create({ baseURL: base, withCredentials: false });

export type ForecastPoint = {
  ts: string; move_type: string; desig: string; terminal_id: string;
  pred: number; actual?: number; lower?: number; upper?: number;
};
export type Next8HResponse = {
  horizon_hours: ForecastPoint[];
  generated_at: string;
  updated_at: string;
  capacity_per_hour: number;
};

export async function fetchNext8h(terminal: string, moveType?: string, desig?: string) {
  try {
    const params: any = { terminal_id: terminal };
    if (moveType) params.move_type = moveType;
    if (desig) params.desig = desig;
    const r = await api.get<Next8HResponse>("/forecast/next8h", { params });
    return r.data;
  } catch (e: any) {
    // TEMP: help debug in browser console
    console.error("fetchNext8h error:", e?.response?.status, e?.response?.data || e?.message);
    throw e;
  }
}

export async function fetchRange(terminal: string, startIso: string, endIso: string, moveType?: string, desig?: string) {
  const params: any = { terminal_id: terminal, start_iso: startIso, end_iso: endIso };
  if (moveType) params.move_type = moveType;
  if (desig) params.desig = desig;
  const r = await api.get<Next8HResponse>("/forecast/range", { params });
  return r.data;
}

export async function fetchEnums() {
  const r = await api.get("/meta/enums");
  return r.data as { terminals: string[]; move_types: string[]; desigs: string[] };
}
// src/lib/api.ts
export async function getTerminalRanking(start: string, end: string, moveType: string, desig: string) {
  const r = await api.get("/analytics/terminal_ranking", { params: { start_iso: start, end_iso: end, move_type: moveType, desig }});
  return r.data as { ranking: { terminal: string; total_pred: number }[] };
}
export async function getMoveTypeShare(start: string, end: string, terminal: string, desig: string) {
  const r = await api.get("/analytics/movetype_share", { params: { start_iso: start, end_iso: end, terminal_id: terminal, desig }});
  return r.data as { share: Record<"IN"|"OUT", number> };
}
export async function getMoveTypeHourly(start: string, end: string, terminal: string, desig: string) {
  const r = await api.get("/analytics/movetype_hourly", { params: { start_iso: start, end_iso: end, terminal_id: terminal, desig }});
  return r.data as { points: { date: string; hour: number; move_type: string; pred: number }[] };
}
export async function getDesigHourly(start: string, end: string, terminal: string, moveType: string) {
  const r = await api.get("/analytics/desig_hourly", { params: { start_iso: start, end_iso: end, terminal_id: terminal, move_type: moveType }});
  return r.data as { points: { date: string; hour: number; desig: string; pred: number }[] };
}
export async function getTerminalHourHeatmap(start: string, end: string, moveType: string, desig: string) {
  const r = await api.get("/analytics/terminal_hour_heatmap", { params: { start_iso: start, end_iso: end, move_type: moveType, desig }});
  return r.data as { cells: { terminal: string; hour: number; pred: number }[] };
}
