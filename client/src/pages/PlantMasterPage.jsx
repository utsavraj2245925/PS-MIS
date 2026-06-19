import React, {
  useState,
  useEffect,
} from "react";

import {
  Factory,
  Search,
  Plus,
  Download,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  X,
  Activity,
} from "lucide-react";

import {
  getPlants,
  createPlant,
  updatePlant,
  deletePlant,
} from "../services/plantService";

export default function PlantMasterPage() {
  /* ===================================
      STATES
  =================================== */

  const [plants, setPlants] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState("All");

  const [selectedPlant, setSelectedPlant] =
    useState(null);

  const [isModalOpen, setIsModalOpen] =
    useState(false);

  const [isFormModalOpen, setIsFormModalOpen] =
    useState(false);

  const [editingId, setEditingId] =
    useState(null);

  const [formData, setFormData] =
    useState({
      plantName: "",
      plantCode: "",
      location: "",
      plantAdmin: "",

      conveyorLength: "",
      conveyorSpeed: "",
      pitchDistance: "",

      setPerRound: "",
      availableTime: 630,
      efficiency: 100,

      status: "Active",
    });

  /* ===================================
      CALCULATIONS
  =================================== */

  const hangers =
    formData.conveyorLength &&
    formData.pitchDistance
      ? Math.floor(
          Number(
            formData.conveyorLength
          ) /
            Number(
              formData.pitchDistance
            )
        )
      : 0;

  const processTime =
    formData.conveyorLength &&
    formData.conveyorSpeed
      ? (
          Number(
            formData.conveyorLength
          ) /
          Number(
            formData.conveyorSpeed
          )
        ).toFixed(1)
      : 0;

  const totalRoundsShift =
    formData.availableTime &&
    processTime
      ? (
          Number(
            formData.availableTime
          ) /
          Number(processTime)
        ).toFixed(1)
      : 0;

  const effectiveRounds =
    totalRoundsShift
      ? (
          Number(
            totalRoundsShift
          ) *
          (Number(
            formData.efficiency
          ) /
            100)
        ).toFixed(1)
      : 0;

  const productionPerShift =
    formData.setPerRound &&
    effectiveRounds
      ? Math.round(
          Number(
            formData.setPerRound
          ) *
            Number(
              effectiveRounds
            )
        )
      : 0;

  const totalTargetPerDay =
    productionPerShift * 2;

  /* ===================================
      API
  =================================== */

  const fetchPlants =
    async () => {
      try {
        setLoading(true);

        const response =
          await getPlants();

        setPlants(
          response.data
        );
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchPlants();
  }, []);

  /* ===================================
      INPUT CHANGE
  =================================== */

  const handleChange = (
    e
  ) => {
    const {
      name,
      value,
    } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /* ===================================
      RESET FORM
  =================================== */

  const resetForm = () => {
    setFormData({
      plantName: "",
      plantCode: "",
      location: "",
      plantAdmin: "",

      conveyorLength: "",
      conveyorSpeed: "",
      pitchDistance: "",

      setPerRound: "",
      availableTime: 630,
      efficiency: 100,

      status: "Active",
    });

    setEditingId(null);
    setIsFormModalOpen(false);
  };

  /* ===================================
      SAVE / UPDATE
  =================================== */

  const handleSubmit =
    async (e) => {
      e.preventDefault();

      try {
        const payload = {
          ...formData,

          conveyorLength:
            Number(
              formData.conveyorLength
            ),

          conveyorSpeed:
            Number(
              formData.conveyorSpeed
            ),

          pitchDistance:
            Number(
              formData.pitchDistance
            ),

          setPerRound:
            Number(
              formData.setPerRound
            ),

          availableTime:
            Number(
              formData.availableTime
            ),

          efficiency:
            Number(
              formData.efficiency
            ),

          hangers,

          processTime:
            Number(processTime),

          totalRoundsShift:
            Number(
              totalRoundsShift
            ),

          productionPerShift,

          totalTargetPerDay,
        };

        if (editingId) {
          await updatePlant(
            editingId,
            payload
          );
        } else {
          await createPlant(
            payload
          );
        }

        await fetchPlants();

        resetForm();
      } catch (error) {
        alert(
          error?.response?.data
            ?.message ||
            "Error Saving Plant"
        );
      }
    };

      /* ===================================
      EDIT
  =================================== */

  const handleEdit = (
    plant
  ) => {
    setEditingId(
      plant._id
    );

    setFormData({
      plantName:
        plant.plantName || "",

      plantCode:
        plant.plantCode || "",

      location:
        plant.location || "",

      plantAdmin:
        plant.plantAdmin || "",

      conveyorLength:
        plant.conveyorLength || "",

      conveyorSpeed:
        plant.conveyorSpeed || "",

      pitchDistance:
        plant.pitchDistance || "",

      setPerRound:
        plant.setPerRound || "",

      availableTime:
        plant.availableTime || 630,

      efficiency:
        plant.efficiency || 100,

      status:
        plant.status ||
        "Active",
    });

    setIsFormModalOpen(
      true
    );
  };

  /* ===================================
      DELETE
  =================================== */

  const handleDelete =
    async (id) => {
      const confirmDelete =
        window.confirm(
          "Delete this plant?"
        );

      if (
        !confirmDelete
      )
        return;

      try {
        await deletePlant(id);

        fetchPlants();
      } catch (error) {
        console.error(error);
      }
    };

  /* ===================================
      DETAILS MODAL
  =================================== */

  const openModal = (
    plant
  ) => {
    setSelectedPlant(
      plant
    );

    setIsModalOpen(
      true
    );
  };

  const closeModal =
    () => {
      setSelectedPlant(
        null
      );

      setIsModalOpen(
        false
      );
    };

  /* ===================================
      OPEN ADD MODAL
  =================================== */

  const openAddModal =
    () => {
      resetForm();

      setIsFormModalOpen(
        true
      );
    };

  /* ===================================
      FILTERS
  =================================== */

  const filteredPlants =
    plants.filter(
      (plant) => {
        const searchMatch =
          plant.plantName
            ?.toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            ) ||
          plant.plantCode
            ?.toLowerCase()
            .includes(
              searchTerm.toLowerCase()
            );

        const statusMatch =
          statusFilter ===
          "All"
            ? true
            : plant.status ===
              statusFilter;

        return (
          searchMatch &&
          statusMatch
        );
      }
    );

  const totalPlants =
    plants.length;

  const activePlants =
    plants.filter(
      (p) =>
        p.status ===
        "Active"
    ).length;

  const inactivePlants =
    plants.filter(
      (p) =>
        p.status ===
        "Inactive"
    ).length;

  return (
    <div
      className="min-h-screen bg-slate-50"
      style={{
        fontFamily:
          "'IBM Plex Sans', sans-serif",
      }}
    >
      {/* PAGE HEADER */}

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-5">

        <div className="flex items-center gap-3">

          <div className="w-11 h-11 rounded-xl bg-cyan-700 text-white flex items-center justify-center">
            <Factory
              size={20}
            />
          </div>

          <div>
            <h1 className="text-xl font-semibold text-slate-800">
              Plant Master
            </h1>

            <p className="text-xs text-slate-500">
              Plant Capacity &
              Production Management
            </p>
          </div>

        </div>

        <div className="flex gap-2">

          <button
            className="h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-50"
          >
            <Download
              size={16}
            />
            Export
          </button>

          <button
            onClick={
              openAddModal
            }
            className="h-10 px-4 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Plus
              size={16}
            />
            Add Plant
          </button>

        </div>

      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-5">

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-xs text-slate-500 uppercase">
                Total Plants
              </p>

              <h2
                className="text-2xl font-bold mt-2"
                style={{
                  fontFamily:
                    "'IBM Plex Mono', monospace",
                }}
              >
                {totalPlants}
              </h2>

            </div>

            <Factory
              size={24}
              className="text-cyan-700"
            />

          </div>

        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-xs text-slate-500 uppercase">
                Active
              </p>

              <h2
                className="text-2xl font-bold mt-2 text-emerald-600"
                style={{
                  fontFamily:
                    "'IBM Plex Mono', monospace",
                }}
              >
                {activePlants}
              </h2>

            </div>

            <CheckCircle2
              size={24}
              className="text-emerald-600"
            />

          </div>

        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-xs text-slate-500 uppercase">
                Inactive
              </p>

              <h2
                className="text-2xl font-bold mt-2 text-rose-600"
                style={{
                  fontFamily:
                    "'IBM Plex Mono', monospace",
                }}
              >
                {inactivePlants}
              </h2>

            </div>

            <XCircle
              size={24}
              className="text-rose-600"
            />

          </div>

        </div>

      </div>

      {/* SEARCH */}

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

          <div className="relative">

            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search plant..."
              value={
                searchTerm
              }
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              className="w-full h-10 border border-slate-300 rounded-lg pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />

          </div>

          <select
            value={
              statusFilter
            }
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="h-10 border border-slate-300 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
          >
            <option value="All">
              All Status
            </option>

            <option value="Active">
              Active
            </option>

            <option value="Inactive">
              Inactive
            </option>

          </select>

        </div>

      </div>

            {/* CAPACITY SUMMARY */}

      <div className="bg-white border border-slate-200 rounded-xl p-4 mb-5">

        <div className="flex items-center gap-2 mb-4">

          <Activity
            size={18}
            className="text-cyan-700"
          />

          <h2 className="text-sm font-semibold text-slate-800">
            Capacity Preview
          </h2>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">

          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-[11px] text-slate-500">
              Hangers
            </p>

            <h3 className="text-lg font-bold font-mono mt-1">
              {hangers}
            </h3>
          </div>

          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-[11px] text-slate-500">
              Process Time
            </p>

            <h3 className="text-lg font-bold font-mono mt-1">
              {processTime}
            </h3>
          </div>

          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-[11px] text-slate-500">
              Total Rounds
            </p>

            <h3 className="text-lg font-bold font-mono mt-1">
              {totalRoundsShift}
            </h3>
          </div>

          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-[11px] text-slate-500">
              Effective
            </p>

            <h3 className="text-lg font-bold font-mono mt-1">
              {effectiveRounds}
            </h3>
          </div>

          <div className="border border-slate-200 rounded-lg p-3">
            <p className="text-[11px] text-slate-500">
              Shift Output
            </p>

            <h3 className="text-lg font-bold font-mono mt-1">
              {productionPerShift}
            </h3>
          </div>

          <div className="border border-cyan-200 bg-cyan-50 rounded-lg p-3">
            <p className="text-[11px] text-cyan-700">
              Target / Day
            </p>

            <h3 className="text-lg font-bold font-mono mt-1 text-cyan-700">
              {totalTargetPerDay}
            </h3>
          </div>

        </div>

      </div>

      {/* PLANT TABLE */}

      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">

        <div className="px-4 py-3 border-b border-slate-200 flex justify-between items-center">

          <div>

            <h2 className="text-sm font-semibold text-slate-800">
              Plant List
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              {filteredPlants.length} of {plants.length} plants
            </p>

          </div>

        </div>

        <div className="overflow-auto max-h-[650px]">

          <table className="w-full text-sm">

            <thead className="sticky top-0 bg-slate-100 z-10">

              <tr>

                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  Plant
                </th>

                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  Code
                </th>

                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  Location
                </th>

                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  Admin
                </th>

                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  Target / Day
                </th>

                <th className="text-left px-4 py-3 font-semibold text-slate-700">
                  Status
                </th>

                <th className="text-center px-4 py-3 font-semibold text-slate-700">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="7"
                    className="text-center py-12 text-slate-500"
                  >
                    Loading Plants...
                  </td>

                </tr>

              ) : filteredPlants.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="text-center py-12 text-slate-500"
                  >
                    No Plants Found
                  </td>

                </tr>

              ) : (

                filteredPlants.map(
                  (plant) => (

                    <tr
                      key={plant._id}
                      onClick={() =>
                        openModal(
                          plant
                        )
                      }
                      className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition"
                    >

                      <td className="px-4 py-3">

                        <div className="font-medium text-slate-800">
                          {plant.plantName}
                        </div>

                      </td>

                      <td className="px-4 py-3 font-mono text-xs">
                        {plant.plantCode}
                      </td>

                      <td className="px-4 py-3">
                        {plant.location}
                      </td>

                      <td className="px-4 py-3">
                        {plant.plantAdmin}
                      </td>

                      <td className="px-4 py-3 font-mono">
                        {plant.totalTargetPerDay?.toLocaleString()}
                      </td>

                      <td className="px-4 py-3">

                        {plant.status === "Active" ? (

                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">

                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>

                            Active

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-medium">

                            <span className="w-2 h-2 rounded-full bg-rose-500"></span>

                            Inactive

                          </span>

                        )}

                      </td>

                      <td
                        className="px-4 py-3"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >

                        <div className="flex justify-center items-center gap-2">

                          <button
                            onClick={() =>
                              handleEdit(
                                plant
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-cyan-50 hover:bg-cyan-100 flex items-center justify-center"
                          >
                            <Pencil
                              size={15}
                              className="text-cyan-700"
                            />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                plant._id
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-rose-50 hover:bg-rose-100 flex items-center justify-center"
                          >
                            <Trash2
                              size={15}
                              className="text-rose-600"
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )

              )}

            </tbody>

          </table>

        </div>

      </div>

            {/* ADD / EDIT MODAL */}

      {isFormModalOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={resetForm}
        >
          <div
            className="bg-white w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >

            {/* MODAL HEADER */}

            <div className="flex justify-between items-center px-6 py-4 border-b">

              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  {editingId
                    ? "Edit Plant"
                    : "Add New Plant"}
                </h2>

                <p className="text-xs text-slate-500 mt-1">
                  Plant Configuration & Capacity Setup
                </p>
              </div>

              <button
                onClick={resetForm}
                className="w-9 h-9 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X size={18} />
              </button>

            </div>

            {/* FORM */}

            <form
              onSubmit={handleSubmit}
              className="p-6"
            >

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">

                <div>
                  <label className="text-xs text-slate-500">
                    Plant Name
                  </label>

                  <input
                    name="plantName"
                    value={formData.plantName}
                    onChange={handleChange}
                    required
                    className="w-full h-10 border rounded-lg px-3 mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Plant Code
                  </label>

                  <input
                    name="plantCode"
                    value={formData.plantCode}
                    onChange={handleChange}
                    required
                    className="w-full h-10 border rounded-lg px-3 mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Location
                  </label>

                  <input
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    required
                    className="w-full h-10 border rounded-lg px-3 mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Plant Admin
                  </label>

                  <input
                    name="plantAdmin"
                    value={formData.plantAdmin}
                    onChange={handleChange}
                    required
                    className="w-full h-10 border rounded-lg px-3 mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Conveyor Length
                  </label>

                  <input
                    type="number"
                    name="conveyorLength"
                    value={formData.conveyorLength}
                    onChange={handleChange}
                    className="w-full h-10 border rounded-lg px-3 mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Conveyor Speed
                  </label>

                  <input
                    type="number"
                    name="conveyorSpeed"
                    value={formData.conveyorSpeed}
                    onChange={handleChange}
                    className="w-full h-10 border rounded-lg px-3 mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Pitch Distance
                  </label>

                  <input
                    type="number"
                    name="pitchDistance"
                    value={formData.pitchDistance}
                    onChange={handleChange}
                    className="w-full h-10 border rounded-lg px-3 mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Set Per Round
                  </label>

                  <input
                    type="number"
                    name="setPerRound"
                    value={formData.setPerRound}
                    onChange={handleChange}
                    className="w-full h-10 border rounded-lg px-3 mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Available Time
                  </label>

                  <input
                    type="number"
                    name="availableTime"
                    value={formData.availableTime}
                    onChange={handleChange}
                    className="w-full h-10 border rounded-lg px-3 mt-1 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Efficiency
                  </label>

                  <select
                    name="efficiency"
                    value={formData.efficiency}
                    onChange={handleChange}
                    className="w-full h-10 border rounded-lg px-3 mt-1 text-sm"
                  >
                    <option value="100">100%</option>
                    <option value="95">95%</option>
                    <option value="85">85%</option>
                    <option value="75">75%</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-500">
                    Status
                  </label>

                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full h-10 border rounded-lg px-3 mt-1 text-sm"
                  >
                    <option>Active</option>
                    <option>Inactive</option>
                  </select>
                </div>

              </div>

              {/* CALC PREVIEW */}

              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mt-6">

                {[
                  ["Hangers", hangers],
                  ["Process Time", processTime],
                  ["Rounds", totalRoundsShift],
                  ["Effective", effectiveRounds],
                  ["Shift Output", productionPerShift],
                  ["Target / Day", totalTargetPerDay],
                ].map((item) => (
                  <div
                    key={item[0]}
                    className="border rounded-lg p-3 bg-slate-50"
                  >
                    <p className="text-[11px] text-slate-500">
                      {item[0]}
                    </p>

                    <h3 className="font-bold text-lg mt-1">
                      {item[1]}
                    </h3>
                  </div>
                ))}

              </div>

              {/* BUTTONS */}

              <div className="flex justify-end gap-3 mt-6">

                <button
                  type="button"
                  onClick={resetForm}
                  className="h-10 px-5 border rounded-lg"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="h-10 px-5 bg-cyan-700 hover:bg-cyan-800 text-white rounded-lg"
                >
                  {editingId
                    ? "Update Plant"
                    : "Save Plant"}
                </button>

              </div>

            </form>

          </div>
        </div>
      )}

      {/* DETAILS MODAL */}

      {isModalOpen &&
        selectedPlant && (

          <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >

            <div
              className="bg-white w-full max-w-4xl rounded-2xl shadow-xl max-h-[90vh] overflow-y-auto"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="flex justify-between items-center px-6 py-4 border-b">

                <h2 className="text-lg font-semibold">
                  Plant Details
                </h2>

                <button
                  onClick={closeModal}
                >
                  <X size={18} />
                </button>

              </div>

              <div className="p-6 grid md:grid-cols-2 gap-4">

                {Object.entries(
                  selectedPlant
                ).map(
                  ([key, value]) => {

                    if (
                      key === "_id" ||
                      key === "__v" ||
                      key === "createdAt" ||
                      key === "updatedAt"
                    )
                      return null;

                    return (
                      <div
                        key={key}
                        className="border rounded-lg p-4"
                      >

                        <p className="text-xs uppercase text-slate-500">
                          {key}
                        </p>

                        <p className="font-medium mt-1 text-slate-800">
                          {String(value)}
                        </p>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </div>

        )}

    </div>
  );
}
