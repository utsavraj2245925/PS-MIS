export default function ProductionSection({
  formData,
  setFormData,
  models,
}) {

  // =========================
  // ADD MODEL
  // =========================

  const addModelEntry = () => {

    setFormData((prev) => ({
      ...prev,

      productionEntries: [
        ...prev.productionEntries,

        {
          modelName: "",
          parts: [],
        },
      ],
    }));

  };

  // =========================
  // DELETE MODEL
  // =========================

  const deleteModelEntry = (index) => {

    const updated =
      [...formData.productionEntries];

    updated.splice(index, 1);

    setFormData({
      ...formData,
      productionEntries: updated,
    });

  };

  // =========================
  // MODEL CHANGE
  // =========================

  const handleModelChange = (
    index,
    value
  ) => {

    const selectedModel =
      Array.isArray(models)
        ? models.find(
            (model) =>
              model.modelName === value
          )
        : null;

    const updated =
      [...formData.productionEntries];

    updated[index].modelName = value;

    updated[index].parts =
      selectedModel?.parts?.map((part) => ({
        partName: part.partName,
        quantity: "",
      })) || [];

    setFormData({
      ...formData,
      productionEntries: updated,
    });

  };

  // =========================
  // PART QTY CHANGE
  // =========================

  const handlePartQtyChange = (
    modelIndex,
    partIndex,
    value
  ) => {

    const updated =
      [...formData.productionEntries];

    updated[modelIndex]
      .parts[partIndex]
      .quantity = value;

    setFormData({
      ...formData,
      productionEntries: updated,
    });

  };

  return (

    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

      {/* HEADER */}

      <div className="flex justify-between items-center mb-6">

        <div>

          <h2 className="text-xl font-bold text-slate-800">
            Production Entry
          </h2>

          <p className="text-sm text-slate-500 mt-1">
            Model-wise production quantity entry
          </p>

        </div>

        <button
          type="button"
          onClick={addModelEntry}
          className="bg-cyan-700 hover:bg-cyan-800 text-white px-5 py-3 rounded-xl font-medium transition-all"
        >
          + Add Model
        </button>

      </div>

      {/* MODEL CARDS */}

      <div className="space-y-6">

        {formData.productionEntries.map(
          (entry, modelIndex) => (

            <div
              key={modelIndex}
              className="border border-slate-200 rounded-2xl p-5"
            >

              {/* TOP */}

              <div className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between mb-5">

                <select
                  value={entry.modelName}
                  onChange={(e) =>
                    handleModelChange(
                      modelIndex,
                      e.target.value
                    )
                  }
                  className="border border-slate-300 rounded-xl px-4 py-3 w-full lg:w-[350px]"
                >

                  <option value="">
                    Select Model
                  </option>

                  {Array.isArray(models) && models.map((model) => (

                    <option
                      key={model._id}
                      value={model.modelName}
                    >
                      {model.modelName}
                    </option>

                  ))}

                </select>

                <button
                  type="button"
                  onClick={() =>
                    deleteModelEntry(
                      modelIndex
                    )
                  }
                  className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-xl"
                >
                  Delete
                </button>

              </div>

              {/* PARTS */}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {entry.parts.map(
                  (part, partIndex) => (

                    <div
                      key={partIndex}
                      className="flex gap-3"
                    >

                      {/* PART */}

                      <input
                        type="text"
                        value={part.partName}
                        disabled
                        className="w-full border border-slate-200 bg-slate-100 rounded-xl px-4 py-3"
                      />

                      {/* QTY */}

                      <input
                        type="number"
                        placeholder="Qty"
                        value={part.quantity}
                        onChange={(e) =>
                          handlePartQtyChange(
                            modelIndex,
                            partIndex,
                            e.target.value
                          )
                        }
                        className="w-full border border-slate-300 rounded-xl px-4 py-3"
                      />

                    </div>

                  )
                )}

              </div>

            </div>

          )
        )}

      </div>

    </div>

  );
}