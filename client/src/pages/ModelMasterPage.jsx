import { useState, useEffect, useMemo } from "react";
import axios from "axios";

const API_BASE = "http://localhost:4000/api/models";

export default function ModelMasterPage() {
  const [modelName, setModelName] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [status, setStatus] = useState("Active");
  const [isSaving, setIsSaving] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const [models, setModels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingModel, setEditingModel] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    window.clearTimeout(showToast._t);
    showToast._t = window.setTimeout(() => setToast(null), 3000);
  };

  const fetchModels = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const res = await axios.get(API_BASE);
      setModels(res.data?.data || []);
    } catch (error) {
      console.error("Error fetching models:", error);
      setLoadError(
        error.response?.data?.message ||
          "Could not load models. Please check your connection and try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const handleSaveModel = async () => {
    if (!modelName.trim() || !modelCode.trim()) {
      showToast("Please fill in both model name and model code", "error");
      return;
    }

    setIsSaving(true);
    try {
      await axios.post(API_BASE, {
        modelName: modelName.trim(),
        modelCode: modelCode.trim(),
        status,
      });

      setModelName("");
      setModelCode("");
      setStatus("Active");

      await fetchModels();
      showToast("Model added successfully");
    } catch (error) {
      console.error("Save error:", error);
      showToast(
        error.response?.data?.message || "Error saving model",
        "error"
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (model) => {
    setEditingModel({ ...model });
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!editingModel.modelName.trim() || !editingModel.modelCode.trim()) {
      showToast("Model name and model code cannot be empty", "error");
      return;
    }

    setIsUpdating(true);
    try {
      await axios.put(`${API_BASE}/${editingModel._id}`, {
        modelName: editingModel.modelName.trim(),
        modelCode: editingModel.modelCode.trim(),
        status: editingModel.status,
      });

      await fetchModels();
      setIsEditOpen(false);
      setEditingModel(null);
      showToast("Model updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      showToast(
        error.response?.data?.message || error.message || "Update failed",
        "error"
      );
    } finally {
      setIsUpdating(false);
    }
  };

  const requestDelete = (model) => {
    setDeleteTarget(model);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE}/${deleteTarget._id}`);
      await fetchModels();
      showToast("Model deleted successfully");
    } catch (error) {
      console.error("Delete error:", error);
      showToast(
        error.response?.data?.message || "Delete failed",
        "error"
      );
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  };

  const handleExport = () => {
    if (models.length === 0) {
      showToast("No models to export", "error");
      return;
    }

    const headers = ["Model Name", "Model Code", "Status"];
    const escapeCsv = (val) => `"${String(val ?? "").replace(/"/g, '""')}"`;

    const rows = models.map((m) => [
      escapeCsv(m.modelName),
      escapeCsv(m.modelCode),
      escapeCsv(m.status),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "models.csv";
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const term = searchTerm.toLowerCase();
      const searchMatch =
        model.modelName?.toLowerCase().includes(term) ||
        model.modelCode?.toLowerCase().includes(term);

      const statusMatch =
        statusFilter === "All" || model.status === statusFilter;

      return searchMatch && statusMatch;
    });
  }, [models, searchTerm, statusFilter]);

  const activeCount = useMemo(
    () => models.filter((m) => m.status === "Active").length,
    [models]
  );

  const inactiveCount = useMemo(
    () => models.filter((m) => m.status === "Inactive").length,
    [models]
  );

  return (
    <div className="min-h-screen bg-white p-6">
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg text-sm font-medium ${
            toast.type === "error"
              ? "bg-red-600 text-white"
              : "bg-emerald-600 text-white"
          }`}
        >
          {toast.message}
        </div>
      )}

      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-4xl font-bold text-slate-800">Model Master</h1>
          <p className="text-slate-500">Manage all AC models</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={fetchModels}
            disabled={isLoading}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-5 py-2 rounded-lg font-medium disabled:opacity-50 transition"
          >
            {isLoading ? "Refreshing..." : "Refresh"}
          </button>
          <button
            onClick={handleExport}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 rounded-lg font-medium shadow-sm transition"
          >
            Export
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium">Total Models</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">
            {models.length}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium">
            Active Models
          </h3>
          <p className="text-4xl font-bold text-emerald-600 mt-2">
            {activeCount}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <h3 className="text-slate-500 text-sm font-medium">
            Inactive Models
          </h3>
          <p className="text-4xl font-bold text-red-600 mt-2">
            {inactiveCount}
          </p>
        </div>
      </div>

      {/* Add Form */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-slate-800">
          Add New Model
        </h2>

        <div className="grid md:grid-cols-4 gap-4">
          <input
            value={modelName}
            onChange={(e) => setModelName(e.target.value)}
            placeholder="Model Name"
            className="border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <input
            value={modelCode}
            onChange={(e) => setModelCode(e.target.value)}
            placeholder="Model Code"
            className="border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option>Active</option>
            <option>Inactive</option>
          </select>

          <button
            onClick={handleSaveModel}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50 transition py-3"
          >
            {isSaving ? "Saving..." : "Save Model"}
          </button>
        </div>
      </div>

      {/* Search + Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="flex gap-4 mb-5 flex-wrap">
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or code..."
            className="border border-slate-300 p-3 rounded-lg flex-1 min-w-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-slate-300 p-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>

        {isLoading ? (
          <div className="text-center py-16 text-slate-400">
            Loading models...
          </div>
        ) : loadError ? (
          <div className="text-center py-16">
            <p className="text-red-600 font-medium mb-3">{loadError}</p>
            <button
              onClick={fetchModels}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-medium transition"
            >
              Retry
            </button>
          </div>
        ) : filteredModels.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            {models.length === 0
              ? "No models found. Add your first model above."
              : "No models match your search or filter."}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-3 text-left text-slate-600 font-semibold rounded-tl-lg">
                    Model Name
                  </th>
                  <th className="p-3 text-left text-slate-600 font-semibold">
                    Model Code
                  </th>
                  <th className="p-3 text-left text-slate-600 font-semibold">
                    Status
                  </th>
                  <th className="p-3 text-left text-slate-600 font-semibold rounded-tr-lg">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredModels.map((model) => (
                  <tr
                    key={model._id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition"
                  >
                    <td className="p-3 text-slate-800">{model.modelName}</td>
                    <td className="p-3 text-slate-600">{model.modelCode}</td>
                    <td className="p-3">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          model.status === "Active"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {model.status}
                      </span>
                    </td>
                    <td className="p-3">
                      <button
                        onClick={() => handleEdit(model)}
                        className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 rounded-lg mr-2 text-sm font-medium transition"
                      >
                        Edit
                      </button>

                      <button
                        onClick={() => requestDelete(model)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditOpen && editingModel && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-xl">
            <h2 className="text-2xl font-bold mb-4 text-slate-800">
              Edit Model
            </h2>

            <label className="block text-sm font-medium text-slate-600 mb-1">
              Model Name
            </label>
            <input
              value={editingModel.modelName}
              onChange={(e) =>
                setEditingModel({
                  ...editingModel,
                  modelName: e.target.value,
                })
              }
              className="border border-slate-300 p-3 rounded-lg w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <label className="block text-sm font-medium text-slate-600 mb-1">
              Model Code
            </label>
            <input
              value={editingModel.modelCode}
              onChange={(e) =>
                setEditingModel({
                  ...editingModel,
                  modelCode: e.target.value,
                })
              }
              className="border border-slate-300 p-3 rounded-lg w-full mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            <label className="block text-sm font-medium text-slate-600 mb-1">
              Status
            </label>
            <select
              value={editingModel.status}
              onChange={(e) =>
                setEditingModel({ ...editingModel, status: e.target.value })
              }
              className="border border-slate-300 p-3 rounded-lg w-full mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option>Active</option>
              <option>Inactive</option>
            </select>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingModel(null);
                }}
                disabled={isUpdating}
                className="border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={handleUpdate}
                disabled={isUpdating}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {isUpdating ? "Updating..." : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-40 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl">
            <h2 className="text-xl font-bold mb-2 text-slate-800">
              Delete model?
            </h2>
            <p className="text-slate-500 mb-6">
              Are you sure you want to delete{" "}
              <span className="font-medium text-slate-700">
                {deleteTarget.modelName}
              </span>
              ? This action cannot be undone.
            </p>

            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
                className="border border-slate-300 px-4 py-2 rounded-lg font-medium hover:bg-slate-50 transition disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={confirmDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}