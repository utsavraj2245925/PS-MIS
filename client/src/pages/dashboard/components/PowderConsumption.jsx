import React from "react";
import { Select } from "antd";
import { Droplets, AlertTriangle } from "lucide-react";
import { useDashboard } from "../../../context/DashboardContext";
import { rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const PowderConsumption = () => {
  const {
    powderConsumption, paintShopLoading, selectedPowderMaterial, handlePowderMaterialChange,
    datePreset, dateRange,
  } = useDashboard() || {};

  const { materials = [], total = 0, unit = "", mixedUnits } = powderConsumption || {};
  const options = [
    { value: "", label: "All Powder Types" },
    ...materials.map((m) => ({ value: m.materialId, label: m.name })),
  ];
  const maxQty = materials[0]?.quantity || 1;

  return (
    <div
      className="relative rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 via-white to-white p-3 shadow-sm flex flex-col overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
      style={{ height: 380 }}
    >
      <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full bg-orange-100/50" />

      <div className="relative flex items-start justify-between gap-2 mb-1">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
            <Droplets size={14} className="text-orange-600" />
          </div>
          <div>
            <h3 className="text-[13px] font-semibold text-slate-700 leading-tight">Powder Consumption</h3>
            <p className="text-[10px] text-slate-400">{rangeLabelFromPreset(datePreset, dateRange)}</p>
          </div>
        </div>
        <Select
          size="small"
          style={{ width: 128 }}
          value={selectedPowderMaterial || ""}
          onChange={handlePowderMaterialChange}
          options={options}
          className="[&_.ant-select-selector]:!rounded-lg [&_.ant-select-selector]:!border-orange-200"
        />
      </div>

      {paintShopLoading ? (
        <div className="relative flex-1 flex items-center justify-center text-slate-400 text-xs">Loading...</div>
      ) : (
        <>
          <div className="relative flex flex-col items-center justify-center py-2">
            <span className="text-4xl font-black tabular-nums bg-gradient-to-br from-orange-600 to-orange-400 bg-clip-text text-transparent">
              {total.toLocaleString()}
            </span>
            <span className="text-xs font-semibold text-orange-700/70 mt-1.5 px-2 py-0.5 rounded-full bg-orange-50 border border-orange-100">
              {unit || "—"}
            </span>
            {mixedUnits && (
              <span className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5">
                <AlertTriangle size={10} /> Mixed units — see breakdown
              </span>
            )}
          </div>

          {!selectedPowderMaterial && materials.length > 0 && (
            <div className="relative flex-1 overflow-y-auto space-y-2 mt-1 pr-0.5">
              {materials.map((m) => (
                <div key={m.materialId} className="text-[10px]">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-slate-600 truncate">{m.name}</span>
                    <span className="font-semibold text-slate-700">{m.quantity.toLocaleString()} {m.unit}</span>
                  </div>
                  <div className="h-1.5 bg-orange-50 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-[width] duration-500 ease-out"
                      style={{ width: `${Math.min((m.quantity / maxQty) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {!selectedPowderMaterial && materials.length === 0 && (
            <div className="relative flex-1 flex items-center justify-center text-[11px] text-slate-400">No powder consumption in this range</div>
          )}
        </>
      )}
    </div>
  );
};

export default PowderConsumption;