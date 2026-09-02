import React from "react";
import { Select } from "antd";
import { Wrench } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

// ============================= color helpers =============================
const hexToRgb = (hex) => {
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
};
const rgbToHex = (r, g, b) =>
  `#${[r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("")}`;
const shade = (hex, percent) => {
  const { r, g, b } = hexToRgb(hex);
  const amt = Math.round(2.55 * percent);
  return rgbToHex(r + amt, g + amt, b + amt);
};

const DEFAULT_BASE = "#0d9488";

const MODEL_COLOR_PALETTE = ["#dc2626", "#2563eb", "#7c3aed", "#db2777", "#0ea5e9", "#65a30d", "#9333ea", "#0284c7", "#0d9488", "#b45309", "#4f46e5", "#be123c"];

const hashString = (str = "") => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  return hash;
};

// Deterministic per-model color, with a guard against two DIFFERENT
// modelIds hashing to the same palette slot. If a collision is detected
// against the full list of models shown in the dropdown, the later one is
// nudged to the next unused palette slot — still deterministic given a
// fixed model list, just collision-free.
const getBaseColor = (modelId, allModelIds = []) => {
  if (!modelId) return DEFAULT_BASE;

  const baseIndex = hashString(modelId) % MODEL_COLOR_PALETTE.length;
  const usedIndices = new Map();
  allModelIds.forEach((id) => {
    if (!id) return;
    let idx = hashString(id) % MODEL_COLOR_PALETTE.length;
    while ([...usedIndices.values()].includes(idx)) {
      idx = (idx + 1) % MODEL_COLOR_PALETTE.length;
    }
    usedIndices.set(id, idx);
  });

  return MODEL_COLOR_PALETTE[usedIndices.get(modelId) ?? baseIndex];
};

const shadeForRow = (baseColor, index, total) => {
  if (total <= 1) return baseColor;
  const t = index / (total - 1);
  return shade(baseColor, t * 46 - 8);
};

const niceMax = (val) => {
  if (val <= 0) return 10;
  const pow = Math.pow(10, Math.floor(Math.log10(val)));
  const n = val / pow;
  let step;
  if (n <= 1) step = 1;
  else if (n <= 2) step = 2;
  else if (n <= 5) step = 5;
  else step = 10;
  return step * pow;
};

const TopPerformingParts = () => {
  const { topParts, topModels, modelPartLoading, selectedPartModel, handlePartModelChange, datePreset, dateRange } = useDashboard() || {};

  const modelOptions = [
    { value: "", label: "All Models" },
    ...(topModels || []).map((m) => ({ value: m.modelId, label: m.modelName })),
  ];

  const allModelIds = (topModels || []).map((m) => m.modelId);
  const baseColor = getBaseColor(selectedPartModel, allModelIds);
  const maxVal = niceMax(Math.max(...(topParts || []).map((p) => p.quantity || 0), 1) * 1.05);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm flex flex-col" style={{ height: 380 }}>
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5">
          <Wrench size={14} style={{ color: baseColor }} />
          <div>
            <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Top Performing Parts</h3>
            <p className="text-[10px] text-slate-400">Production Volume · {rangeLabelFromPreset(datePreset, dateRange)}</p>
          </div>
        </div>
        <Select
          size="small"
          style={{ width: 110 }}
          value={selectedPartModel || ""}
          onChange={handlePartModelChange}
          options={modelOptions}
        />
      </div>

      {modelPartLoading ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : !topParts?.length ? (
        <div className="flex-1 flex items-center justify-center text-slate-400 text-xs">No production data available</div>
      ) : (
        <div className="flex-1 flex flex-col gap-2.5 overflow-y-auto pt-3 pb-1">
          {topParts.map((p, i) => {
            const rowColor = shadeForRow(baseColor, i, topParts.length);
            const widthPct = Math.min(100, ((p.quantity || 0) / maxVal) * 100);
            return (
              <div key={p.partId || i} className="flex items-center gap-2">
                <span className="w-[78px] shrink-0 text-right text-[10px] font-semibold text-slate-600 truncate" title={p.partName}>
                  {p.partName}
                </span>
                <div className="flex-1 h-4 bg-slate-50 rounded-md overflow-hidden relative">
                  <div
                    className="h-full rounded-md transition-[width] duration-300 ease-out flex items-center justify-end pr-1.5"
                    style={{ width: `${widthPct}%`, background: rowColor, minWidth: widthPct > 0 ? 26 : 0 }}
                  >
                    {widthPct > 22 && (
                      <span className="text-[9px] font-bold text-white whitespace-nowrap">{p.quantity.toLocaleString()}</span>
                    )}
                  </div>
                  {widthPct <= 22 && (
                    <span
                      className="absolute top-1/2 -translate-y-1/2 text-[9px] font-bold whitespace-nowrap"
                      style={{ left: `calc(${widthPct}% + 6px)`, color: rowColor }}
                    >
                      {p.quantity.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TopPerformingParts;