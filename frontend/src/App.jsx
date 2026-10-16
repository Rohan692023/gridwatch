import React from "react";
import { Routes, Route } from "react-router-dom";
import { SocketProvider } from "./context/SocketContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Zones from "./pages/Zones";
import AuditLog from "./pages/AuditLog";

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <SocketProvider>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/zones" element={<Zones />} />
                <Route path="/audit" element={<AuditLog />} />
              </Routes>
            </SocketProvider>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
