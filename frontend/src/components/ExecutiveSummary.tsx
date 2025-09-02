import React from "react";
import { Next8HResponse } from "@/lib/api";

interface ExecutiveSummaryProps {
  data: Next8HResponse;
  capacity: number;
}

export default function ExecutiveSummary({ data, capacity }: ExecutiveSummaryProps) {
  const overloadHours = data.horizon_hours.filter(h => (h.pred || 0) > capacity).length;
  const peakHour = data.horizon_hours.reduce((max, hour) => 
    (hour.pred || 0) > (max.pred || 0) ? hour : max, data.horizon_hours[0]);
  
  const generateSummary = () => {
    if (overloadHours === 0) {
      return "All systems operating within capacity. No immediate alerts detected in the next 8 hours.";
    } else if (overloadHours < 3) {
      const peakTime = new Date(peakHour.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return `Forecast indicates ${overloadHours} alert${overloadHours > 1 ? 's' : ''} in next 8h. Peak expected at ${peakTime} with ${Math.round(peakHour.pred || 0)} containers.`;
    } else {
      return `High risk: ${overloadHours} hours exceeding capacity. Immediate resource reallocation recommended for optimal terminal performance.`;
    }
  };

  const getBackgroundColor = () => {
    if (overloadHours >= 3) return "bg-red-500/20 border-red-400/30";
    if (overloadHours > 0) return "bg-red-400/20 border-red-300/30";
    return "bg-green-500/20 border-green-400/30";
  };

  const getTextColor = () => {
    if (overloadHours >= 3) return "text-red-300";
    if (overloadHours > 0) return "text-red-200";
    return "text-green-200";
  };

  return (
    <div className={`rounded-xl p-6 border ${getBackgroundColor()} mb-6 bg-dp-navy`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          <div className={`w-3 h-3 rounded-full ${
            overloadHours >= 3 ? 'bg-red-500' :
            overloadHours > 0 ? 'bg-red-400' :
            'bg-green-500'
          }`}></div>
        </div>
        <div>
          <h3 className="font-semibold text-white mb-1">Executive Summary</h3>
          <p className={`text-sm ${getTextColor()}`}>
            {generateSummary()}
          </p>
        </div>
      </div>
    </div>
  );
}
