import React from "react";

/* Circular progress ring for the two hero metrics (OEE, Achievement %).
   Pure SVG, no chart library — stroke-dasharray driven by percent. */
const GaugeRing = ({ percent = 0, color = "#0d9488", size = 92, strokeWidth = 8, label }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(percent, 100));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex flex-col items-center justify-center flex-shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e2e8f0" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <text x="50%" y="50%" textAnchor="middle" dominantBaseline="central" fontSize={size * 0.22} fontWeight="800" fill="#1e293b">
          {clamped}%
        </text>
      </svg>
      {label && <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">{label}</div>}
    </div>
  );
};

export default GaugeRing;