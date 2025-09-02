"use client";
import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [showHelp, setShowHelp] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [mounted, setMounted] = useState(false);
  
  const searchParams = useSearchParams();
  const terminal = (searchParams.get("terminal") || "T1").toUpperCase();
  const moveType = (searchParams.get("movetype") || "ALL").toUpperCase();
  const desig = (searchParams.get("desig") || "ALL").toUpperCase();

  // Set the time only on client side to avoid hydration mismatch
  useEffect(() => {
    setLastUpdated(new Date().toLocaleTimeString());
    setMounted(true);
    
    // Update time every second
    const interval = setInterval(() => {
      setLastUpdated(new Date().toLocaleTimeString());
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header className="theme-header-gradient shadow-xl border-b border-white/20 sticky top-0 z-50" style={{ background: 'var(--theme-header-gradient, linear-gradient(135deg, #3C2E8F 0%, #2B2C7A 50%, #002F6C 100%))' }}>
        <div className="px-6 py-4 flex items-center justify-between">
          {/* Left: DP World logo + dashboard name + tagline */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden border border-white/20">
                <Image 
                  src="/logo.png"
                  alt="DP World Logo"
                  width={32}
                  height={32}
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Gate Forecast Dashboard</h1>
                <p className="text-sm text-dp-silver">Real-time capacity and demand insights</p>
              </div>
            </div>
          </div>

          {/* Right: Theme toggle, Help icon, live status, version, last updated */}
          <div className="flex items-center gap-4">
            {/* Last Updated */}
            <div className="text-right">
              <div className="text-sm text-white font-medium">Last Updated</div>
              <div className="text-sm text-dp-silver">
                {mounted ? lastUpdated : "--:--:--"}
              </div>
            </div>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Help Icon */}
            <button
              onClick={() => setShowHelp(true)}
              className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-dp-silver hover:text-white hover:bg-white/20 transition-all duration-300 border border-white/20"
              title="Help & Information"
            >
              <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
              </svg>
            </button>

            {/* Live Status Badge */}
            <div className="flex items-center gap-2 px-3 py-2 bg-green-500/20 rounded-full border border-green-400/30">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-100 font-medium">Live</span>
            </div>

            {/* Version Badge */}
            <div className="px-3 py-2 bg-white/20 rounded-full border border-white/30 backdrop-blur-sm">
              <span className="text-sm font-semibold text-white">v2.1.0</span>
            </div>
          </div>
        </div>
      </header>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setShowHelp(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-dp-navy text-white p-6 rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Dashboard Help & Information</h2>
                <button
                  onClick={() => setShowHelp(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/20 transition-colors"
                >
                  <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">What This Dashboard Shows</h3>
                <p className="text-gray-600 leading-relaxed">
                  Real-time forecasts of gate token demand and terminal capacity. This predictive analytics dashboard provides 
                  insights into gate operations, capacity utilization, and terminal flow patterns to help optimize resource allocation and prevent bottlenecks.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">Who It&apos;s For</h3>
                <ul className="space-y-2 text-gray-600">
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-dp-green rounded-full"></div>
                    Terminal Operations Managers
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-dp-royal-blue rounded-full"></div>
                    Capacity Planning Teams
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-dp-navy rounded-full"></div>
                    Port Authority Decision Makers & Executives
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">How to Interpret KPIs & Alerts</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-dp-green text-white rounded-full text-sm font-semibold">Within Capacity</div>
                    <span className="text-gray-600">Operations running smoothly, no immediate action needed</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-dp-red text-white rounded-full text-sm font-semibold">Overcapacity</div>
                    <span className="text-gray-600">Capacity breach detected, immediate attention required</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="px-3 py-1 bg-dp-silver text-dp-navy rounded-full text-sm font-semibold">No Data</div>
                    <span className="text-gray-600">Information unavailable or system offline</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-2">Quick Tips:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Use time range controls to analyze different periods</li>
                  <li>• Filter by terminal, move type, or designation for focused insights</li>
                  <li>• Check the forecasting charts for proactive planning</li>
                  <li>• Monitor KPI alerts for operational efficiency</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
