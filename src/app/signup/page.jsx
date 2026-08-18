"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { apiPost } from "../lib/api";
import { saveToken, saveUser } from "../lib/auth";
import AquariumBackground from "../components/AquariumBackground";
import { Fish, User, Mail, Lock, Sparkles, ArrowRight, Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignup(e) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    setLoading(true);
    try {
      const data = await apiPost("/api/auth/register", {
        name,
        email,
        password,
      });

      if (data?.token) saveToken(data.token);
      if (data?.user) saveUser(data.user);

      router.push("/home");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* 🌊 Living Sea Background with Diverse Swimming Fish & Seabed */}
      <AquariumBackground showSeabed={true} density="dense" />

      {/* 🌟 Center Glass Card */}
      <div className="relative z-10 w-full max-w-md my-auto">
        {/* Glow backdrop */}
        <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-teal-500/30 via-cyan-500/20 to-blue-600/30 blur-2xl -z-10 opacity-70" />

        <div className="glass-panel p-8 sm:p-10 border border-white/20 bg-[#0a2644]/75 backdrop-blur-2xl rounded-3xl shadow-2xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-3xl bg-gradient-to-tr from-cyan-500 via-teal-400 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/40 mb-3 animate-pulse-glow">
              <Fish className="w-9 h-9 text-white drop-shadow" />
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Join the Community</span>
            </div>

            <h1 className="text-3xl font-extrabold text-white tracking-tight">
              Create Account
            </h1>
            <p className="text-sm text-cyan-100/70 mt-1">
              Start building your smart automated aquarium 🪸
            </p>
          </div>

          {/* Error notice */}
          {error && (
            <div className="mb-5 p-3.5 rounded-2xl bg-rose-500/20 text-rose-200 text-sm border border-rose-400/40 flex items-center gap-2.5 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-300/60 pointer-events-none" />
                <input
                  type="text"
                  className="aquatic-input pl-11"
                  placeholder="Kavith Udapola"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-300/60 pointer-events-none" />
                <input
                  type="email"
                  className="aquatic-input pl-11"
                  placeholder="aquarist@reef.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-300/60 pointer-events-none" />
                  <input
                    type="password"
                    className="aquatic-input pl-10 text-sm"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-1.5">
                  Confirm
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-cyan-300/60 pointer-events-none" />
                  <input
                    type="password"
                    className="aquatic-input pl-10 text-sm"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
            </div>

            <button
              disabled={loading}
              type="submit"
              className="w-full btn-aquatic py-3.5 text-base shadow-lg shadow-cyan-500/30 font-bold tracking-wide mt-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Creating Account...</span>
                </>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 pt-5 border-t border-white/10 text-center text-sm text-cyan-100/70">
            <span>Already have an account? </span>
            <Link
              href="/login"
              className="text-cyan-300 hover:text-white font-semibold underline underline-offset-4 transition"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
