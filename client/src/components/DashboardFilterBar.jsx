import { Select, DatePicker, Button, ConfigProvider } from "antd";
import { MapPin, Factory, Sun, Layers, CalendarDays, RefreshCcw } from "lucide-react";
import { DATE_PRESETS, rangeLabelFromPreset } from "../utils/dateRangePresets";

const FILTER_LABEL =
  "flex items-center gap-1 text-[8px] font-bold text-slate-500 uppercase tracking-wider mb-0.5 whitespace-nowrap";

const SELECT_WIDTH = { minWidth: 100, width: "100%" };

export default function DashboardFilterBar({
  user,
  filters,
  setFilters,
  locations,
  plants,
  shifts,
  conveyors,
  datePreset,
  dateRange,
  onPresetChange,
  onCustomRangeChange,
  onRefresh,
}) {
  const filteredPlants = filters.locationId
    ? plants.filter((p) => String(p.locationId) === String(filters.locationId))
    : plants;

  const filteredShifts = (() => {
    if (user?.role === "plantAdmin" && !filters.plantId) return [];
    if (filters.plantId) return shifts.filter((s) => String(s.plantId) === String(filters.plantId));
    return shifts;
  })();

  const filteredConveyors = (() => {
    if (user?.role === "plantAdmin" && !filters.plantId) return [];
    if (filters.plantId) return conveyors.filter((c) => String(c.plantId) === String(filters.plantId));
    if (user?.role === "manager") return conveyors;
    if (filters.locationId) {
      return conveyors.filter((c) => filteredPlants.some((p) => String(p._id) === String(c.plantId)));
    }
    return conveyors;
  })();

  return (
    <ConfigProvider
      theme={{
        token: {
          borderRadius: 24,
          controlHeightSM: 22,
          fontSize: 11,
          colorBorder: "#cbd5e1",
        },
      }}
    >
      <div className="flex items-end gap-1.5 xl:gap-2 min-w-0">
      {user?.role === "superAdmin" && (
        <div className="w-[108px] sm:w-[118px] lg:w-[128px] shrink-0">
          <div className={FILTER_LABEL}>
            <MapPin size={9} /> Location
          </div>
          <Select
            size="small"
            style={SELECT_WIDTH}
            placeholder="All Locations"
            value={filters.locationId || ""}
            onChange={(v) =>
              setFilters((p) => ({ ...p, locationId: v || "", plantId: "", shiftId: "", conveyorId: "" }))
            }
            options={[
              { value: "", label: "All Locations" },
              ...locations.map((i) => ({ value: String(i._id), label: i.locationName })),
            ]}
          />
        </div>
      )}

      {user?.role === "plantAdmin" && (
        <div className="w-[108px] sm:w-[118px] lg:w-[128px] shrink-0">
          <div className={FILTER_LABEL}>
            <MapPin size={9} /> Location
          </div>
          <Select
            size="small"
            style={SELECT_WIDTH}
            disabled
            value={filters.locationId || ""}
            options={
              locations.length
                ? locations.map((i) => ({ value: String(i._id), label: i.locationName }))
                : [{ value: String(filters.locationId), label: user?.locationName || "My Location" }]
            }
          />
        </div>
      )}

      {user?.role === "manager" && (
        <div className="w-[108px] sm:w-[118px] lg:w-[128px] shrink-0">
          <div className={FILTER_LABEL}>
            <Factory size={9} /> Plant
          </div>
          <Select
            size="small"
            style={SELECT_WIDTH}
            disabled
            value={filters.plantId || ""}
            options={plants.map((i) => ({ value: String(i._id), label: i.plantName }))}
          />
        </div>
      )}

      {(user?.role === "superAdmin" || user?.role === "plantAdmin") && (
        <div className="w-[108px] sm:w-[118px] lg:w-[128px] shrink-0">
          <div className={FILTER_LABEL}>
            <Factory size={9} /> Plant
          </div>
          <Select
            size="small"
            style={SELECT_WIDTH}
            placeholder="All Plants"
            value={filters.plantId || ""}
            onChange={(v) => setFilters((p) => ({ ...p, plantId: v || "", shiftId: "", conveyorId: "" }))}
            options={[
              { value: "", label: "All Plants" },
              ...filteredPlants.map((i) => ({ value: String(i._id), label: i.plantName })),
            ]}
          />
        </div>
      )}

      <div className="w-[96px] sm:w-[106px] lg:w-[116px] shrink-0">
        <div className={FILTER_LABEL}>
          <Sun size={9} /> Shift
        </div>
        <Select
          size="small"
          style={SELECT_WIDTH}
          placeholder="All Shifts"
          value={filters.shiftId || ""}
          disabled={user?.role === "plantAdmin" && !filters.plantId}
          onChange={(v) => setFilters((p) => ({ ...p, shiftId: v || "", conveyorId: "" }))}
          options={[
            { value: "", label: "All Shifts" },
            ...filteredShifts.map((i) => ({ value: String(i._id), label: i.shiftName })),
          ]}
        />
      </div>

      <div className="w-[108px] sm:w-[118px] lg:w-[128px] shrink-0">
        <div className={FILTER_LABEL}>
          <Layers size={9} /> Conveyor
        </div>
        <Select
          size="small"
          style={SELECT_WIDTH}
          placeholder="All Conveyors"
          value={filters.conveyorId || ""}
          disabled={
            (user?.role === "plantAdmin" && !filters.plantId) ||
            (user?.role === "superAdmin" && !filters.plantId && !!filters.locationId)
          }
          onChange={(v) => setFilters((p) => ({ ...p, conveyorId: v || "" }))}
          options={[
            { value: "", label: "All Conveyors" },
            ...filteredConveyors.map((i) => ({ value: String(i._id), label: i.conveyorName })),
          ]}
        />
      </div>

      <div className="w-[96px] sm:w-[106px] lg:w-[116px] shrink-0">
        <div className={FILTER_LABEL}>
          <CalendarDays size={9} /> Date Range
        </div>
        <Select
          size="small"
          style={SELECT_WIDTH}
          value={datePreset}
          onChange={onPresetChange}
          options={DATE_PRESETS.map((p) => ({
            value: p.key,
            label: p.key === "custom" ? p.label : rangeLabelFromPreset(p.key),
          }))}
        />
      </div>

      {datePreset === "custom" && (
        <div className="w-[200px] sm:w-[220px] shrink-0">
          <div className={FILTER_LABEL}>&nbsp;</div>
          <DatePicker.RangePicker
            size="small"
            className="w-full"
            value={dateRange}
            onChange={onCustomRangeChange}
            format="DD MMM YYYY"
            allowClear={false}
          />
        </div>
      )}

      <div className="shrink-0 pb-0.5">
        <Button
          size="small"
          type="primary"
          icon={<RefreshCcw size={11} />}
          onClick={onRefresh}
          className="!rounded-lg !font-semibold"
          style={{ backgroundColor: "#0d9488", borderColor: "#0d9488" }}
        >
          Refresh
        </Button>
      </div>
      </div>
    </ConfigProvider>
  );
}
