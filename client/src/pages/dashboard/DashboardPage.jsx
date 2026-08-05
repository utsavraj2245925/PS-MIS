import React, { useEffect, useState } from "react";
import DashboardFilters from "./components/DashboardFilters";
import { useAuth } from "../../context/AuthContext";
import axiosInstance from "../../api/axiosInstance";
import { Spin, Card } from "antd";
import ExecutiveKPICards from "./components/ExecutiveKPICards";

const DashboardPage = () => {
  const { user } = useAuth();

  console.log("CURRENT USER =", user);

    useEffect(() => {
      if (!user) return;

      if (user.role === "manager") {
        setFilters((prev) => ({
          ...prev,
          plantId: user.plantId?._id || user.plantId || "",
        }));
      }

      if (user.role === "plantAdmin") {
        setFilters((prev) => ({
          ...prev,
          locationId: user.locationId?._id || user.locationId || "",
          // plantAdmin has no plantId in DB — do NOT set plantId here
        }));
      }

      console.log("LOGGED USER =", user);
    }, [user]);

  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState({});
  const [filters, setFilters] = useState({ locationId: "", plantId: "", shiftId: "" });
  const [locations, setLocations] = useState([]);
  const [plants, setPlants] = useState([]);
  const [shifts, setShifts] = useState([]);

  const fetchSummary = async () => {
    try {
      const res = await axiosInstance.get("/dashboard/summary", {
        params: {
          locationId: filters.locationId,
          plantId: filters.plantId,
          shiftId: filters.shiftId,
        },
      });

      setCards(res.data.data.cards);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFilters = async () => {
    try {
      const res = await axiosInstance.get("/dashboard/filter-options");

      console.log("FILTER RESPONSE =", res.data);

      setLocations(res.data.data.locations || []);
      console.log("LOCATIONS STATE =", res.data.data.locations);

      setPlants(res.data.data.plants || []);
      console.log("PLANTS STATE =", res.data.data.plants);

      setShifts(res.data.data.shifts || []);
      console.log("SHIFTS STATE =", res.data.data.shifts);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [filters.locationId, filters.plantId, filters.shiftId]);

  if (loading) {
    return <Spin fullscreen />;
  }

  return (
    <div className="p-4">
      <Card style={{ marginBottom: 16 }}>
        <DashboardFilters
          user={user}
          filters={filters}
          setFilters={setFilters}
          locations={locations}
          plants={plants}
          shifts={shifts}
          onRefresh={fetchSummary}
        />
      </Card>

      <div
        style={{
          position: "sticky",
          top: 64,
          zIndex: 100,
          background: "#fff",
          paddingBottom: 12,
        }}
      >
        <ExecutiveKPICards cards={cards} />
      </div>
    </div>
  );
};

export default DashboardPage;