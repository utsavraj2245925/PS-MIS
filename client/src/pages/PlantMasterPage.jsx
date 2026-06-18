import React, {
  useState,
  useEffect,
} from "react";

import {
  Factory,
  Search,
  Plus,
  Download,
  Hash,
  MapPin,
  User,
  Ruler,
  Gauge,
  Layers,
  Package,
  Clock,
  Percent,
  RotateCw,
  Activity,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Pencil,
  Trash2,
  X,
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

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
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
      MODAL
  =================================== */

  const openModal = (
    plant
  ) => {
    setSelectedPlant(
      plant
    );
    setIsModalOpen(true);
  };

  const closeModal =
    () => {
      setIsModalOpen(
        false
      );
      setSelectedPlant(
        null
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
      className="min-h-screen bg-white p-6"
      style={{
        fontFamily:
          "'IBM Plex Sans', sans-serif",
      }}
    >

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-8">

        <div className="flex items-center gap-4">

          <div className="bg-cyan-700 p-4 rounded-2xl text-white">
            <Factory size={30} />
          </div>

          <div>
            <h1 className="text-3xl font-bold text-slate-800">
              Plant Master
            </h1>

            <p className="text-slate-500">
              Conveyor Capacity &
              Plant Management
            </p>
          </div>

        </div>

        <div className="flex gap-3">

          <button className="bg-white border px-4 py-3 rounded-xl flex items-center gap-2">
            <Download size={18} />
            Export
          </button>

          <button
            onClick={() => {
              resetForm();
              window.scrollTo({
                top: 0,
                behavior:
                  "smooth",
              });
            }}
            className="bg-cyan-700 text-white px-5 py-3 rounded-xl flex items-center gap-2"
          >
            <Plus size={18} />
            Add Plant
          </button>

        </div>

      </div>
            {/* SEARCH & FILTER */}

      <div className="bg-white border rounded-2xl shadow-sm p-5 mb-6">

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

          <div className="relative">

            <Search
              size={18}
              className="absolute left-3 top-4 text-slate-400"
            />

            <input
              type="text"
              placeholder="Search Plant Name or Code..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              className="w-full border rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-700"
            />

          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-700"
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

      {/* STAT CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">

        <div className="bg-white border rounded-2xl p-6 shadow-sm">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-slate-500">
                Total Plants
              </p>

              <h2
                className="text-4xl font-bold mt-2"
                style={{
                  fontFamily:
                    "'IBM Plex Mono', monospace",
                }}
              >
                {totalPlants}
              </h2>

            </div>

            <Factory
              size={34}
              className="text-cyan-700"
            />

          </div>

        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-slate-500">
                Active Plants
              </p>

              <h2
                className="text-4xl font-bold mt-2 text-emerald-600"
                style={{
                  fontFamily:
                    "'IBM Plex Mono', monospace",
                }}
              >
                {activePlants}
              </h2>

            </div>

            <CheckCircle2
              size={34}
              className="text-emerald-600"
            />

          </div>

        </div>

        <div className="bg-white border rounded-2xl p-6 shadow-sm">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-slate-500">
                Inactive Plants
              </p>

              <h2
                className="text-4xl font-bold mt-2 text-rose-600"
                style={{
                  fontFamily:
                    "'IBM Plex Mono', monospace",
                }}
              >
                {inactivePlants}
              </h2>

            </div>

            <XCircle
              size={34}
              className="text-rose-600"
            />

          </div>

        </div>

      </div>

      {/* FORM */}

      <form
        onSubmit={handleSubmit}
        className="bg-white border rounded-2xl shadow-sm p-6 mb-8"
      >

        <div className="flex items-center gap-3 mb-6">

          <Factory
            size={24}
            className="text-cyan-700"
          />

          <h2 className="text-2xl font-bold">

            {editingId
              ? "Edit Plant"
              : "Add New Plant"}

          </h2>

        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

          <div>

            <label className="text-sm text-slate-600">
              Plant Name
            </label>

            <input
              name="plantName"
              value={
                formData.plantName
              }
              onChange={
                handleChange
              }
              className="w-full border rounded-xl p-3 mt-1"
            />

          </div>

          <div>

            <label className="text-sm text-slate-600">
              Plant Code
            </label>

            <input
              name="plantCode"
              value={
                formData.plantCode
              }
              onChange={
                handleChange
              }
              className="w-full border rounded-xl p-3 mt-1"
            />

          </div>

          <div>

            <label className="text-sm text-slate-600">
              Location
            </label>

            <input
              name="location"
              value={
                formData.location
              }
              onChange={
                handleChange
              }
              className="w-full border rounded-xl p-3 mt-1"
            />

          </div>

          <div>

            <label className="text-sm text-slate-600">
              Plant Admin
            </label>

            <input
              name="plantAdmin"
              value={
                formData.plantAdmin
              }
              onChange={
                handleChange
              }
              className="w-full border rounded-xl p-3 mt-1"
            />

          </div>

          <div>

            <label className="text-sm text-slate-600">
              Conveyor Length
            </label>

            <input
              type="number"
              name="conveyorLength"
              value={
                formData.conveyorLength
              }
              onChange={
                handleChange
              }
              className="w-full border rounded-xl p-3 mt-1"
            />

          </div>

          <div>

            <label className="text-sm text-slate-600">
              Conveyor Speed
            </label>

            <input
              type="number"
              name="conveyorSpeed"
              value={
                formData.conveyorSpeed
              }
              onChange={
                handleChange
              }
              className="w-full border rounded-xl p-3 mt-1"
            />

          </div>

          <div>

            <label className="text-sm text-slate-600">
              Pitch Distance
            </label>

            <input
              type="number"
              name="pitchDistance"
              value={
                formData.pitchDistance
              }
              onChange={
                handleChange
              }
              className="w-full border rounded-xl p-3 mt-1"
            />

          </div>

          <div>

            <label className="text-sm text-slate-600">
              Set Per Round
            </label>

            <input
              type="number"
              name="setPerRound"
              value={
                formData.setPerRound
              }
              onChange={
                handleChange
              }
              className="w-full border rounded-xl p-3 mt-1"
            />

          </div>

          <div>

            <label className="text-sm text-slate-600">
              Available Time
            </label>

            <input
              type="number"
              name="availableTime"
              value={
                formData.availableTime
              }
              onChange={
                handleChange
              }
              className="w-full border rounded-xl p-3 mt-1"
            />

          </div>

          <div>

            <label className="text-sm text-slate-600">
              Efficiency
            </label>

            <select
              name="efficiency"
              value={
                formData.efficiency
              }
              onChange={
                handleChange
              }
              className="w-full border rounded-xl p-3 mt-1"
            >
              <option value="100">
                100%
              </option>
              <option value="95">
                95%
              </option>
              <option value="85">
                85%
              </option>
              <option value="75">
                75%
              </option>
            </select>

          </div>

          <div>

            <label className="text-sm text-slate-600">
              Status
            </label>

            <select
              name="status"
              value={
                formData.status
              }
              onChange={
                handleChange
              }
              className="w-full border rounded-xl p-3 mt-1"
            >
              <option>
                Active
              </option>

              <option>
                Inactive
              </option>

            </select>

          </div>

        </div>
                <div className="mt-6 flex gap-3">

          <button
            type="submit"
            className="bg-cyan-700 text-white px-6 py-3 rounded-xl hover:bg-cyan-800 transition"
          >
            {editingId
              ? "Update Plant"
              : "Save Plant"}
          </button>

          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="border px-6 py-3 rounded-xl"
            >
              Cancel Edit
            </button>
          )}

        </div>

      </form>

      {/* CAPACITY PANEL */}

      <div className="bg-white border rounded-2xl shadow-sm p-6 mb-8">

        <div className="flex items-center gap-3 mb-6">

          <Activity
            size={24}
            className="text-cyan-700"
          />

          <h2 className="text-2xl font-bold">
            Plant Capacity Calculation
          </h2>

        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">

          <div className="border rounded-xl p-4">
            <p className="text-slate-500 text-sm">
              Hangers
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {hangers}
            </h3>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-slate-500 text-sm">
              Process Time
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {processTime}
            </h3>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-slate-500 text-sm">
              Total Rounds
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {totalRoundsShift}
            </h3>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-slate-500 text-sm">
              Effective Rounds
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {effectiveRounds}
            </h3>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-slate-500 text-sm">
              Production/Shift
            </p>
            <h3 className="text-2xl font-bold font-mono">
              {productionPerShift}
            </h3>
          </div>

          <div className="border rounded-xl p-4">
            <p className="text-slate-500 text-sm">
              Target/Day
            </p>
            <h3 className="text-2xl font-bold font-mono text-cyan-700">
              {totalTargetPerDay}
            </h3>
          </div>

        </div>

      </div>

      {/* PLANT TABLE */}

      <div className="bg-white border rounded-2xl shadow-sm p-6">

        <div className="flex justify-between items-center mb-6">

          <h2 className="text-2xl font-bold">
            Plant List
          </h2>

          <span className="text-slate-500">
            {filteredPlants.length} of {plants.length} plants
          </span>

        </div>

        <div className="overflow-x-auto">

          <table className="w-full">

            <thead>

              <tr className="border-b bg-slate-50">

                <th className="text-left p-4">
                  Plant
                </th>

                <th className="text-left p-4">
                  Code
                </th>

                <th className="text-left p-4">
                  Location
                </th>

                <th className="text-left p-4">
                  Admin
                </th>

                <th className="text-left p-4">
                  Target / Day
                </th>

                <th className="text-left p-4">
                  Status
                </th>

                <th className="text-left p-4">
                  Actions
                </th>

              </tr>

            </thead>

            <tbody>

              {loading ? (

                <tr>

                  <td
                    colSpan="7"
                    className="text-center p-10"
                  >
                    Loading...
                  </td>

                </tr>

              ) : filteredPlants.length === 0 ? (

                <tr>

                  <td
                    colSpan="7"
                    className="text-center p-10"
                  >
                    No Plants Found
                  </td>

                </tr>

              ) : (

                filteredPlants.map(
                  (plant) => (

                    <tr
                      key={plant._id}
                      className="border-b hover:bg-slate-50 cursor-pointer"
                      onClick={() =>
                        openModal(
                          plant
                        )
                      }
                    >

                      <td className="p-4 font-semibold">
                        {plant.plantName}
                      </td>

                      <td className="p-4 font-mono">
                        {plant.plantCode}
                      </td>

                      <td className="p-4">
                        {plant.location}
                      </td>

                      <td className="p-4">
                        {plant.plantAdmin}
                      </td>

                      <td className="p-4 font-mono">
                        {plant.totalTargetPerDay?.toLocaleString()}
                      </td>

                      <td className="p-4">

                        {plant.status ===
                        "Active" ? (

                          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full">

                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>

                            Active

                          </div>

                        ) : (

                          <div className="inline-flex items-center gap-2 bg-rose-50 text-rose-700 px-3 py-1 rounded-full">

                            <div className="w-2 h-2 rounded-full bg-rose-500"></div>

                            Inactive

                          </div>

                        )}

                      </td>

                      <td
                        className="p-4"
                        onClick={(e) =>
                          e.stopPropagation()
                        }
                      >

                        <div className="flex gap-3">

                          <button
                            onClick={() =>
                              handleEdit(
                                plant
                              )
                            }
                          >
                            <Pencil
                              size={18}
                              className="text-cyan-700"
                            />
                          </button>

                          <button
                            onClick={() =>
                              handleDelete(
                                plant._id
                              )
                            }
                          >
                            <Trash2
                              size={18}
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

      {/* DETAILS MODAL */}

      {isModalOpen &&
        selectedPlant && (

          <div
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={closeModal}
          >

            <div
              className="bg-white rounded-3xl max-w-4xl w-full p-8 max-h-[90vh] overflow-y-auto"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="flex justify-between items-center mb-6">

                <h2 className="text-2xl font-bold">
                  Plant Details
                </h2>

                <button
                  onClick={
                    closeModal
                  }
                >
                  <X />
                </button>

              </div>

              <div className="grid md:grid-cols-2 gap-5">

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
                        className="border rounded-xl p-4"
                      >
                        <p className="text-slate-500 text-sm">
                          {key}
                        </p>

                        <h4 className="font-semibold mt-1">
                          {String(
                            value
                          )}
                        </h4>

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