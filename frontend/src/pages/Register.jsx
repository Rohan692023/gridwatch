import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field) {
    return (e) => setForm((f) => ({ ...f, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm border border-line bg-panel p-8">
        <div className="mb-6">
          <div className="text-lg font-semibold">Create account</div>
          <div className="text-sm text-muted">
            New accounts start as Viewer. Ask an admin to grant Operator/Admin access.
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-xs text-muted">Name</label>
            <input
              required
              value={form.name}
              onChange={update("name")}
              className="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-cyan"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Email</label>
            <input
              type="email"
              required
              value={form.email}
              onChange={update("email")}
              className="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-cyan"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={update("password")}
              className="w-full border border-line bg-void px-3 py-2 text-sm outline-none focus:border-cyan"
            />
            <div className="mt-1 text-[11px] text-muted">At least 8 characters, including a number.</div>
          </div>

          {error && <div className="text-xs text-off">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full border border-cyan py-2 text-sm text-cyan hover:bg-cyan/10 transition-colors disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create account"}
          </button>
        </form>

        <div className="mt-4 text-center text-xs text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-cyan hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
