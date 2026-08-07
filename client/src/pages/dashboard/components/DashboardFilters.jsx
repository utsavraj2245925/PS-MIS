import React from "react";
import { Row, Col, Select, Button, DatePicker } from "antd";
import { MapPin, Factory, Sun, Layers, CalendarDays, RefreshCcw } from "lucide-react";
import { DATE_PRESETS, rangeLabelFromPreset } from "../../../utils/dateRangePresets";

const LABEL = "flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-wider mb-1";

const DashboardFilters = ({
  user, filters, setFilters, locations, plants, shifts, conveyors,
  datePreset, dateRange, onPresetChange, onCustomRangeChange, onRefresh,
}) => {

  const filteredPlants = filters.locationId
    ? plants.filter((plant) => String(plant.locationId) === String(filters.locationId))
    : plants;

  const filteredShifts = (() => {
    if (user?.role === "plantAdmin" && !filters.plantId) return [];
    if (filters.plantId) return shifts.filter((shift) => String(shift.plantId) === String(filters.plantId));
    return shifts;
  })();

  const filteredConveyors = (() => {
    if (user?.role === "plantAdmin" && !filters.plantId) return [];
    if (filters.plantId) return conveyors.filter((c) => String(c.plantId) === String(filters.plantId));
    if (user?.role === "manager") return conveyors;
    if (filters.locationId) {
      return conveyors.filter((c) => filteredPlants.some((plant) => String(plant._id) === String(c.plantId)));
    }
    return conveyors;
  })();

  if (user?.role === "user") return null;

  return (
    <Row gutter={[10, 10]} align="bottom">

      {user?.role === "superAdmin" && (
        <Col>
          <div className={LABEL}><MapPin size={10} /> Location</div>
          <Select
            style={{ width: 176 }} placeholder="All Locations"
            value={filters.locationId || ""}
            onChange={(value) => setFilters((prev) => ({ ...prev, locationId: value || "", plantId: "", shiftId: "", conveyorId: "" }))}
            options={[{ value: "", label: "All Locations" }, ...locations.map((i) => ({ value: String(i._id), label: i.locationName }))]}
          />
        </Col>
      )}

      {user?.role === "plantAdmin" && (
        <Col>
          <div className={LABEL}><MapPin size={10} /> Location</div>
          <Select
            style={{ width: 176 }} disabled value={filters.locationId || ""}
            options={
              locations.length
                ? locations.map((i) => ({ value: String(i._id), label: i.locationName }))
                : [{ value: String(filters.locationId), label: user?.locationName || "My Location" }]
            }
          />
        </Col>
      )}

      {user?.role === "manager" && (
        <Col>
          <div className={LABEL}><Factory size={10} /> Plant</div>
          <Select
            style={{ width: 176 }} disabled value={filters.plantId || ""}
            options={plants.map((i) => ({ value: String(i._id), label: i.plantName }))}
            placeholder="My Plant"
          />
        </Col>
      )}

      {(user?.role === "superAdmin" || user?.role === "plantAdmin") && (
        <Col>
          <div className={LABEL}><Factory size={10} /> Plant</div>
          <Select
            style={{ width: 176 }} placeholder="All Plants"
            value={filters.plantId || ""}
            onChange={(value) => setFilters((prev) => ({ ...prev, plantId: value || "", shiftId: "", conveyorId: "" }))}
            options={[{ value: "", label: "All Plants" }, ...filteredPlants.map((i) => ({ value: String(i._id), label: i.plantName }))]}
          />
        </Col>
      )}

      <Col>
        <div className={LABEL}><Sun size={10} /> Shift</div>
        <Select
          style={{ width: 160 }} placeholder="All Shifts"
          value={filters.shiftId || ""}
          disabled={user?.role === "plantAdmin" && !filters.plantId}
          onChange={(value) => setFilters((prev) => ({ ...prev, shiftId: value || "", conveyorId: "" }))}
          options={[{ value: "", label: "All Shifts" }, ...filteredShifts.map((i) => ({ value: String(i._id), label: i.shiftName }))]}
        />
      </Col>

      <Col>
        <div className={LABEL}><Layers size={10} /> Conveyor</div>
        <Select
          style={{ width: 170 }} placeholder="All Conveyors"
          value={filters.conveyorId || ""}
          disabled={
            (user?.role === "plantAdmin" && !filters.plantId) ||
            (user?.role === "superAdmin" && !filters.plantId && !!filters.locationId)
          }
          onChange={(value) => setFilters((prev) => ({ ...prev, conveyorId: value || "" }))}
          options={[{ value: "", label: "All Conveyors" }, ...filteredConveyors.map((i) => ({ value: String(i._id), label: i.conveyorName }))]}
        />
      </Col>

      <Col>
        <div className={LABEL}><CalendarDays size={10} /> Date Range</div>
        <Select
          style={{ width: 160 }} value={datePreset} onChange={onPresetChange}
          options={DATE_PRESETS.map((p) => ({ value: p.key, label: p.key === "custom" ? p.label : rangeLabelFromPreset(p.key) }))}
        />
      </Col>

      {datePreset === "custom" && (
        <Col>
          <div className={LABEL}>&nbsp;</div>
          <DatePicker.RangePicker value={dateRange} onChange={onCustomRangeChange} format="DD MMM YYYY" allowClear={false} />
        </Col>
      )}

      <Col>
        <Button
          type="primary" icon={<RefreshCcw size={13} />} onClick={onRefresh}
          className="!rounded-lg !font-semibold" style={{ backgroundColor: "#0d9488", borderColor: "#0d9488" }}
        >
          Refresh
        </Button>
      </Col>

    </Row>
  );
};

export default DashboardFilters;