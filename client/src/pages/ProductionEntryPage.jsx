import { useEffect, useState } from "react";
import { Button, Tag, Space, Card, message } from "antd";
import { RefreshCw, FileSpreadsheet, FileText, Radio } from "lucide-react";

import api from "../services/api";

import ShiftSection from "../components/production/ShiftSection";
import ManpowerSection from "../components/production/ManpowerSection";
import ProductionSection from "../components/production/ProductionSection";
import DowntimeSection from "../components/production/DowntimeSection";
import ConsumableSection from "../components/production/ConsumableSection";
import QualitySection from "../components/production/QualitySection";

import { useAuth } from "../context/AuthContext";

export default function ProductionEntryPage() {
  const { user } = useAuth();
  const [models, setModels] = useState([]);
  const [plants, setPlants] = useState([]);
  const [saving, setSaving] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

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
      setModels(Array.isArray(res.data) ? res.data : res.data.models || []);
    } catch (error) {
      console.log(error);
      setModels([]);
    }
  };

  const fetchPlants = async () => {
    try {
      const res = await api.get("/plants");
      setPlants(Array.isArray(res.data) ? res.data : res.data.plants || []);
    } catch (error) {
      console.log(error);
      setPlants([]);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchModels(), fetchPlants()]);
    setRefreshing(false);
    message.success("Data refreshed");
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
    const short =
      Number(formData.requiredManpower || 0) - Number(formData.availableManpower || 0);
    setFormData((prev) => ({
      ...prev,
      shortManpower: short,
    }));
  }, [formData.requiredManpower, formData.availableManpower]);

  // SAVE ENTRY
  const handleSubmit = async () => {
    setSaving(true);
    try {
      const res = await api.post("/production-entry", formData);
      message.success("Production entry saved");
      console.log(res.data);
    } catch (error) {
      console.log(error);
      message.error("Failed to save production entry");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <Card
        className="sticky top-0 z-40 !rounded-b-2xl !rounded-t-none"
        styles={{ body: { padding: "16px 24px" } }}
      >
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* LEFT */}
          <div>
            <h1 className="text-3xl font-bold text-slate-800 m-0">
              Production MIS Entry
            </h1>
            <p className="text-slate-500 text-sm mt-1 mb-0">
              Daily Production Monitoring System
            </p>
          </div>

          {/* RIGHT ACTIONS */}
          <Space wrap size={12}>
            <Tag
              icon={<Radio size={12} className="inline -mt-0.5 mr-0.5 animate-pulse" />}
              color="success"
              className="!flex !items-center !gap-1 !px-3 !py-1.5 !rounded-xl !font-medium !text-sm"
            >
              LIVE
            </Tag>

            <Button
              icon={<RefreshCw size={16} />}
              loading={refreshing}
              onClick={handleRefresh}
              className="!rounded-xl !font-medium"
            >
              Refresh
            </Button>

            <Button
              icon={<FileSpreadsheet size={16} />}
              className="!rounded-xl !font-medium"
              style={{ backgroundColor: "#059669", borderColor: "#059669", color: "#fff" }}
            >
              Excel Report
            </Button>

            <Button
              icon={<FileText size={16} />}
              danger
              type="primary"
              className="!rounded-xl !font-medium"
            >
              PDF Report
            </Button>
          </Space>
        </div>
      </Card>

      {/* SHIFT */}
      <ShiftSection formData={formData} handleChange={handleChange} />

      {/* MANPOWER */}
      <ManpowerSection formData={formData} handleChange={handleChange} />

      {/* PRODUCTION */}
      <ProductionSection
        formData={formData}
        setFormData={setFormData}
        models={models}
      />

      {/* DOWNTIME */}
      <DowntimeSection formData={formData} setFormData={setFormData} />

      {/* CONSUMABLE */}
      <ConsumableSection formData={formData} setFormData={setFormData} />

      {/* QUALITY */}
      <QualitySection
        formData={formData}
        setFormData={setFormData}
        models={models}
      />

      {/* SAVE */}
      <div className="flex justify-end pb-6">
        <Button
          type="primary"
          size="large"
          loading={saving}
          onClick={handleSubmit}
          className="!rounded-xl !font-semibold !px-8"
          style={{ backgroundColor: "#0e7490", borderColor: "#0e7490" }}
        >
          Save Production Entry
        </Button>
      </div>
    </div>
  );
}