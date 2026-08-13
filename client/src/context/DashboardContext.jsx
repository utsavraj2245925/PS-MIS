import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import axiosInstance from "../api/axiosInstance";
import { useAuth } from "./AuthContext";
import { DATE_PRESETS } from "../utils/dateRangePresets";

const DashboardContext = createContext(null);

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();

  const [filters, setFilters] = useState({ locationId: "", plantId: "", shiftId: "", conveyorId: "" });
  const [locations, setLocations] = useState([]);
  const [plants, setPlants] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [conveyors, setConveyors] = useState([]);
  const [cards, setCards] = useState({});
  const [loading, setLoading] = useState(true);
  const [navHeight, setNavHeight] = useState(60);

  const [productionTrend, setProductionTrend] = useState([]);
  const [achievementTrend, setAchievementTrend] = useState([]);
  const [productionRateTrend, setProductionRateTrend] = useState([]);
  const [oeeTrend, setOeeTrend] = useState([]);
  const [trendLoading, setTrendLoading] = useState(true);

  const [qualityTrend, setQualityTrend] = useState([]);
  const [qualityPerformanceTrend, setQualityPerformanceTrend] = useState([]);
  const [defectDistribution, setDefectDistribution] = useState([]);
  const [defectPareto, setDefectPareto] = useState([]);
  const [qualityLoading, setQualityLoading] = useState(true);

  const [topModels, setTopModels] = useState([]);
  const [topParts, setTopParts] = useState([]);
  const [modelProductionContribution, setModelProductionContribution] = useState({ total: 0, models: [] });
  const [partPerformanceDistribution, setPartPerformanceDistribution] = useState({ parts: [], totalPartCount: 0 });
  const [modelPartLoading, setModelPartLoading] = useState(true);
  const [selectedPartModel, setSelectedPartModel] = useState("");

  const [powderConsumption, setPowderConsumption] = useState({ materials: [], total: 0, unit: "" });
  const [usefulItems, setUsefulItems] = useState({ materials: [], total: 0, unit: "" });
  const [chemicalConsumption, setChemicalConsumption] = useState({ materials: [], total: 0, unit: "" });
  const [paintShopLoading, setPaintShopLoading] = useState(true);
  const [selectedPowderMaterial, setSelectedPowderMaterial] = useState("");
  const [selectedUsefulItemMaterial, setSelectedUsefulItemMaterial] = useState("");
  const [selectedChemicalMaterial, setSelectedChemicalMaterial] = useState("");

  const [downtimeTrend, setDowntimeTrend] = useState([]);
  const [downtimeTypeDistribution, setDowntimeTypeDistribution] = useState({ total: 0, types: [] });
  const [topDowntimeReasons, setTopDowntimeReasons] = useState([]);
  const [downtimePareto, setDowntimePareto] = useState([]);
  const [downtimeLoading, setDowntimeLoading] = useState(true);

  const [manpowerTrend, setManpowerTrend] = useState([]);
  const [manpowerDistribution, setManpowerDistribution] = useState({ required: 0, parts: [] });
  const [manpowerShortageByShift, setManpowerShortageByShift] = useState([]);
  const [manpowerLoading, setManpowerLoading] = useState(true);

  const [shiftProductionPerformance, setShiftProductionPerformance] = useState([]);
  const [shiftOEEPerformance, setShiftOEEPerformance] = useState([]);
  const [shiftQualityPerformance, setShiftQualityPerformance] = useState([]);
  const [shiftDowntimePerformance, setShiftDowntimePerformance] = useState([]);
  const [shiftLoading, setShiftLoading] = useState(true);

  const [datePreset, setDatePreset] = useState("today");
  const [dateRange, setDateRange] = useState(() => DATE_PRESETS.find((p) => p.key === "today").range());

  const onPresetChange = (key) => {
    setDatePreset(key);
    if (key === "custom") return;
    const preset = DATE_PRESETS.find((p) => p.key === key);
    if (preset?.range) setDateRange(preset.range());
  };

  const onCustomRangeChange = (dates) => {
    if (dates && dates[0] && dates[1]) setDateRange(dates);
  };

  useEffect(() => {
    if (!user) return;
    if (user.role === "manager") {
      setFilters((prev) => ({
        ...prev,
        locationId: String(user.locationId?._id || user.locationId || ""),
        plantId: String(user.plantId?._id || user.plantId || ""),
      }));
    }
    if (user.role === "plantAdmin") {
      setFilters((prev) => ({ ...prev, locationId: String(user.locationId?._id || user.locationId || "") }));
    }
  }, [user]);

  const fetchFilters = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/dashboard/filter-options");
      setLocations(res.data.data.locations || []);
      setPlants(res.data.data.plants || []);
      setShifts(res.data.data.shifts || []);
      setConveyors(res.data.data.conveyors || []);
    } catch (error) {
      console.error(error);
    }
  }, []);

  const fetchSummary = useCallback(async () => {
    try {
      const res = await axiosInstance.get("/dashboard/summary", {
        params: {
          locationId: filters.locationId,
          plantId: filters.plantId,
          shiftId: filters.shiftId,
          conveyorId: filters.conveyorId,
          fromDate: dateRange[0]?.startOf("day").toISOString(),
          toDate: dateRange[1]?.endOf("day").toISOString(),
        },
      });
      setCards(res.data.data.cards);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  const fetchTrends = useCallback(async () => {
    setTrendLoading(true);
    try {
      const params = {
        locationId: filters.locationId,
        plantId: filters.plantId,
        shiftId: filters.shiftId,
        conveyorId: filters.conveyorId,
        fromDate: dateRange[0]?.startOf("day").toISOString(),
        toDate: dateRange[1]?.endOf("day").toISOString(),
      };

      const [productionRes, achievementRes, rateRes, oeeRes] = await Promise.all([
        axiosInstance.get("/dashboard/production-trend", { params }),
        axiosInstance.get("/dashboard/achievement-trend", { params }),
        axiosInstance.get("/dashboard/production-rate-trend", { params }),
        axiosInstance.get("/dashboard/oee-trend", { params }),
      ]);

      setProductionTrend(productionRes.data.data || []);
      setAchievementTrend(achievementRes.data.data || []);
      setProductionRateTrend(rateRes.data.data || []);
      setOeeTrend(oeeRes.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setTrendLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  const fetchQualityAnalytics = useCallback(async () => {
    setQualityLoading(true);
    try {
      const params = {
        locationId: filters.locationId,
        plantId: filters.plantId,
        shiftId: filters.shiftId,
        conveyorId: filters.conveyorId,
        fromDate: dateRange[0]?.startOf("day").toISOString(),
        toDate: dateRange[1]?.endOf("day").toISOString(),
      };

      const [qualityRes, qualityPerfRes, distributionRes, paretoRes] = await Promise.all([
        axiosInstance.get("/dashboard/quality-trend", { params }),
        axiosInstance.get("/dashboard/quality-performance-trend", { params }),
        axiosInstance.get("/dashboard/defect-distribution", { params }),
        axiosInstance.get("/dashboard/defect-pareto", { params }),
      ]);

      setQualityTrend(qualityRes.data.data || []);
      setQualityPerformanceTrend(qualityPerfRes.data.data || []);
      setDefectDistribution(distributionRes.data.data || []);
      setDefectPareto(paretoRes.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setQualityLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  const fetchTopParts = useCallback(async (modelId) => {
    try {
      const params = {
        locationId: filters.locationId,
        plantId: filters.plantId,
        shiftId: filters.shiftId,
        conveyorId: filters.conveyorId,
        fromDate: dateRange[0]?.startOf("day").toISOString(),
        toDate: dateRange[1]?.endOf("day").toISOString(),
        modelId: modelId || undefined,
      };
      const res = await axiosInstance.get("/dashboard/top-parts", { params });
      setTopParts(res.data.data || []);
    } catch (error) {
      console.error(error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  const handlePartModelChange = (modelId) => {
    setSelectedPartModel(modelId);
    fetchTopParts(modelId);
  };

  const fetchModelPartAnalytics = useCallback(async () => {
    setModelPartLoading(true);
    try {
      const params = {
        locationId: filters.locationId,
        plantId: filters.plantId,
        shiftId: filters.shiftId,
        conveyorId: filters.conveyorId,
        fromDate: dateRange[0]?.startOf("day").toISOString(),
        toDate: dateRange[1]?.endOf("day").toISOString(),
      };

      const [modelsRes, contributionRes, distributionRes] = await Promise.all([
        axiosInstance.get("/dashboard/top-models", { params }),
        axiosInstance.get("/dashboard/model-production-contribution", { params }),
        axiosInstance.get("/dashboard/part-performance-distribution", { params }),
      ]);

      setTopModels(modelsRes.data.data || []);
      setModelProductionContribution(contributionRes.data.data || { total: 0, models: [] });
      setPartPerformanceDistribution(distributionRes.data.data || { parts: [], totalPartCount: 0 });

      await fetchTopParts(selectedPartModel);
    } catch (error) {
      console.error(error);
    } finally {
      setModelPartLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  const commonParams = () => ({
    locationId: filters.locationId,
    plantId: filters.plantId,
    shiftId: filters.shiftId,
    conveyorId: filters.conveyorId,
    fromDate: dateRange[0]?.startOf("day").toISOString(),
    toDate: dateRange[1]?.endOf("day").toISOString(),
  });

  const fetchPowderConsumption = useCallback(async (materialId) => {
    try {
      const res = await axiosInstance.get("/dashboard/powder-consumption", { params: { ...commonParams(), materialId: materialId || undefined } });
      setPowderConsumption(res.data.data || { materials: [], total: 0, unit: "" });
    } catch (error) { console.error(error); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  const fetchUsefulItems = useCallback(async (materialId) => {
    try {
      const res = await axiosInstance.get("/dashboard/useful-items", { params: { ...commonParams(), materialId: materialId || undefined } });
      setUsefulItems(res.data.data || { materials: [], total: 0, unit: "" });
    } catch (error) { console.error(error); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  const fetchChemicalConsumption = useCallback(async (materialId) => {
    try {
      const res = await axiosInstance.get("/dashboard/chemical-consumption", { params: { ...commonParams(), materialId: materialId || undefined } });
      setChemicalConsumption(res.data.data || { materials: [], total: 0, unit: "" });
    } catch (error) { console.error(error); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  const handlePowderMaterialChange = (materialId) => { setSelectedPowderMaterial(materialId); fetchPowderConsumption(materialId); };
  const handleUsefulItemMaterialChange = (materialId) => { setSelectedUsefulItemMaterial(materialId); fetchUsefulItems(materialId); };
  const handleChemicalMaterialChange = (materialId) => { setSelectedChemicalMaterial(materialId); fetchChemicalConsumption(materialId); };

  const fetchPaintShopAnalytics = useCallback(async () => {
    setPaintShopLoading(true);
    try {
      await Promise.all([
        fetchPowderConsumption(selectedPowderMaterial),
        fetchUsefulItems(selectedUsefulItemMaterial),
        fetchChemicalConsumption(selectedChemicalMaterial),
      ]);
    } finally {
      setPaintShopLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  const fetchDowntimeAnalytics = useCallback(async () => {
    setDowntimeLoading(true);
    try {
      const params = {
        locationId: filters.locationId,
        plantId: filters.plantId,
        shiftId: filters.shiftId,
        conveyorId: filters.conveyorId,
        fromDate: dateRange[0]?.startOf("day").toISOString(),
        toDate: dateRange[1]?.endOf("day").toISOString(),
      };

      const [trendRes, distributionRes, reasonsRes, paretoRes] = await Promise.all([
        axiosInstance.get("/dashboard/downtime-trend", { params }),
        axiosInstance.get("/dashboard/downtime-type-distribution", { params }),
        axiosInstance.get("/dashboard/top-downtime-reasons", { params }),
        axiosInstance.get("/dashboard/downtime-pareto", { params }),
      ]);

      setDowntimeTrend(trendRes.data.data || []);
      setDowntimeTypeDistribution(distributionRes.data.data || { total: 0, types: [] });
      setTopDowntimeReasons(reasonsRes.data.data || []);
      setDowntimePareto(paretoRes.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setDowntimeLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  const fetchManpowerAnalytics = useCallback(async () => {
    setManpowerLoading(true);
    try {
      const params = {
        locationId: filters.locationId,
        plantId: filters.plantId,
        shiftId: filters.shiftId,
        conveyorId: filters.conveyorId,
        fromDate: dateRange[0]?.startOf("day").toISOString(),
        toDate: dateRange[1]?.endOf("day").toISOString(),
      };

      const [trendRes, distributionRes, shortageRes] = await Promise.all([
        axiosInstance.get("/dashboard/manpower-trend", { params }),
        axiosInstance.get("/dashboard/manpower-distribution", { params }),
        axiosInstance.get("/dashboard/manpower-shortage-by-shift", { params }),
      ]);

      setManpowerTrend(trendRes.data.data || []);
      setManpowerDistribution(distributionRes.data.data || { required: 0, parts: [] });
      setManpowerShortageByShift(shortageRes.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setManpowerLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  const fetchShiftAnalytics = useCallback(async () => {
    setShiftLoading(true);
    try {
      const params = {
        locationId: filters.locationId,
        plantId: filters.plantId,
        shiftId: filters.shiftId,
        conveyorId: filters.conveyorId,
        fromDate: dateRange[0]?.startOf("day").toISOString(),
        toDate: dateRange[1]?.endOf("day").toISOString(),
      };

      const [prodRes, oeeRes, qualityRes, downtimeRes] = await Promise.all([
        axiosInstance.get("/dashboard/shift-production-performance", { params }),
        axiosInstance.get("/dashboard/shift-oee-performance", { params }),
        axiosInstance.get("/dashboard/shift-quality-performance", { params }),
        axiosInstance.get("/dashboard/shift-downtime-performance", { params }),
      ]);

      setShiftProductionPerformance(prodRes.data.data || []);
      setShiftOEEPerformance(oeeRes.data.data || []);
      setShiftQualityPerformance(qualityRes.data.data || []);
      setShiftDowntimePerformance(downtimeRes.data.data || []);
    } catch (error) {
      console.error(error);
    } finally {
      setShiftLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange]);

  useEffect(() => { if (user) fetchFilters(); }, [user, fetchFilters]);

  useEffect(() => {
    if (!user) return;
    fetchSummary();
    fetchTrends();
    fetchQualityAnalytics();
    fetchModelPartAnalytics();
    fetchPaintShopAnalytics();
    fetchDowntimeAnalytics();
    fetchManpowerAnalytics();
    fetchShiftAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange[0]?.valueOf(), dateRange[1]?.valueOf()]);

  return (
    <DashboardContext.Provider
      value={{
        filters, setFilters, locations, plants, shifts, conveyors,
        cards, loading, datePreset, dateRange,
        onPresetChange, onCustomRangeChange, onRefresh: fetchSummary,
        navHeight, setNavHeight,
        productionTrend, achievementTrend, productionRateTrend, oeeTrend, trendLoading,
        qualityTrend, qualityPerformanceTrend, defectDistribution, defectPareto, qualityLoading,
        topModels, topParts, modelProductionContribution, partPerformanceDistribution,
        modelPartLoading, selectedPartModel, handlePartModelChange,
        powderConsumption, usefulItems, chemicalConsumption, paintShopLoading,
        selectedPowderMaterial, selectedUsefulItemMaterial, selectedChemicalMaterial,
        handlePowderMaterialChange, handleUsefulItemMaterialChange, handleChemicalMaterialChange,
        downtimeTrend, downtimeTypeDistribution, topDowntimeReasons, downtimePareto, downtimeLoading,
        manpowerTrend, manpowerDistribution, manpowerShortageByShift, manpowerLoading,
        shiftProductionPerformance, shiftOEEPerformance, shiftQualityPerformance, shiftDowntimePerformance, shiftLoading,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);