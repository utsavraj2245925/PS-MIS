import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import DashboardLayout from "./layouts/DashboardLayout";
import LoginPage from "./pages/LoginPage";

import DashboardPage from "./pages/DashboardPage";
import PlantMasterPage from "./pages/PlantMasterPage";
import ModelMasterPage from "./pages/ModelMasterPage";
import PartMasterPage from "./pages/PartMasterPage";
import UserMasterPage from "./pages/UserMasterPage";
import ProductionEntryPage from "./pages/ProductionEntryPage";

function App() {
  return (
    <Router>

      <Routes>
        <Route path="/login" element={<LoginPage />} />

        <Route
          path="/"
          element={
            <DashboardLayout>
              <DashboardPage />
            </DashboardLayout>
          }
        />

        <Route
          path="/plant-master"
          element={
            <DashboardLayout>
              <PlantMasterPage />
            </DashboardLayout>
          }
        />

        <Route
          path="/model-master"
          element={
            <DashboardLayout>
              <ModelMasterPage />
            </DashboardLayout>
          }
        />

        <Route
          path="/part-master"
          element={
            <DashboardLayout>
              <PartMasterPage />
            </DashboardLayout>
          }
        />

        <Route
          path="/user-master"
          element={
            <DashboardLayout>
              <UserMasterPage />
            </DashboardLayout>
          }
        />

        <Route
          path="/production-entry"
          element={
            <DashboardLayout>
              <ProductionEntryPage />
            </DashboardLayout>
          }
        />

      </Routes>

    </Router>
  );
}

export default App;