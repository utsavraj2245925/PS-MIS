import React from "react";

const TONE = {
  blue:   { bg: "#eff6ff", border: "#bfdbfe", val: "#1d4ed8", ic: "#93c5fd", circle: "#dbeafe" },
  red:    { bg: "#fff1f2", border: "#fecdd3", val: "#dc2626", ic: "#fca5a5", circle: "#fee2e2" },
  amber:  { bg: "#fffbeb", border: "#fde68a", val: "#d97706", ic: "#fcd34d", circle: "#fef3c7" },
  green:  { bg: "#f0fdf4", border: "#bbf7d0", val: "#16a34a", ic: "#86efac", circle: "#dcfce7" },
  teal:   { bg: "#f0fdfa", border: "#99f6e4", val: "#0d9488", ic: "#5eead4", circle: "#ccfbf1" },
  cyan:   { bg: "#ecfeff", border: "#a5f3fc", val: "#0e7490", ic: "#67e8f9", circle: "#cffafe" },
  slate:  { bg: "#f8fafc", border: "#e2e8f0", val: "#334155", ic: "#94a3b8", circle: "#f1f5f9" },
};

const KPICard = ({ icon: Icon, label, value, suffix = "", tone = "slate" }) => {
  const t = TONE[tone] || TONE.slate;

  return (
    <div
      className="relative rounded-xl border p-2.5 overflow-hidden flex flex-col justify-between min-h-[86px] transition-transform duration-150 hover:-translate-y-0.5"
      style={{ background: t.bg, borderColor: t.border }}
    >
      <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full opacity-60" style={{ background: t.circle }} />
      <div className="relative flex items-center justify-between">
        <span className="text-[8px] font-bold uppercase tracking-wide text-slate-500 leading-tight pr-1">{label}</span>
        {Icon && (
          <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: t.circle }}>
            <Icon size={11} style={{ color: t.ic }} />
          </div>
        )}
      </div>
      <div className="relative text-lg font-black leading-none tabular-nums mt-1" style={{ color: t.val }}>
        {value}
        {suffix && <span className="text-[10px] font-semibold ml-0.5 opacity-80">{suffix}</span>}
      </div>
    </div>
  );
};

export default KPICard;