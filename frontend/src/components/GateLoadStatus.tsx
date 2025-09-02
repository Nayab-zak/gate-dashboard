import React from "react";
import { 
  validateApiData, 
  calculateFlowBalance, 
  formatNumber, 
  formatPercentage,
  zeroFillHours
} from "@/lib/dataUtils";

interface GateLoadStatusProps {
  points?: Array<{date: string; hour: number; move_type: string; pred: number}>;
}

export default function GateLoadStatus({ points = [] }: GateLoadStatusProps) {
  // Validate and normalize input data
  const validatedPoints = validateApiData(points);
  
  // Process real data to create time-series for gate load status (IN vs OUT)
  const processedData = React.useMemo(() => {
    if (validatedPoints.length === 0) {
      // Return zero-filled data for 8 hours starting from current hour
      const now = new Date();
      const startTime = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}T${String(now.getHours()).padStart(2, '0')}:00:00`;
      const zeroFilled = zeroFillHours(startTime, 8, []);
      
      return zeroFilled.map((item, index) => ({
        time: `${String(now.getHours() + index).padStart(2, '0')}:00`,
        inbound: 0,
        outbound: 0,
        total: 0
      }));
    }

    // Get unique hours and sort them
    const hours = Array.from(new Set(validatedPoints.map(p => p.hour))).sort((a, b) => a - b);
    
    return hours.map(hour => {
      const hourData = validatedPoints.filter(p => p.hour === hour);
      const inbound = hourData.find(p => p.move_type === 'in')?.pred || 0;
      const outbound = hourData.find(p => p.move_type === 'out')?.pred || 0;
      const total = inbound + outbound;
      
      return {
        time: `${String(hour).padStart(2, '0')}:00`,
        inbound: total > 0 ? Math.round((inbound / total) * 100) : 0,
        outbound: total > 0 ? Math.round((outbound / total) * 100) : 0,
        total: parseFloat(formatNumber(total, 0))
      };
    });
  }, [validatedPoints]);

  // Get current status (latest time period) with guardrails
  const currentStatus = processedData.length > 0 ? processedData[processedData.length - 1] : {
    time: "00:00",
    inbound: 0,
    outbound: 0,
    total: 0
  };

  return (
    <div className="h-full">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold" style={{ color: 'var(--theme-card-text, #002F6C)' }}>Predicted Gate Flow (In vs Out)</h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#0B4FA7' }}></div>
            <span className="text-sm" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>Inbound</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#00A859' }}></div>
            <span className="text-sm" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>Outbound</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-3">
        {processedData.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            <div className="text-sm w-12 font-mono" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>{item.time}</div>
            <div className="flex-1 flex bg-white/10 rounded-full h-3 overflow-hidden">
              <div 
                className="transition-all duration-300"
                style={{ 
                  width: `${item.inbound}%`,
                  backgroundColor: '#0B4FA7' // Consistent blue
                }}
                title={`Inbound: ${item.inbound}%`}
              ></div>
              <div 
                className="transition-all duration-300"
                style={{ 
                  width: `${item.outbound}%`,
                  backgroundColor: '#00A859' // Consistent green
                }}
                title={`Outbound: ${item.outbound}%`}
              ></div>
            </div>
            <div className="text-sm w-32 text-right font-mono" style={{ color: 'var(--theme-card-text-secondary, #3A4757)' }}>
              {item.inbound}% / {item.outbound}%
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
