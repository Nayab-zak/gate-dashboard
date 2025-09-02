// src/components/MoveTypeDonut.tsx
"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { useTheme } from "./ThemeProvider";

export default function MoveTypeDonut({ share }:{ share: Record<"IN"|"OUT", number> }) {
  const { theme } = useTheme();
  
  // Theme-aware colors
  const colors = {
    title: theme === 'light' ? '#002F6C' : '#f1f5f9',
    subtitle: theme === 'light' ? '#3A4757' : '#cbd5e1',
    text: theme === 'light' ? '#002F6C' : '#e2e8f0',
    textMuted: theme === 'light' ? '#B3B3B3' : '#64748b',
    tooltipBg: theme === 'light' ? '#FFFFFF' : '#1f2937',
    tooltipBorder: theme === 'light' ? '#002F6C20' : '#374151',
    tooltipText: theme === 'light' ? '#002F6C' : '#f9fafb',
    centerText: theme === 'light' ? '#002F6C' : '#f1f5f9',
    emptyState: theme === 'light' ? '#B3B3B3' : '#374151'
  };

  // Check for empty data
  const isEmpty = !share || (share.IN === 0 && share.OUT === 0) || (!share.IN && !share.OUT);
  const total = (share?.IN || 0) + (share?.OUT || 0);
  
  let pieData: any[];
  
  if (isEmpty) {
    // Create empty skeleton data
    pieData = [
      { value: 1, name: "No Data", itemStyle: { color: colors.emptyState, opacity: 0.3 } }
    ];
  } else {
    pieData = [
      { 
        value: share.IN || 0, 
        name: "IN",
        itemStyle: { color: '#0B4FA7' } // Theme accent blue
      },
      { 
        value: share.OUT || 0, 
        name: "OUT",
        itemStyle: { color: '#00A859' } // Theme success green
      },
    ];
  }
  
  const option = {
    backgroundColor: 'transparent',
    title: { 
      text: "MoveType share", 
      subtext: isEmpty ? "No move type data" : "",
      left: "center", 
      top: 10, 
      textStyle: { 
        color: colors.title, 
        fontSize: 14,
        fontWeight: 'bold'
      },
      subtextStyle: { 
        color: colors.subtitle, 
        fontSize: 10
      }
    },
    tooltip: isEmpty ? { show: false } : { 
      trigger: "item",
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: colors.tooltipText,
        fontSize: 12
      },
      formatter: (params: any) => {
        return `<strong>${params.name}</strong><br/>Count: <span style="color: #0B4FA7">${params.value}</span><br/>Share: <span style="color: #00A859">${params.percent}%</span>`;
      }
    },
    series: [{
      type: "pie", 
      radius: ["55%","80%"], 
      avoidLabelOverlap: false,
      label: { 
        color: isEmpty ? colors.textMuted : colors.text, 
        formatter: isEmpty ? "" : "{b}: {d}%",
        fontSize: 11,
        fontWeight: '500'
      },
      data: pieData,
      silent: isEmpty
    }],
    graphic: total > 0 && !isEmpty ? [{
      type: "text", 
      left: "center", 
      top: "45%", 
      style: { 
        text: `${Math.round(total)}`, 
        fill: colors.centerText, 
        fontSize: 18, 
        fontWeight: 600 
      }
    }] : isEmpty ? [{
      type: "text", 
      left: "center", 
      top: "45%", 
      style: { 
        text: "No Data", 
        fill: colors.textMuted, 
        fontSize: 14, 
        fontWeight: 400 
      }
    }] : []
  };
  
  return (
    <div className="card relative">
      <h3 style={{ color: 'var(--theme-card-text, #002F6C)' }}>MoveType share</h3>
      <ReactECharts option={option} style={{height: 320}} />
      {isEmpty && (
        <div className="absolute inset-0 top-12 flex items-center justify-center pointer-events-none z-10">
          <div className="bg-theme-card/90 backdrop-blur-sm rounded-lg p-4 border border-theme-border">
            <div className="text-sm text-center font-medium" style={{ color: 'var(--theme-card-text, #002F6C)' }}>
              No move type data available
            </div>
            <div className="text-xs mt-1 text-center" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>
              Adjust time range or filters
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
