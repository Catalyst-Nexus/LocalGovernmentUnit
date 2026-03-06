import { Routes, Route, Navigate } from "react-router";
import { useEffect } from "react";
import { useSettingsStore } from "@/store";
import { RBACProvider } from "@/contexts/RBACContext";
import Login from "@/pages/Login/Login";
import Register from "@/pages/Register/Register";
import PendingConfirmation from "@/pages/PendingConfirmation/PendingConfirmation";
import Dashboard from "@/pages/Dashboard/Dashboard";
import PrivateRoute from "@/components/PrivateRoute";

const AppRoutes = () => {
  const { darkMode, highContrast, reducedMotion, fontSize } =
    useSettingsStore();

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", darkMode);
    root.classList.toggle("high-contrast", highContrast);
    root.classList.toggle("reduced-motion", reducedMotion);
    root.classList.remove("font-small", "font-medium", "font-large");
    root.classList.add(`font-${fontSize}`);
  }, [darkMode, highContrast, reducedMotion, fontSize]);

  return (
    <RBACProvider>
      <div className="min-h-screen w-full bg-background text-foreground">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/pending-confirmation"
            element={<PendingConfirmation />}
          />
          <Route
            path="/dashboard/*"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </RBACProvider>
  );
};

export default AppRoutes;
