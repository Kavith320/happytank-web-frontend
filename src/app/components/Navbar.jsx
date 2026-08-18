"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { getUser, removeToken, removeUser } from "../lib/auth";
import { Waves, LogOut, Fish, Home, Activity, Sparkles } from "lucide-react";

export default function Navbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUserState] = useState(null);

  useEffect(() => {
    setUserState(getUser());
  }, []);

  function handleLogout() {
    removeToken();
    removeUser();
    router.push("/login");
  }

  // Do not show on login/signup/logout pages
  if (["/login", "/signup", "/logout"].includes(pathname)) {
    return null;
  }

  return (
    <header className="sticky top-4 z-50 px-4 sm:px-8 max-w-7xl mx-auto mb-6">
      <nav className="glass-panel px-5 py-3.5 flex items-center justify-between shadow-2xl border border-white/15 bg-[#0a2540]/60 backdrop-blur-xl">
        {/* Brand / Logo */}
        <Link href="/home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-transform">
            <Fish className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-heading font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                HappyTank
              </span>
            </div>
            <p className="text-[11px] text-cyan-200/60 font-medium hidden sm:block">
              Smart Aquatic Ecosystem
            </p>
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="hidden md:flex items-center gap-2">
          <Link
            href="/home"
            className={`px-4 py-2 rounded-xl text-sm font-medium transition flex items-center gap-2 ${
              pathname === "/home"
                ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-inner"
                : "text-slate-300 hover:text-white hover:bg-white/10"
            }`}
          >
            <Home className="w-4 h-4" />
            Aquariums
          </Link>
        </div>

        {/* User profile & Actions */}
        <div className="flex items-center gap-3">
          {user && (
            <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
              <div className="w-7 h-7 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 flex items-center justify-center text-xs font-bold text-slate-950">
                {user?.name ? user.name.slice(0, 2).toUpperCase() : "HT"}
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-white leading-tight">
                  {user?.name || "Aquarist"}
                </p>
                <p className="text-[10px] text-cyan-200/60 leading-tight truncate max-w-[120px]">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          )}

          <button
            onClick={handleLogout}
            title="Log out"
            className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 hover:border-red-500/40 transition flex items-center gap-2 text-xs font-medium cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </nav>
    </header>
  );
}
