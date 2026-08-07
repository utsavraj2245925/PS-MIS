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

  useEffect(() => { if (user) fetchFilters(); }, [user, fetchFilters]);

  useEffect(() => {
    if (!user) return;
    fetchSummary();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters.locationId, filters.plantId, filters.shiftId, filters.conveyorId, dateRange[0]?.valueOf(), dateRange[1]?.valueOf()]);

  return (
    <DashboardContext.Provider
      value={{
        filters, setFilters, locations, plants, shifts, conveyors,
        cards, loading, datePreset, dateRange,
        onPresetChange, onCustomRangeChange, onRefresh: fetchSummary,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => useContext(DashboardContext);