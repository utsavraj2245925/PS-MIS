import React from "react";
import {
Row,
Col,
Select,
Button,
} from "antd";

const DashboardFilters = ({
user,
filters,
setFilters,
locations,
plants,
shifts,
onRefresh,
}) => {

const filteredPlants =
filters.locationId
? plants.filter(
(plant) =>
String(plant.locationId) ===
String(filters.locationId)
)
: plants;

const filteredShifts =
filters.plantId
? shifts.filter(
(shift) =>
String(shift.plantId) ===
String(filters.plantId)
)
: shifts;

// "user" role gets no filter bar at all — their dashboard is always
// scoped to their own plant + shift server-side, nothing to select.
if (user?.role === "user") {
  return null;
}

return ( <Row gutter={[12,12]} align="middle">

  {user?.role === "superAdmin" && (
    <Col>
      <Select
        style={{ width: 220 }}
        placeholder="All Locations"
        value={filters.locationId}
        onChange={(value) =>
          setFilters({
            locationId: value || "",
            plantId: "",
            shiftId: "",
          })
        }
        options={[
          {
            value: "",
            label: "All Locations",
          },
          ...locations.map((item) => ({
            value: item._id,
            label: item.locationName,
          })),
        ]}
      />
    </Col>
  )}

  {(user?.role === "superAdmin" ||
    user?.role === "plantAdmin") && (
    <Col>
      <Select
        style={{ width: 220 }}
        placeholder="All Plants"
        value={filters.plantId}
        onChange={(value) =>
          setFilters((prev) => ({
            ...prev,
            plantId: value || "",
            shiftId: "",
          }))
        }
        options={[
          {
            value: "",
            label: "All Plants",
          },
          ...filteredPlants.map((item) => ({
            value: item._id,
            label: item.plantName,
          })),
        ]}
      />
    </Col>
  )}

  <Col>
    <Select
      style={{ width: 220 }}
      placeholder="All Shifts"
      value={filters.shiftId}
      onChange={(value) =>
        setFilters((prev) => ({
          ...prev,
          shiftId: value || "",
        }))
      }
      options={[
        {
          value: "",
          label: "All Shifts",
        },
        ...filteredShifts.map((item) => ({
          value: item._id,
          label: item.shiftName,
        })),
      ]}
    />
  </Col>

  <Col>
    <Button
      type="primary"
      onClick={onRefresh}
    >
      Refresh
    </Button>
  </Col>

</Row>

);
};

export default DashboardFilters;
