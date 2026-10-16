import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [gridState, setGridState] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]); // recent ticks for the chart

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("gw_access_token");
    const socket = io(import.meta.env.VITE_SOCKET_URL || "http://localhost:5000", {
      auth: { token },
    });
    socketRef.current = socket;

    socket.on("connect", () => setConnected(true));
    socket.on("disconnect", () => setConnected(false));

    socket.on("grid:tick", (payload) => {
      setGridState(payload);
      setHistory((prev) => {
        const next = [
          ...prev,
          {
            time: new Date(payload.timestamp).toLocaleTimeString(),
            demand: payload.totalDemand,
            supply: payload.availableSupplyKw,
          },
        ];
        return next.slice(-30); // keep last 30 points
      });
    });

    socket.on("zone:update", ({ zone }) => {
      setGridState((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          zones: prev.zones.map((z) => (z.id === zone._id ? { ...z, ...zone, id: zone._id } : z)),
        };
      });
    });

    return () => socket.disconnect();
  }, [user]);

  return (
    <SocketContext.Provider value={{ gridState, connected, history }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useGridSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error("useGridSocket must be used within SocketProvider");
  return ctx;
}
