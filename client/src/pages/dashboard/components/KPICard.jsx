import React from "react";

const TONE = {
  blue:   { bg: "#eff6ff", border: "#bfdbfe", val: "#1d4ed8", ic: "#93c5fd", circle: "#dbeafe", glow: "37,99,235" },
  red:    { bg: "#fff1f2", border: "#fecdd3", val: "#dc2626", ic: "#fca5a5", circle: "#fee2e2", glow: "220,38,38" },
  amber:  { bg: "#fffbeb", border: "#fde68a", val: "#d97706", ic: "#fcd34d", circle: "#fef3c7", glow: "217,119,6" },
  green:  { bg: "#f0fdf4", border: "#bbf7d0", val: "#16a34a", ic: "#86efac", circle: "#dcfce7", glow: "22,163,74" },
  teal:   { bg: "#f0fdfa", border: "#99f6e4", val: "#0d9488", ic: "#5eead4", circle: "#ccfbf1", glow: "13,148,136" },
  cyan:   { bg: "#ecfeff", border: "#a5f3fc", val: "#0e7490", ic: "#67e8f9", circle: "#cffafe", glow: "14,116,144" },
  slate:  { bg: "#f8fafc", border: "#e2e8f0", val: "#334155", ic: "#94a3b8", circle: "#f1f5f9", glow: "51,65,85" },
};

const KPICard = ({ icon: Icon, label, value, suffix = "", tone = "slate" }) => {
  const t = TONE[tone] || TONE.slate;

  return (
    <div
      className="group relative rounded-2xl overflow-hidden flex flex-col justify-between min-h-[96px]
        flex-1 flex-shrink-0 basis-[102px] min-w-[102px] max-w-[168px] snap-start
        transition-all duration-200 ease-out
        hover:-translate-y-1"
      style={{
        containerType: "inline-size", // ties all font sizing below to THIS card's own rendered width, never the viewport
        background: `linear-gradient(180deg, #ffffff 0%, ${t.bg} 100%)`,
        border: `1px solid ${t.border}`,
        boxShadow: `
          0 1px 2px rgba(15,23,42,0.04),
          0 6px 14px -6px rgba(${t.glow},0.18),
          0 14px 28px -18px rgba(${t.glow},0.22),
          inset 0 1px 0 rgba(255,255,255,0.9)
        `,
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[40%] opacity-70 pointer-events-none"
        style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.85) 0%, rgba(255,255,255,0) 100%)" }}
      />
      <div
        className="absolute -bottom-4 -right-4 w-16 h-16 rounded-full opacity-40 pointer-events-none blur-md"
        style={{ background: t.circle }}
      />

      <div className="relative flex items-start justify-between gap-1 p-2.5 pb-0 min-w-0">
        <span
          className="font-bold uppercase tracking-wide text-slate-500 min-w-0"
          style={{ fontSize: "clamp(6px, 6.4cqw, 8.5px)", lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}
        >
          {label}
        </span>
        {Icon && (
          <div
            className="w-[20px] h-[20px] rounded-lg flex items-center justify-center flex-shrink-0"
            style={{
              background: `linear-gradient(145deg, #ffffff 0%, ${t.circle} 100%)`,
              boxShadow: `0 2px 4px rgba(${t.glow},0.25), inset 0 1px 0 rgba(255,255,255,0.8)`,
            }}
          >
            <Icon size={10} style={{ color: t.val }} />
          </div>
        )}
      </div>

      <div
        className="relative font-black leading-none tabular-nums px-2.5 pb-2.5 pt-1 min-w-0 whitespace-nowrap overflow-hidden text-ellipsis"
        style={{ color: t.val, fontSize: "clamp(10px, 15cqw, 18px)" }}
        title={`${value}${suffix}`}
      >
        {value}
        {suffix && <span style={{ fontSize: "0.6em" }} className="font-semibold ml-0.5 opacity-80">{suffix}</span>}
      </div>
    </div>
  );
};

export default KPICard;