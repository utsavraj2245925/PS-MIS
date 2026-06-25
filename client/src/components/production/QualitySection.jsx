export default function QualitySection({
  formData,
  setFormData,
}) {

  // =========================
  // ADD DEFECT
  // =========================

  const addDefect = () => {
    setFormData((prev) => ({
      ...prev,
      qualityDefects: [
        ...prev.qualityDefects,
        {
          modelName: "",
          partName: "",
          defectType: "",
          defectQuantity: 0,
        },
      ],
    }));
  };

  // =========================
  // ADD REWORK
  // =========================

  const addRework = () => {
    setFormData((prev) => ({
      ...prev,
      reworks: [
        ...prev.reworks,
        {
          modelName: "",
          partName: "",
          reworkReason: "",
          reworkedQuantity: 0,
        },
      ],
    }));
  };

  // =========================
  // UPDATE DEFECT
  // =========================

  const updateDefect = (
    index,
    field,
    value
  ) => {

    const updated = [...formData.qualityDefects];

    updated[index][field] = value;

    setFormData((prev) => ({
      ...prev,
      qualityDefects: updated,
    }));
  };

  // =========================
  // UPDATE REWORK
  // =========================

  const updateRework = (
    index,
    field,
    value
  ) => {

    const updated = [...formData.reworks];

    updated[index][field] = value;

    setFormData((prev) => ({
      ...prev,
      reworks: updated,
    }));
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">

      <h2 className="text-lg font-semibold mb-5">
        Quality & Rework
      </h2>

      {/* DEFECTS */}

      <div className="mb-8">

        <div className="flex justify-between mb-3">

          <h3 className="font-semibold">
            Quality Defects
          </h3>

          <button
            type="button"
            onClick={addDefect}
            className="bg-red-600 text-white px-3 py-2 rounded-lg text-sm"
          >
            + Add
          </button>

        </div>

        <div className="space-y-3">

          {formData.qualityDefects.map((item, index) => (

            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-4 gap-3"
            >

              <input
                type="text"
                placeholder="Model"
                value={item.modelName}
                onChange={(e) =>
                  updateDefect(
                    index,
                    "modelName",
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              />

              <input
                type="text"
                placeholder="Part"
                value={item.partName}
                onChange={(e) =>
                  updateDefect(
                    index,
                    "partName",
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              />

              <input
                type="text"
                placeholder="Defect Type"
                value={item.defectType}
                onChange={(e) =>
                  updateDefect(
                    index,
                    "defectType",
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              />

              <input
                type="number"
                placeholder="Qty"
                value={item.defectQuantity}
                onChange={(e) =>
                  updateDefect(
                    index,
                    "defectQuantity",
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              />

            </div>

          ))}

        </div>

      </div>

      {/* REWORK */}

      <div>

        <div className="flex justify-between mb-3">

          <h3 className="font-semibold">
            Rework
          </h3>

          <button
            type="button"
            onClick={addRework}
            className="bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm"
          >
            + Add
          </button>

        </div>

        <div className="space-y-3">

          {formData.reworks.map((item, index) => (

            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-4 gap-3"
            >

              <input
                type="text"
                placeholder="Model"
                value={item.modelName}
                onChange={(e) =>
                  updateRework(
                    index,
                    "modelName",
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              />

              <input
                type="text"
                placeholder="Part"
                value={item.partName}
                onChange={(e) =>
                  updateRework(
                    index,
                    "partName",
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              />

              <input
                type="text"
                placeholder="Reason"
                value={item.reworkReason}
                onChange={(e) =>
                  updateRework(
                    index,
                    "reworkReason",
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              />

              <input
                type="number"
                placeholder="Qty"
                value={item.reworkedQuantity}
                onChange={(e) =>
                  updateRework(
                    index,
                    "reworkedQuantity",
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