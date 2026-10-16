import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm border border-line bg-panel p-8">
        <div className="mb-6">
          <div className="text-lg font-semibold">GridWatch</div>
          <div className="text-sm text-muted">Microgrid dispatch console</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-cyan"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-cyan"
            />
          </div>

          {error && <div className="text-xs text-off">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-cyan py-2 text-sm text-cyan hover:bg-cyan/10 transition-colors disabled:opacity-50"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-muted">
          No account?{" "}
          <Link to="/register" className="text-cyan hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  );
}
