import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/dashboard/DashboardPage";
import PlantMasterPage from "./pages/PlantMasterPage";
import ModelMasterPage from "./pages/ModelMasterPage";
import PartMasterPage from "./pages/PartMasterPage";
import UserMasterPage from "./pages/UserMasterPage";
import ManageDefectsPage from "./pages/ManageDefectsPage";
import ManageMaterialPage from "./pages/ManageMaterialPage";
import ManageDowntimePage from "./pages/ManageDowntimePage";
import ManageShiftPage from "./pages/ManageShiftPage";
import ManageConveyorPage from "./pages/ManageConveyorPage";


import ProductionEntryPage from "./pages/ProductionEntryPage";
import UserProductionPage from "./pages/UserProductionPage";
import ProductionRecordsPage from "./pages/ProductionRecordPage";
import ReportsPage from "./pages/ReportsPage";
import LiveAnalysisPage from "./pages/LiveAnalysisPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { useAuth } from "./context/AuthContext";



function App() {
  const { user, loading } = useAuth();

  // Don't render any routes until auth is resolved
  // Prevents flash-redirect to /login on page reload
  // if (loading) {
  //   return (
  //     <div className="h-screen flex items-center justify-center">
  //       Loading...
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
              {user?.role === "user" || user?.role === "USER"
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
            <ProtectedRoute allowedRoles={["SUPER_ADMIN","superAdmin"]}>
              <DashboardLayout><PlantMasterPage /></DashboardLayout>
            </ProtectedRoute>
          }
        />
        <Route
            path="/manage-conveyor"
            element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN","superAdmin"]}>
                    <DashboardLayout>
                        <ManageConveyorPage />
                    </DashboardLayout>
                </ProtectedRoute>
            }
        />

        {/* MODEL MASTER */}
        <Route
          path="/model-master"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN","superAdmin", "PLANT_ADMIN","plantAdmin"]}>
              <DashboardLayout><ModelMasterPage /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* PART MASTER */}
        <Route
          path="/part-master"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN","superAdmin", "PLANT_ADMIN", "plantAdmin"]}>
              <DashboardLayout><PartMasterPage /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* USER MASTER */}
        <Route
          path="/user-master"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN", "superAdmin", "MANAGER" , "manager"]}>
              <DashboardLayout><UserMasterPage /></DashboardLayout>
            </ProtectedRoute>
          }
        />
        {/* Manage Defects */}
        <Route
          path="/manage-defects"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN","superAdmin"]}>
              <DashboardLayout><ManageDefectsPage /></DashboardLayout>
            </ProtectedRoute>
          }
        />
         {/* Manage DownTime */}
        <Route
          path="/manage-downtime"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN","superAdmin"]}>
              <DashboardLayout><ManageDowntimePage /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        {/* Manage Consumption */}
        <Route
          path="/manage-material"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN","superAdmin"]}>
              <DashboardLayout><ManageMaterialPage /></DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
            path="/manage-shift"
            element={
                <ProtectedRoute allowedRoles={["SUPER_ADMIN","superAdmin"]}>
                    <DashboardLayout>
                        <ManageShiftPage/>
                    </DashboardLayout>
                </ProtectedRoute>
            }
        />

   
        {/* PRODUCTION RECORDS — only admins/managers land here; USER role is redirected */}
        <Route
          path="/production-records"
          element={
            <ProtectedRoute allowedRoles={["SUPER_ADMIN","superAdmin", "PLANT_ADMIN","plantAdmin", "MANAGER" , "manager","user","USER"]}>
              <ProductionRecordsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/live-analysis"
          element={
            <ProtectedRoute
              allowedRoles={[
                "SUPER_ADMIN",
                "superAdmin",
                "PLANT_ADMIN",
                "plantAdmin",
                "MANAGER",
                "manager",
              ]}
            >
              <DashboardLayout>
                <LiveAnalysisPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={[
              "SUPER_ADMIN",
              "superAdmin",
              "PLANT_ADMIN",
              "plantAdmin",
              "MANAGER",
              "manager",
            ]}>
              <DashboardLayout>
                <ReportsPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />
        

        {/* PRODUCTION ENTRY — all roles allowed, but USER gets a different UI */}
        <Route
          path="/production-entry"
          element={
            <ProtectedRoute>
              {user?.role === "USER" || user?.role === "user"
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
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardLayout>
                <DashboardPage />
              </DashboardLayout>
            </ProtectedRoute>
          }
        />

      </Routes>
    </Router>
  );
}

export default App;