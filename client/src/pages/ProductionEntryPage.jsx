import { useEffect, useState } from "react";

import api from "../services/api";

import ShiftSection from "../components/production/ShiftSection";
import ManpowerSection from "../components/production/ManpowerSection";
import ProductionSection from "../components/production/ProductionSection";
import DowntimeSection from "../components/production/DowntimeSection";
import ConsumableSection from "../components/production/ConsumableSection";
import QualitySection from "../components/production/QualitySection";


import { useAuth } from "../context/AuthContext";

export default function ProductionEntryPage() {
  const {user} = useAuth()
  const [models, setModels] = useState([]);
  const [plants, setPlants] = useState([]);


  const [formData, setFormData] = useState({
    date: "",
    shift: "Day",
    location: user.location || "",
    plant: user.plant || "",
    reportedBy: user.name || "",
    email: user.email || "",
    requiredManpower: "",
    availableManpower: "",
    shortManpower: 0,
    productionEntries: [],
    plannedDowntime: [],
    unplannedDowntime: [],
    consumables: [],
    powderConsumption: [],
    qualityDefects: [],
    reworks: [],
  });

  // FETCH MODELS
  useEffect(() => {
    fetchModels();
    fetchPlants();
  }, []);

const fetchModels = async () => {
  try {
    const res = await api.get("/models");
    setModels(
      Array.isArray(res.data)
        ? res.data
        : res.data.models || []
    );
  } catch (error) {
    console.log(error);
    setModels([]);
  }
};

const fetchPlants = async () => {
  try {
    const res = await api.get("/plants");
    console.log("PLANTS RESPONSE :", res.data);
    setPlants(
      Array.isArray(res.data)
        ? res.data
        : res.data.plants || []
    );
  } catch (error) {
    console.log(error);
    setPlants([]);
  }
};

  // COMMON INPUT
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

  };

  // MANPOWER AUTO
  useEffect(() => {
    const short = Number(formData.requiredManpower || 0) - Number(formData.availableManpower || 0);
    setFormData((prev) => ({
      ...prev,
      shortManpower: short,
    }));

  }, [
    formData.requiredManpower,
    formData.availableManpower,
  ]);

  // SAVE ENTRY
  const handleSubmit = async () => {
    try {
      const res = await api.post( "/production-entry", formData );
      alert("Production Entry Saved");
      console.log(res.data);
    } catch (error) {
      console.log(error);
      alert("Failed To Save");
    }
  };

  return (
    <div className="space-y-6">

      {/* PAGE HEADER */}
<div className="sticky top-0 z-40 bg-white border-b border-slate-200 px-6 py-4 rounded-b-2xl shadow-sm">

  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">

    {/* LEFT */}

    <div>

      <h1 className="text-3xl font-bold text-slate-800">
        Production MIS Entry
      </h1>

      <p className="text-slate-500 text-sm mt-1">
        Daily Production Monitoring System
      </p>

    </div>

    {/* RIGHT ACTIONS */}

    <div className="flex flex-wrap items-center gap-3">

      {/* LIVE */}

      <button className="flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-xl font-medium border border-green-200">

        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>

        LIVE

      </button>

      {/* REFRESH */}

      <button
        className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-xl font-medium transition-all"
      >
        Refresh
      </button>

      {/* EXCEL */}

      <button
        className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl font-medium transition-all"
      >
        Excel Report
      </button>

      {/* PDF */}

      <button
        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl font-medium transition-all"
      >
        PDF Report
      </button>

    </div>

  </div>

</div>

      {/* SHIFT */}

      <ShiftSection
        formData={formData}
        handleChange={handleChange}
      />

      {/* MANPOWER */}

      <ManpowerSection
        formData={formData}
        handleChange={handleChange}
      />

      {/* PRODUCTION */}

      <ProductionSection
        formData={formData}
        setFormData={setFormData}
        models={models}
      />

      {/* DOWNTIME */}

      <DowntimeSection
        formData={formData}
        setFormData={setFormData}
      />

      {/* CONSUMABLE */}

      <ConsumableSection
        formData={formData}
        setFormData={setFormData}
      />

      {/* QUALITY */}

      <QualitySection
        formData={formData}
        setFormData={setFormData}
        models={models}
      />

      {/* SAVE */}

      <div className="flex justify-end">

        <button
          onClick={handleSubmit}
          className="bg-cyan-700 hover:bg-cyan-800 transition-all text-white px-8 py-3 rounded-xl font-semibold"
        >
          Save Production Entry
        </button>

      </div>

    </div>
  );
}