// context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";
import axiosInstance from "../api/axiosInstance";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMe = async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        console.log("fetch me status:", res.data);
        setUser(res.data.user);
      } catch (err) {
        console.log("ERR IN FETCHING ME:", err?.message);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = (
      userData
    ) => {
      setUser(userData);
    };

  const logout = async () => {
    try {
      await axiosInstance.post("/auth/logout");
    } catch {
      // fail silently
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);