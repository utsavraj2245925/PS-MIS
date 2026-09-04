import React, { useRef, useState } from "react";
import { Progress, Tooltip } from "antd";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const TONE = {
  blue:  { bg: "#eff6ff", border: "#bfdbfe", val: "#1d4ed8", circle: "#dbeafe", glow: "37,99,235" },
  red:   { bg: "#fff1f2", border: "#fecdd3", val: "#dc2626", circle: "#fee2e2", glow: "220,38,38" },
  amber: { bg: "#fffbeb", border: "#fde68a", val: "#d97706", circle: "#fef3c7", glow: "217,119,6" },
  green: { bg: "#f0fdf4", border: "#bbf7d0", val: "#16a34a", circle: "#dcfce7", glow: "22,163,74" },
  teal:  { bg: "#f0fdfa", border: "#99f6e4", val: "#0d9488", circle: "#ccfbf1", glow: "13,148,136" },
  cyan:  { bg: "#ecfeff", border: "#a5f3fc", val: "#0e7490", circle: "#cffafe", glow: "14,116,144" },
  slate: { bg: "#f8fafc", border: "#e2e8f0", val: "#334155", circle: "#f1f5f9", glow: "51,65,85" },
};

const KPICard = ({
  icon: Icon,
  label,
  value,
  suffix = "",
  tone = "slate",
  trend,
  invertTrend = false,
  progress,
  helper,
}) => {
  const t = TONE[tone] || TONE.slate;
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 30 });
  const [active, setActive] = useState(false);

  const handleMove = (e) => {
    const el = cardRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    setTilt({ rx: (0.5 - py) * 9, ry: (px - 0.5) * 12 });
    setGlow({ x: px * 100, y: py * 100 });
  };
  const handleLeave = () => {
    setActive(false);
    setTilt({ rx: 0, ry: 0 });
  };

  const hasTrend = typeof trend === "number" && !Number.isNaN(trend);
  const trendFlat = hasTrend && trend === 0;
  const trendGood = hasTrend && (invertTrend ? trend <= 0 : trend >= 0);
  const trendColor = trendFlat ? "#64748b" : trendGood ? "#16a34a" : "#dc2626";
  const trendBg = trendFlat ? "#f1f5f9" : trendGood ? "#f0fdf4" : "#fef2f2";
  const ArrowIcon = trendFlat ? Minus : trend > 0 ? TrendingUp : TrendingDown;

  const hasProgress = typeof progress === "number" && !Number.isNaN(progress);

  return (
    <div
      style={{ perspective: 800, containerType: "inline-size" }}
      className="group relative flex-1 flex-shrink-0 basis-[104px] min-w-[104px] max-w-[172px] snap-start"
    >
      <div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseEnter={() => setActive(true)}
        onMouseLeave={handleLeave}
        className="relative rounded-2xl overflow-hidden flex flex-col justify-between min-h-[100px]"
        style={{
          transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) translateZ(${active ? 4 : 0}px)`,
          transformStyle: "preserve-3d",
          transition: active ? "transform 90ms linear, box-shadow 200ms ease" : "transform 450ms cubic-bezier(0.23,1,0.32,1), box-shadow 300ms ease",
          background: `linear-gradient(160deg, #ffffff 0%, #ffffff 38%, ${t.bg} 100%)`,
          border: `1px solid ${t.border}`,
          boxShadow: active
            ? `0 2px 3px rgba(15,23,42,0.06), 0 18px 30px -12px rgba(${t.glow},0.34), 0 30px 50px -22px rgba(${t.glow},0.30), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -14px 20px -16px rgba(${t.glow},0.18)`
            : `0 1px 2px rgba(15,23,42,0.05), 0 8px 16px -8px rgba(${t.glow},0.20), 0 16px 30px -20px rgba(${t.glow},0.20), inset 0 1px 0 rgba(255,255,255,0.9)`,
        }}
      >
        {/* glass sheen that follows the pointer */}
        <div
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(255,255,255,0.55), transparent 55%)`,
          }}
        />
        <div
          className="absolute top-0 left-0 right-0 h-[42%] opacity-70 pointer-events-none"
          style={{ background: "linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 100%)" }}
        />
        <div
          className="absolute -bottom-5 -right-5 w-20 h-20 rounded-full opacity-35 pointer-events-none blur-lg transition-opacity duration-300 group-hover:opacity-55"
          style={{ background: t.circle }}
        />

        <div className="relative flex items-start justify-between gap-1 p-2.5 pb-0 min-w-0">
          <Tooltip title={label} mouseEnterDelay={0.4}>
            <span
              className="font-bold uppercase tracking-wide text-slate-500 min-w-0 cursor-default"
              style={{
                fontSize: "clamp(6px, 6.4cqw, 8.5px)",
                lineHeight: 1.25,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {label}
            </span>
          </Tooltip>

          {hasProgress ? (
            <Progress
              type="circle"
              percent={Math.max(0, Math.min(100, progress))}
              size={22}
              strokeWidth={12}
              strokeColor={t.val}
              trailColor={t.circle}
              format={() => ""}
              className="flex-shrink-0"
            />
          ) : (
            Icon && (
              <div
                className="w-[20px] h-[20px] rounded-lg flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110"
                style={{
                  background: `linear-gradient(145deg, #ffffff 0%, ${t.circle} 100%)`,
                  boxShadow: `0 2px 5px rgba(${t.glow},0.3), inset 0 1px 0 rgba(255,255,255,0.9), inset 0 -2px 3px rgba(${t.glow},0.15), 0 0 0 1px ${t.border}`,
                }}
              >
                <Icon size={10} style={{ color: t.val }} />
              </div>
            )
          )}
        </div>

        <div className="relative px-2.5 pb-2.5 pt-1 min-w-0">
          <div className="flex items-end justify-between gap-1 min-w-0">
            <Tooltip title={`${value}${suffix}`} mouseEnterDelay={0.4}>
              <div
                className="font-black leading-none tabular-nums whitespace-nowrap overflow-hidden text-ellipsis cursor-default"
                style={{ color: t.val, fontSize: "clamp(10px, 15cqw, 18px)", letterSpacing: "-0.02em" }}
              >
                {value}
                {suffix && (
                  <span style={{ fontSize: "0.6em" }} className="font-semibold ml-0.5 opacity-80">
                    {suffix}
                  </span>
                )}
              </div>
            </Tooltip>

            {hasTrend && (
              <div
                className="flex items-center gap-[2px] rounded-full px-[5px] py-[1.5px] flex-shrink-0"
                style={{ background: trendBg, color: trendColor }}
              >
                <ArrowIcon size={8} strokeWidth={3} />
                <span className="font-bold" style={{ fontSize: "clamp(5.5px, 5.6cqw, 7.5px)" }}>
                  {Math.abs(trend)}%
                </span>
              </div>
            )}
          </div>

          {helper && (
            <div className="text-slate-400 font-medium mt-[3px] truncate" style={{ fontSize: "clamp(5.5px, 5.6cqw, 7.5px)" }}>
              {helper}
            </div>
          )}
        </div>
      </div>

      {/* floor shadow — sells the "lifted card" illusion independent of the tilt */}
      <div
        className="absolute left-3 right-3 -bottom-2 h-3 rounded-full blur-md -z-10 transition-opacity duration-300"
        style={{ background: `rgba(${t.glow},0.28)`, opacity: active ? 0.9 : 0.5 }}
      />
    </div>
  );
};

export default KPICard;