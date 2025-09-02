"use client";

import React from "react";
import html2canvas from "html2canvas";
import JSZip from "jszip";
import dayjs from "dayjs";

type ChartTarget =
  | { title: string; selector: string }                       // capture any DOM node
  | { title: string; selector: string; type: "canvas" }       // capture <canvas>
  | { title: string; echartsGetter: () => any };              // capture ECharts via getDataURL()

type Props = {
  // What to print on title slide
  reportTitle?: string;      // e.g. "DP World – Capacity & Gate Flow Insights"
  reportSub?: string;        // e.g. "Forecasting peak demand, alerts, and flow patterns…"

  // Filters for filename and summary
  filters: {
    terminal: string;
    dateRange: string;       // "2024-07-09 00:00 → 2024-07-10 07:00"
    mode?: string;           // Latest / Custom
    capacity?: string;       // "50 tokens/hr"
  };

  // KPI values to include in summary
  kpis: Array<{ label: string; value: string }>;

  // What charts/sections to capture
  targets: ChartTarget[];
};

// Capture any HTMLElement by CSS selector
async function captureNode(selector: string): Promise<Blob> {
  const el = document.querySelector(selector) as HTMLElement | null;
  if (!el) throw new Error(`Element not found: ${selector}`);
  const canvas = await html2canvas(el, {
    backgroundColor: null,    // keep transparency
    scale: 2,                 // sharper images
    useCORS: true,
  });
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else throw new Error("Failed to create blob from canvas");
    }, "image/png");
  });
}

// Capture a <canvas> directly (Chart.js etc.)
async function captureCanvas(selector: string): Promise<Blob> {
  const canvas = document.querySelector(selector) as HTMLCanvasElement | null;
  if (!canvas) throw new Error(`Canvas not found: ${selector}`);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else throw new Error("Failed to create blob from canvas");
    }, "image/png");
  });
}

// Capture ECharts via instance.getDataURL()
async function captureEcharts(getter: () => any): Promise<Blob> {
  const inst = getter?.();
  if (!inst || !inst.getDataURL) throw new Error("Invalid ECharts getter()");
  const dataUrl = inst.getDataURL({ pixelRatio: 2, backgroundColor: "transparent" });
  
  // Convert data URL to blob
  const response = await fetch(dataUrl);
  return await response.blob();
}

// Create a summary text file
function createSummaryText(reportTitle: string, reportSub: string, filters: Props['filters'], kpis: Props['kpis']): string {
  const lines = [
    reportTitle,
    "=".repeat(reportTitle.length),
    "",
    reportSub,
    "",
    "REPORT DETAILS",
    "--------------",
    `Terminal: ${filters.terminal}`,
    `Date Range: ${filters.dateRange}`,
    filters.mode ? `Mode: ${filters.mode}` : "",
    filters.capacity ? `Capacity: ${filters.capacity}` : "",
    `Generated: ${dayjs().format("YYYY-MM-DD HH:mm")}`,
    "",
    "KEY PERFORMANCE INDICATORS",
    "-------------------------",
    ...kpis.map(kpi => `${kpi.label}: ${kpi.value}`),
    "",
    "Charts and visualizations are included as separate PNG images.",
    "",
    "For questions about this report, contact the DP World analytics team.",
  ].filter(Boolean);
  
  return lines.join("\n");
}

export default function ExportReportButton({
  reportTitle = "DP World – Capacity & Gate Flow Insights",
  reportSub = "Forecasting peak demand, alerts, and flow patterns for smarter terminal operations.",
  filters,
  kpis,
  targets,
}: Props) {
  const [isExporting, setIsExporting] = React.useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const zip = new JSZip();
      
      // Add summary text file
      const summaryText = createSummaryText(reportTitle, reportSub, filters, kpis);
      zip.file("00_Report_Summary.txt", summaryText);
      
      // Capture and add charts
      for (let i = 0; i < targets.length; i++) {
        const target = targets[i];
        let blob: Blob;
        
        if ("echartsGetter" in target) {
          blob = await captureEcharts(target.echartsGetter);
        } else if ("type" in target && target.type === "canvas") {
          blob = await captureCanvas(target.selector);
        } else {
          blob = await captureNode(target.selector);
        }
        
        // Add with numbered filename for logical ordering
        const fileName = `${String(i + 1).padStart(2, '0')}_${target.title.replace(/[^a-zA-Z0-9]/g, '_')}.png`;
        zip.file(fileName, blob);
      }
      
      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: "blob" });
      const fileName = `DPW_Capacity_GateFlow_${filters.terminal}_${dayjs().format("YYYYMMDD_HHmm")}.zip`;
      
      // Create download link
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
    } catch (err: any) {
      console.error("Export report failed:", err);
      alert(`Export failed: ${err?.message ?? err}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="rounded-md px-3 py-2 text-sm font-medium disabled:opacity-50"
      style={{ background: "#0B4FA7", color: "#fff" }}
      title="Export current view as image collection"
    >
      {isExporting ? "Exporting..." : "Export Report"}
    </button>
  );
}