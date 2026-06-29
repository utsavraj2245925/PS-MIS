import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import PlantMasterPage from "./pages/PlantMasterPage";
import ModelMasterPage from "./pages/ModelMasterPage";
import PartMasterPage from "./pages/PartMasterPage";
import UserMasterPage from "./pages/UserMasterPage";
import ProductionEntryPage from "./pages/ProductionEntryPage";
import UserProductionPage from "./pages/UserProductionPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, loading } = useAuth();

  // Don't render any routes until auth is resolved
  // Prevents flash-redirect to /login on page reload
  // if (loading) {
  //   return (
  //     <div className="h-screen flex items-center justify-center">
  //       Loading...gtvtg
  //     </div>
  //   );
  // }

  return (
    <Router>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/login"
          element={user ? <Navigate to="/" replace /> : <LoginPage />}
        />

        {/* DASHBOARD — only admins/managers land here; USER role is redirected */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              {user?.role === "USER"
                ? <Navigate to="/production-entry" replace />
                : <DashboardLayout><DashboardPage /></DashboardLayout>
              }
            </ProtectedRoute>
          }
        />

        {/* PLANT MASTER */}
        <Route
          path="/plant-master"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN"]}>
              <DashboardLayout><PlantMasterPage /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* MODEL MASTER */}
        <Route
          path="/model-master"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "PLANT_ADMIN"]}>
              <DashboardLayout><ModelMasterPage /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* PART MASTER */}
        <Route
          path="/part-master"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "PLANT_ADMIN"]}>
              <DashboardLayout><PartMasterPage /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* USER MASTER */}
        <Route
          path="/user-master"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "MANAGER"]}>
              <DashboardLayout><UserMasterPage /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* PRODUCTION ENTRY — all roles allowed, but USER gets a different UI */}
        <Route
          path="/production-entry"
          element={
            <ProtectedRoute>
              {user?.role === "USER"
                ? <UserProductionPage />
                : <DashboardLayout><ProductionEntryPage /></DashboardLayout>
              }
            </ProtectedRoute>
          }
        />

        {/* CATCH-ALL */}
        <Route
          path="*"
          element={<Navigate to={user ? "/" : "/login"} replace />}
        />

      </Routes>
    </Router>
  );
}

export default App;