// src/components/Sparkline.tsx
"use client";
import React from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  strokeWidth?: number;
  className?: string;
}

export default function Sparkline({ 
  data, 
  width = 80, 
  height = 24, 
  color = "currentColor", 
  strokeWidth = 1.5,
  className = ""
}: SparklineProps) {
  if (!data || data.length < 2) {
    return <div className={`${className}`} style={{ width, height }} />;
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1; // Prevent division by zero

  // Create SVG path data
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }).join(' ');

  return (
    <svg 
      width={width} 
      height={height} 
      className={className}
      style={{ overflow: 'visible' }}
    >
      <path
        d={points}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />
    </svg>
  );
}
