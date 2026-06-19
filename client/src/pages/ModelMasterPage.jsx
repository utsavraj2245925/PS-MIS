import { useState, useEffect, useMemo } from "react";
import axios from "axios";

import {
  Box,
  Plus,
  Search,
  Download,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  XCircle,
  RefreshCcw,
} from "lucide-react";

const API_BASE =
  "http://localhost:4000/api/models";

export default function ModelMasterPage() {

  /* =========================
      FORM STATES
  ========================= */

  const [modelName, setModelName] =
    useState("");

  const [modelCode, setModelCode] =
    useState("");

  const [status, setStatus] =
    useState("Active");

  const [isSaving, setIsSaving] =
    useState(false);

  /* =========================
      FILTER STATES
  ========================= */

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter,
    setStatusFilter] =
    useState("All");

  /* =========================
      DATA STATES
  ========================= */

  const [models, setModels] =
    useState([]);

  const [isLoading,
    setIsLoading] =
    useState(true);

  const [loadError,
    setLoadError] =
    useState("");

  /* =========================
      MODALS
  ========================= */

  const [isAddOpen,
    setIsAddOpen] =
    useState(false);

  const [isEditOpen,
    setIsEditOpen] =
    useState(false);

  const [selectedModel,
    setSelectedModel] =
    useState(null);

  const [isViewOpen,
    setIsViewOpen] =
    useState(false);

  const [editingModel,
    setEditingModel] =
    useState(null);

  const [isUpdating,
    setIsUpdating] =
    useState(false);

  const [deleteTarget,
    setDeleteTarget] =
    useState(null);

  const [isDeleting,
    setIsDeleting] =
    useState(false);

  /* =========================
      TOAST
  ========================= */

  const [toast, setToast] =
    useState(null);

  const showToast = (
    message,
    type = "success"
  ) => {
    setToast({
      message,
      type,
    });

    window.clearTimeout(
      showToast._t
    );

    showToast._t =
      window.setTimeout(
        () => setToast(null),
        3000
      );
  };

  /* =========================
      FETCH MODELS
  ========================= */

  const fetchModels =
    async () => {

      setIsLoading(true);
      setLoadError("");

      try {

        const res =
          await axios.get(
            API_BASE
          );

        setModels(
          res.data?.data || []
        );

      } catch (error) {

        console.error(
          "Error fetching models:",
          error
        );

        setLoadError(
          error.response?.data
            ?.message ||
            "Unable to load models"
        );

      } finally {

        setIsLoading(false);

      }
    };

  useEffect(() => {
    fetchModels();
  }, []);

  /* =========================
      SAVE MODEL
  ========================= */

  const handleSaveModel =
    async () => {

      if (
        !modelName.trim() ||
        !modelCode.trim()
      ) {

        showToast(
          "Please fill Model Name & Model Code",
          "error"
        );

        return;
      }

      setIsSaving(true);

      try {

        await axios.post(
          API_BASE,
          {
            modelName:
              modelName.trim(),

            modelCode:
              modelCode.trim(),

            status,
          }
        );

        setModelName("");
        setModelCode("");
        setStatus("Active");

        await fetchModels();

        setIsAddOpen(false);

        showToast(
          "Model Added Successfully"
        );

      } catch (error) {

        showToast(
          error.response?.data
            ?.message ||
            "Error Saving Model",
          "error"
        );

      } finally {

        setIsSaving(false);

      }
    };

  /* =========================
      EDIT MODEL
  ========================= */

  const handleEdit = (
    model
  ) => {

    setEditingModel({
      ...model,
    });

    setIsEditOpen(true);
  };

  const handleUpdate =
    async () => {

      if (
        !editingModel.modelName.trim() ||
        !editingModel.modelCode.trim()
      ) {

        showToast(
          "Model Name & Model Code required",
          "error"
        );

        return;
      }

      setIsUpdating(true);

      try {

        await axios.put(
          `${API_BASE}/${editingModel._id}`,
          {
            modelName:
              editingModel.modelName.trim(),

            modelCode:
              editingModel.modelCode.trim(),

            status:
              editingModel.status,
          }
        );

        await fetchModels();

        setIsEditOpen(false);
        setEditingModel(null);

        showToast(
          "Model Updated Successfully"
        );

      } catch (error) {

        showToast(
          error.response?.data
            ?.message ||
            "Update Failed",
          "error"
        );

      } finally {

        setIsUpdating(false);

      }
    };

  /* =========================
      DELETE MODEL
  ========================= */

  const requestDelete =
    (model) => {
      setDeleteTarget(model);
    };

  const confirmDelete =
    async () => {

      if (!deleteTarget)
        return;

      setIsDeleting(true);

      try {

        await axios.delete(
          `${API_BASE}/${deleteTarget._id}`
        );

        await fetchModels();

        showToast(
          "Model Deleted Successfully"
        );

      } catch (error) {

        showToast(
          error.response?.data
            ?.message ||
            "Delete Failed",
          "error"
        );

      } finally {

        setDeleteTarget(null);
        setIsDeleting(false);

      }
    };

  /* =========================
      EXPORT
  ========================= */

  const handleExport = () => {

    if (
      models.length === 0
    ) {

      showToast(
        "No Models Available",
        "error"
      );

      return;
    }

    const headers = [
      "Model Name",
      "Model Code",
      "Status",
    ];

    const escapeCsv =
      (val) =>
        `"${String(
          val ?? ""
        ).replace(
          /"/g,
          '""'
        )}"`;

    const rows =
      models.map((m) => [
        escapeCsv(
          m.modelName
        ),
        escapeCsv(
          m.modelCode
        ),
        escapeCsv(
          m.status
        ),
      ]);

    const csv =
      [headers, ...rows]
        .map((row) =>
          row.join(",")
        )
        .join("\n");

    const blob =
      new Blob([csv], {
        type:
          "text/csv;charset=utf-8;",
      });

    const url =
      window.URL.createObjectURL(
        blob
      );

    const a =
      document.createElement(
        "a"
      );

    a.href = url;
    a.download =
      "models.csv";

    a.click();

    window.URL.revokeObjectURL(
      url
    );
  };

  /* =========================
      FILTERED DATA
  ========================= */

  const filteredModels =
    useMemo(() => {

      return models.filter(
        (model) => {

          const term =
            searchTerm.toLowerCase();

          const searchMatch =
            model.modelName
              ?.toLowerCase()
              .includes(term) ||
            model.modelCode
              ?.toLowerCase()
              .includes(term);

          const statusMatch =
            statusFilter ===
              "All" ||
            model.status ===
              statusFilter;

          return (
            searchMatch &&
            statusMatch
          );
        }
      );

    }, [
      models,
      searchTerm,
      statusFilter,
    ]);

  const activeCount =
    useMemo(
      () =>
        models.filter(
          (m) =>
            m.status ===
            "Active"
        ).length,
      [models]
    );

  const inactiveCount =
    useMemo(
      () =>
        models.filter(
          (m) =>
            m.status ===
            "Inactive"
        ).length,
      [models]
    );

  return (

    <div className="min-h-screen bg-white p-4 lg:p-5">

      {/* TOAST */}

      {toast && (

        <div
          className={`fixed top-5 right-5 z-50 px-4 py-2 rounded-xl text-sm font-medium shadow-xl ${
            toast.type ===
            "error"
              ? "bg-red-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {toast.message}
        </div>

      )}

      {/* HEADER */}

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-5">

        <div className="flex items-center gap-3">

          <div className="bg-cyan-700 text-white p-3 rounded-xl">
            <Box size={22} />
          </div>

          <div>

            <h1 className="text-xl font-bold text-slate-800">
              Model Master
            </h1>

            <p className="text-xs text-slate-500">
              Product Model Management
            </p>

          </div>

        </div>

        <div className="flex flex-wrap gap-2">

          <button
            onClick={fetchModels}
            className="h-10 px-4 border rounded-lg text-sm flex items-center gap-2 hover:bg-slate-50"
          >
            <RefreshCcw size={15} />
            Refresh
          </button>

          <button
            onClick={handleExport}
            className="h-10 px-4 border rounded-lg text-sm flex items-center gap-2 hover:bg-slate-50"
          >
            <Download size={15} />
            Export
          </button>

          <button
            onClick={() =>
              setIsAddOpen(true)
            }
            className="h-10 px-4 bg-cyan-700 text-white rounded-lg text-sm flex items-center gap-2"
          >
            <Plus size={15} />
            Add Model
          </button>

        </div>

      </div>

      {/* KPI CARDS */}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">

        <div className="bg-white border rounded-xl p-4">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-xs text-slate-500">
                Total Models
              </p>

              <h2 className="text-2xl font-bold mt-1 text-cyan-700">
                {models.length}
              </h2>

            </div>

            <Box
              size={24}
              className="text-cyan-700"
            />

          </div>

        </div>

        <div className="bg-white border rounded-xl p-4">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-xs text-slate-500">
                Active
              </p>

              <h2 className="text-2xl font-bold mt-1 text-emerald-600">
                {activeCount}
              </h2>

            </div>

            <CheckCircle2
              size={24}
              className="text-emerald-600"
            />

          </div>

        </div>

        <div className="bg-white border rounded-xl p-4">

          <div className="flex justify-between items-center">

            <div>

              <p className="text-xs text-slate-500">
                Inactive
              </p>

              <h2 className="text-2xl font-bold mt-1 text-red-600">
                {inactiveCount}
              </h2>

            </div>

            <XCircle
              size={24}
              className="text-red-600"
            />

          </div>

        </div>

      </div>

            {/* =====================================
          ADD MODEL MODAL
      ===================================== */}

      {isAddOpen && (

        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">

            <div className="flex items-center justify-between px-5 py-4 border-b">

              <div>

                <h2 className="text-lg font-semibold text-slate-800">
                  Add New Model
                </h2>

                <p className="text-xs text-slate-500">
                  Create a new product model
                </p>

              </div>

              <button
                onClick={() =>
                  setIsAddOpen(false)
                }
                className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
              >
                <X size={18} />
              </button>

            </div>

            <div className="p-5">

              <div className="grid md:grid-cols-2 gap-4">

                <div>

                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Model Name
                  </label>

                  <input
                    value={modelName}
                    onChange={(e) =>
                      setModelName(
                        e.target.value
                      )
                    }
                    placeholder="Enter Model Name"
                    className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  />

                </div>

                <div>

                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Model Code
                  </label>

                  <input
                    value={modelCode}
                    onChange={(e) =>
                      setModelCode(
                        e.target.value
                      )
                    }
                    placeholder="Enter Model Code"
                    className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                  />

                </div>

                <div className="md:col-span-2">

                  <label className="block text-xs font-medium text-slate-600 mb-2">
                    Status
                  </label>

                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(
                        e.target.value
                      )
                    }
                    className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
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

              <div className="flex justify-end gap-3 mt-6">

                <button
                  onClick={() =>
                    setIsAddOpen(false)
                  }
                  className="h-10 px-5 border rounded-lg text-sm"
                >
                  Cancel
                </button>

                <button
                  onClick={
                    handleSaveModel
                  }
                  disabled={isSaving}
                  className="h-10 px-5 bg-cyan-700 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {isSaving
                    ? "Saving..."
                    : "Save Model"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* =====================================
          SEARCH & FILTER
      ===================================== */}

      <div className="bg-white border rounded-xl p-4 mb-5">

        <div className="grid md:grid-cols-2 gap-4">

          <div className="relative">

            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-400"
            />

            <input
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(
                  e.target.value
                )
              }
              placeholder="Search model name or code..."
              className="w-full h-10 pl-10 pr-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
            />

          </div>

          <select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(
                e.target.value
              )
            }
            className="h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
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

      {/* =====================================
          MODEL TABLE
      ===================================== */}

      <div className="bg-white border rounded-xl overflow-hidden shadow-sm">

        <div className="flex justify-between items-center px-4 py-3 border-b">

          <h2 className="font-semibold text-slate-800">
            Model List
          </h2>

          <span className="text-xs text-slate-500">
            {filteredModels.length} of {models.length} Models
          </span>

        </div>

        {isLoading ? (

          <div className="text-center py-14 text-slate-400 text-sm">
            Loading Models...
          </div>

        ) : loadError ? (

          <div className="text-center py-14">

            <p className="text-red-600 text-sm mb-3">
              {loadError}
            </p>

            <button
              onClick={fetchModels}
              className="bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm"
            >
              Retry
            </button>

          </div>

        ) : filteredModels.length === 0 ? (

          <div className="text-center py-14 text-slate-400 text-sm">
            No Models Found
          </div>

        ) : (

          <div className="overflow-x-auto max-h-[550px]">

            <table className="w-full text-sm">

              <thead className="sticky top-0 bg-slate-50 z-10">

                <tr>

                  <th className="text-left px-4 py-3 font-semibold">
                    Model Name
                  </th>

                  <th className="text-left px-4 py-3 font-semibold">
                    Model Code
                  </th>

                  <th className="text-left px-4 py-3 font-semibold">
                    Status
                  </th>

                  <th className="text-left px-4 py-3 font-semibold">
                    Actions
                  </th>

                </tr>

              </thead>

              <tbody>

                {filteredModels.map(
                  (model) => (

                    <tr
                      key={model._id}
                      onClick={() => {
                        setSelectedModel(
                          model
                        );
                        setIsViewOpen(
                          true
                        );
                      }}
                      className="border-t hover:bg-slate-50 cursor-pointer transition"
                    >

                      <td className="px-4 py-3 font-medium text-slate-800">
                        {model.modelName}
                      </td>

                      <td className="px-4 py-3 font-mono text-slate-600">
                        {model.modelCode}
                      </td>

                      <td className="px-4 py-3">

                        {model.status ===
                        "Active" ? (

                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium">

                            <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>

                            Active

                          </span>

                        ) : (

                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-red-700 text-xs font-medium">

                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>

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

                        <div className="flex gap-2">

                          <button
                            onClick={() =>
                              handleEdit(
                                model
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100 flex items-center justify-center"
                          >
                            <Pencil
                              size={15}
                              className="text-amber-600"
                            />
                          </button>

                          <button
                            onClick={() =>
                              requestDelete(
                                model
                              )
                            }
                            className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 flex items-center justify-center"
                          >
                            <Trash2
                              size={15}
                              className="text-red-600"
                            />
                          </button>

                        </div>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

            {/* =====================================
          VIEW DETAILS MODAL
      ===================================== */}

      {isViewOpen &&
        selectedModel && (

          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setIsViewOpen(false);
              setSelectedModel(null);
            }}
          >

            <div
              className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              <div className="flex items-center justify-between px-5 py-4 border-b">

                <div>

                  <h2 className="text-lg font-semibold text-slate-800">
                    Model Details
                  </h2>

                  <p className="text-xs text-slate-500">
                    Complete Model Information
                  </p>

                </div>

                <button
                  onClick={() => {
                    setIsViewOpen(false);
                    setSelectedModel(null);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                >
                  <X size={18} />
                </button>

              </div>

              <div className="p-5">

                <div className="grid md:grid-cols-2 gap-4">

                  <div className="border rounded-xl p-4">

                    <p className="text-xs text-slate-500 mb-1">
                      Model Name
                    </p>

                    <h3 className="font-semibold text-slate-800">
                      {selectedModel.modelName}
                    </h3>

                  </div>

                  <div className="border rounded-xl p-4">

                    <p className="text-xs text-slate-500 mb-1">
                      Model Code
                    </p>

                    <h3 className="font-semibold text-slate-800">
                      {selectedModel.modelCode}
                    </h3>

                  </div>

                  <div className="border rounded-xl p-4">

                    <p className="text-xs text-slate-500 mb-1">
                      Status
                    </p>

                    <h3
                      className={`font-semibold ${
                        selectedModel.status ===
                        "Active"
                          ? "text-emerald-600"
                          : "text-red-600"
                      }`}
                    >
                      {selectedModel.status}
                    </h3>

                  </div>

                  <div className="border rounded-xl p-4">

                    <p className="text-xs text-slate-500 mb-1">
                      Database ID
                    </p>

                    <h3 className="font-mono text-sm text-slate-700 break-all">
                      {selectedModel._id}
                    </h3>

                  </div>

                  {selectedModel.createdAt && (

                    <div className="border rounded-xl p-4">

                      <p className="text-xs text-slate-500 mb-1">
                        Created On
                      </p>

                      <h3 className="font-semibold text-slate-800">
                        {new Date(
                          selectedModel.createdAt
                        ).toLocaleString()}
                      </h3>

                    </div>

                  )}

                  {selectedModel.updatedAt && (

                    <div className="border rounded-xl p-4">

                      <p className="text-xs text-slate-500 mb-1">
                        Last Updated
                      </p>

                      <h3 className="font-semibold text-slate-800">
                        {new Date(
                          selectedModel.updatedAt
                        ).toLocaleString()}
                      </h3>

                    </div>

                  )}

                </div>

              </div>

            </div>

          </div>

        )}

      {/* =====================================
          EDIT MODAL
      ===================================== */}

      {isEditOpen &&
        editingModel && (

          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden">

              <div className="flex justify-between items-center px-5 py-4 border-b">

                <div>

                  <h2 className="text-lg font-semibold text-slate-800">
                    Edit Model
                  </h2>

                  <p className="text-xs text-slate-500">
                    Update Model Information
                  </p>

                </div>

                <button
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingModel(null);
                  }}
                  className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center"
                >
                  <X size={18} />
                </button>

              </div>

              <div className="p-5">

                <div className="grid gap-4">

                  <div>

                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Model Name
                    </label>

                    <input
                      value={
                        editingModel.modelName
                      }
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          modelName:
                            e.target.value,
                        })
                      }
                      className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />

                  </div>

                  <div>

                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Model Code
                    </label>

                    <input
                      value={
                        editingModel.modelCode
                      }
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          modelCode:
                            e.target.value,
                        })
                      }
                      className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
                    />

                  </div>

                  <div>

                    <label className="block text-xs font-medium text-slate-600 mb-2">
                      Status
                    </label>

                    <select
                      value={
                        editingModel.status
                      }
                      onChange={(e) =>
                        setEditingModel({
                          ...editingModel,
                          status:
                            e.target.value,
                        })
                      }
                      className="w-full h-10 border rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-600"
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

                <div className="flex justify-end gap-3 mt-6">

                  <button
                    onClick={() => {
                      setIsEditOpen(false);
                      setEditingModel(null);
                    }}
                    disabled={isUpdating}
                    className="h-10 px-5 border rounded-lg text-sm"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleUpdate}
                    disabled={isUpdating}
                    className="h-10 px-5 bg-cyan-700 text-white rounded-lg text-sm disabled:opacity-50"
                  >
                    {isUpdating
                      ? "Updating..."
                      : "Update Model"}
                  </button>

                </div>

              </div>

            </div>

          </div>

        )}

      {/* =====================================
          DELETE MODAL
      ===================================== */}

      {deleteTarget && (

        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">

          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

            <div className="p-5">

              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">

                <Trash2
                  size={24}
                  className="text-red-600"
                />

              </div>

              <h2 className="text-lg font-semibold text-slate-800 mb-2">
                Delete Model?
              </h2>

              <p className="text-sm text-slate-500 mb-6">
                Are you sure you want to delete
                <span className="font-semibold text-slate-700">
                  {" "}
                  {deleteTarget.modelName}
                </span>
                ? This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3">

                <button
                  onClick={() =>
                    setDeleteTarget(null)
                  }
                  disabled={isDeleting}
                  className="h-10 px-5 border rounded-lg text-sm"
                >
                  Cancel
                </button>

                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="h-10 px-5 bg-red-600 text-white rounded-lg text-sm disabled:opacity-50"
                >
                  {isDeleting
                    ? "Deleting..."
                    : "Delete"}
                </button>

              </div>

            </div>

          </div>

        </div>

      )}

    </div>
  );
}
  