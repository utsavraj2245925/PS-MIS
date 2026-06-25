import React from "react";

export default function DowntimeSection({
formData,
setFormData,
}) {
// =========================
// ADD PLANNED DOWNTIME
// =========================
const addPlanned = () => {

setFormData((prev) => ({
  ...prev,
  plannedDowntime: [
    ...prev.plannedDowntime,
    {
      startTime: "",
      endTime: "",
      duration: 0,
      reason: "",
    },

  ],

}));
};

// =========================
// ADD UNPLANNED DOWNTIME
// =========================

const addUnplanned = () => {
setFormData((prev) => ({
  ...prev,
  unplannedDowntime: [
    ...prev.unplannedDowntime,
    {
      startTime: "",
      endTime: "",
      duration: 0,
      reason: "",
      description: "",
    },
  ],
}));
};

// =========================
// UPDATE PLANNED
// =========================
const updatePlanned = (
index,
field,
value
) => {

const updated = [...formData.plannedDowntime];
updated[index][field] = value;
setFormData((prev) => ({
  ...prev,
  plannedDowntime: updated,
}));
};

// =========================
// UPDATE UNPLANNED
// =========================
const updateUnplanned = (
index,
field,
value
) => {
const updated = [...formData.unplannedDowntime];
updated[index][field] = value;
setFormData((prev) => ({
  ...prev,
  unplannedDowntime: updated,
}));
};
return (

<div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">

  <h2 className="text-lg font-semibold mb-5">
    Downtime Section
  </h2>
  {/* ========================= */}
  {/* PLANNED DOWNTIME */}
  {/* ========================= */}

  <div className="mb-8">
    <div className="flex items-center justify-between mb-3">

      <h3 className="font-semibold text-slate-700">
        Planned Downtime
      </h3>

      <button
        type="button"
        onClick={addPlanned}
        className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
      >
        + Add
      </button>
    </div>
    <div className="space-y-3">

      {formData.plannedDowntime.map((item, index) => (

        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-4 gap-3"
        >
          <input
            type="time"
            value={item.startTime}
            onChange={(e) =>
              updatePlanned(
                index,
                "startTime",
                e.target.value
              )
            }
            className="border p-3 rounded-lg"
          />
          <input
            type="time"
            value={item.endTime}
            onChange={(e) =>
              updatePlanned(
                index,
                "endTime",
                e.target.value
              )
            }
            className="border p-3 rounded-lg"
          />
          <input
            type="number"
            placeholder="Duration"
            value={item.duration}
            onChange={(e) =>
              updatePlanned(
                index,
                "duration",
                e.target.value
              )
            }
            className="border p-3 rounded-lg"
          />
          <select
            value={item.reason}
            onChange={(e) =>
              updatePlanned(
                index,
                "reason",
                e.target.value
              )
            }
            className="border p-3 rounded-lg"
          >
            <option value="">
              Select Reason
            </option>

            <option>
              Preventive Maintenance
            </option>

            <option>
              Tool Change
            </option>

            <option>
              Cleaning
            </option>

            <option>
              Meeting
            </option>

            <option>
              Other
            </option>

          </select>

        </div>
      ))}
    </div>
  </div>

  {/* ========================= */}
  {/* UNPLANNED DOWNTIME */}
  {/* ========================= */}

  <div>

    <div className="flex items-center justify-between mb-3">

      <h3 className="font-semibold text-slate-700">
        Unplanned Downtime
      </h3>

      <button
        type="button"
        onClick={addUnplanned}
        className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
      >
        + Add
      </button>

    </div>
    <div className="space-y-3">

      {formData.unplannedDowntime.map((item, index) => (

        <div
          key={index}
          className="grid grid-cols-1 md:grid-cols-5 gap-3"
        >
          <input
            type="time"
            value={item.startTime}
            onChange={(e) =>
              updateUnplanned(
                index,
                "startTime",
                e.target.value
              )
            }
            className="border p-3 rounded-lg"
          />
          <input
            type="time"
            value={item.endTime}
            onChange={(e) =>
              updateUnplanned(
                index,
                "endTime",
                e.target.value
              )
            }
            className="border p-3 rounded-lg"
          />
          <input
            type="number"
            placeholder="Duration"
            value={item.duration}
            onChange={(e) =>
              updateUnplanned(
                index,
                "duration",
                e.target.value
              )
            }
            className="border p-3 rounded-lg"
          />
          <select
            value={item.reason}
            onChange={(e) =>
              updateUnplanned(
                index,
                "reason",
                e.target.value
              )
            }
            className="border p-3 rounded-lg"
          >

            <option value="">
              Select Reason
            </option>

            <option>
              Machine Breakdown
            </option>

            <option>
              Power Failure
            </option>

            <option>
              Material Shortage
            </option>
            <option>
              Other
            </option>
          </select>
          <input
            type="text"
            placeholder="Description"
            value={item.description}
            onChange={(e) =>
              updateUnplanned(
                index,
                "description",
                e.target.value
              )
            }
            className="border p-3 rounded-lg"
          />
        </div>
      ))}
    </div>
  </div>
</div>

);

}
