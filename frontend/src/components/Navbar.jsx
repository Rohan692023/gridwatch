import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGridSocket } from "../context/SocketContext";

const linkClass = ({ isActive }) =>
  `px-3 py-2 text-sm border-b-2 transition-colors ${
    isActive ? "border-cyan text-primary" : "border-transparent text-muted hover:text-primary"
  }`;

export default function Navbar() {
  const { user, logout } = useAuth();
  const { connected } = useGridSocket();

  return (
    <header className="border-b border-line bg-panel">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-2">
            <span
              className={`h-2 w-2 ${connected ? "bg-on" : "bg-off"}`}
              aria-hidden="true"
            />
            <span className="font-semibold tracking-tight">GridWatch</span>
          </div>
          <nav className="flex gap-1">
            <NavLink to="/" end className={linkClass}>
              Dashboard
            </NavLink>
            <NavLink to="/zones" className={linkClass}>
              Zones
            </NavLink>
            <NavLink to="/audit" className={linkClass}>
              Audit Log
            </NavLink>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm">{user?.name}</div>
            <div className="data-mono text-xs uppercase text-muted">{user?.role}</div>
          </div>
          <button
            onClick={logout}
            className="border border-line px-3 py-1.5 text-sm text-muted hover:border-off hover:text-off transition-colors"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
