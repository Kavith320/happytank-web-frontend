"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiPost } from "../lib/api";
import { saveToken } from "../lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await apiPost("/api/auth/login", { email, password });

      // ✅ Save token only if backend returns it
      if (data?.token) saveToken(data.token);

      // ✅ Go home (devices page works even without token)
      router.replace("/home");
    } catch (err) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-sky-800 to-cyan-700 animate-gradient" />
      <div className="bubble bubble-1" />
      <div className="bubble bubble-2" />
      <div className="bubble bubble-3" />

      <form
        onSubmit={handleLogin}
        className="relative z-10 w-full max-w-md space-y-5 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-xl p-8 shadow-2xl"
      >
        <div className="text-center">
          <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
          <p className="text-sm text-white/70 mt-1">Aquarium Monitoring System</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/20 text-red-200 text-sm border border-red-400/30">
            {error}
          </div>
        )}

        <div>
          <label className="text-sm text-white/80">Email</label>
          <input
            className="w-full mt-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            type="email"
            placeholder="you@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="text-sm text-white/80">Password</label>
          <input
            className="w-full mt-1 rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-cyan-400"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          disabled={loading}
          className="w-full rounded-lg bg-cyan-500 hover:bg-cyan-400 text-black font-semibold py-2 transition disabled:opacity-60"
          type="submit"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </div>
  );
}
