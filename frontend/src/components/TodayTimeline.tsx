"use client";
import React from "react";
import ReactECharts from "echarts-for-react";
import { ForecastPoint } from "@/lib/api";
import { useTheme } from "./ThemeProvider";

export default function TodayTimeline({ rows }:{ rows: ForecastPoint[] }) {
  const { theme } = useTheme();
  
  // Theme-aware colors
  const colors = {
    text: theme === 'light' ? '#002F6C' : '#FFFFFF',
    textSecondary: theme === 'light' ? '#3A4757' : '#B3B3B3',
    gridLines: '#B3B3B3',
    tooltipBg: theme === 'light' ? '#FFFFFF' : '#0E2F51',
    tooltipBorder: theme === 'light' ? '#002F6C20' : '#ffffff20',
    forecastBar: '#0B4FA7',
    actualLine: '#00A859'
  };

  const x = rows.map(r => new Date(r.ts).toLocaleTimeString([], {hour:"2-digit"}));
  const pred = rows.map(r => r.pred ?? 0);
  const actual = rows.map(r => (r.actual ?? null));

  const option = {
    backgroundColor: "transparent",
    grid: { 
      left: 60, 
      right: 20, 
      top: 20, 
      bottom: 40,
      containLabel: true
    },
    tooltip: { 
      trigger: "axis",
      backgroundColor: colors.tooltipBg,
      borderColor: colors.tooltipBorder,
      borderWidth: 1,
      textStyle: {
        color: colors.text,
        fontSize: 12
      }
    },
    xAxis: { 
      type: "category", 
      data: x,
      axisLine: { lineStyle: { color: colors.gridLines, width: 2 } },
      axisLabel: { 
        color: colors.text, 
        fontSize: 11, 
        fontWeight: '500' 
      }
    },
    yAxis: { 
      type: "value",
      axisLine: { lineStyle: { color: colors.gridLines, width: 2 } },
      splitLine: { lineStyle: { color: colors.gridLines, width: 1, opacity: 0.3 } },
      axisLabel: { 
        color: colors.text, 
        fontSize: 10, 
        fontWeight: '500' 
      }
    },
    series: [
      { 
        name: "Predicted", 
        type: "bar", 
        data: pred, 
        barWidth: "60%",
        itemStyle: { 
          color: colors.forecastBar,
          opacity: 0.8,
          borderColor: theme === 'light' ? '#002F6C20' : '#ffffff20',
          borderWidth: 1
        }
      },
      { 
        name: "Actual", 
        type: "line", 
        data: actual, 
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { 
          color: colors.actualLine, 
          width: 3 
        },
        itemStyle: { 
          color: colors.actualLine 
        }
      }
    ]
  };
  return (
    <div className="h-full flex flex-col">
      <h3 className="card-header" style={{ color: 'var(--theme-card-text, #002F6C)' }}>Today timeline</h3>
      <div className="card-body flex-1">
        <ReactECharts 
          option={option} 
          style={{ 
            width: '100%', 
            height: '100%',
            minHeight: '300px'
          }} 
          opts={{ renderer: 'canvas' }}
        />
      </div>
    </div>
  );
}
