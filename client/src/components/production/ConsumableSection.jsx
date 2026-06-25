export default function ConsumableSection({
  formData,
  setFormData,
}) {

  // =========================
  // ADD CONSUMABLE
  // =========================

  const addConsumable = () => {

    setFormData((prev) => ({
      ...prev,

      consumables: [
        ...prev.consumables,

        {
          itemDescription: "",
          quantityConsumed: 0,
        },
      ],
    }));

  };

  // =========================
  // ADD POWDER
  // =========================

  const addPowder = () => {

    setFormData((prev) => ({
      ...prev,

      powderConsumption: [
        ...prev.powderConsumption,

        {
          powderType: "",
          quantityConsumed: 0,
        },
      ],
    }));

  };

  // =========================
  // UPDATE CONSUMABLE
  // =========================

  const updateConsumable = (
    index,
    field,
    value
  ) => {

    const updated =
      [...formData.consumables];

    updated[index][field] = value;

    setFormData((prev) => ({
      ...prev,
      consumables: updated,
    }));

  };

  // =========================
  // UPDATE POWDER
  // =========================

  const updatePowder = (
    index,
    field,
    value
  ) => {

    const updated =
      [...formData.powderConsumption];

    updated[index][field] = value;

    setFormData((prev) => ({
      ...prev,
      powderConsumption: updated,
    }));

  };

  return (

    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">

      <h2 className="text-lg font-semibold mb-5">
        Consumables & Powder
      </h2>

      {/* ========================= */}
      {/* CONSUMABLES */}
      {/* ========================= */}

      <div className="mb-8">

        <div className="flex justify-between mb-3">

          <h3 className="font-semibold">
            Consumables
          </h3>

          <button
            type="button"
            onClick={addConsumable}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm"
          >
            + Add
          </button>

        </div>

        <div className="space-y-3">

          {formData.consumables.map((item, index) => (

            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >

              <input
                type="text"
                placeholder="Item Description"
                value={item.itemDescription}
                onChange={(e) =>
                  updateConsumable(
                    index,
                    "itemDescription",
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              />

              <input
                type="number"
                placeholder="Quantity"
                value={item.quantityConsumed}
                onChange={(e) =>
                  updateConsumable(
                    index,
                    "quantityConsumed",
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              />

            </div>

          ))}

        </div>

      </div>

      {/* ========================= */}
      {/* POWDER */}
      {/* ========================= */}

      <div>

        <div className="flex justify-between mb-3">

          <h3 className="font-semibold">
            Powder Consumption
          </h3>

          <button
            type="button"
            onClick={addPowder}
            className="bg-purple-600 text-white px-3 py-2 rounded-lg text-sm"
          >
            + Add
          </button>

        </div>

        <div className="space-y-3">

          {formData.powderConsumption.map((item, index) => (

            <div
              key={index}
              className="grid grid-cols-1 md:grid-cols-2 gap-3"
            >

              <input
                type="text"
                placeholder="Powder Type"
                value={item.powderType}
                onChange={(e) =>
                  updatePowder(
                    index,
                    "powderType",
                    e.target.value
                  )
                }
                className="border p-3 rounded-lg"
              />

              <input
                type="number"
                placeholder="Quantity Kg"
                value={item.quantityConsumed}
                onChange={(e) =>
                  updatePowder(
                    index,
                    "quantityConsumed",
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