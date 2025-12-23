"use client";
import React, { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { getBrandingConfig } from "../lib/branding";
import Link from "next/link";

type HeaderProps = {
  darkMode?: boolean;
};

export default function Header({ darkMode = false }: HeaderProps) {
  const pathname = usePathname();

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [branding, setBranding] = useState({ logoUrl: "" });

  useEffect(() => {
    function checkAuth() {
      let token: string | null = null;
      if (typeof document !== "undefined") {
        const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
        if (match) token = match[1];
      }
      if (!token && typeof window !== "undefined") {
        token = localStorage.getItem("token");
      }
      setIsLoggedIn(!!token);
    }

    checkAuth();

    function handleStorage(e: StorageEvent) {
      if (e.key === "token") checkAuth();
    }

    window.addEventListener("storage", handleStorage);
    const interval = setInterval(checkAuth, 2000);

    getBrandingConfig().then(setBranding);

    return () => {
      window.removeEventListener("storage", handleStorage);
      clearInterval(interval);
    };
  }, []);

  const isAppRoute = useMemo(() => {
    return pathname?.startsWith("/app") || pathname?.startsWith("/admin");
  }, [pathname]);

  const appNav = useMemo(
    () => [
      { href: "/app/dashboard", label: "Dashboard" },
      { href: "/app/campaigns", label: "Campaigns" },
      { href: "/app/creatives", label: "Creatives" },
      { href: "/app/calendar", label: "Calendar" },
      { href: "/app/analytics", label: "Analytics" },
    ],
    []
  );

  function signOut() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
    }
    if (typeof document !== "undefined") {
      document.cookie =
        "auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    window.location.href = "/";
  }

  const linkBase = darkMode
    ? "text-slate-200 hover:text-white"
    : "text-slate-600 hover:text-slate-900";

  const activePill = darkMode
    ? "bg-white/10 text-white border-white/10"
    : "bg-slate-900 text-white border-slate-900";

  return (
    <header
      className={`fixed top-0 left-0 w-full z-50 border-b ${
        darkMode
          ? "bg-slate-900/80 border-slate-800 backdrop-blur"
          : "bg-[#f9fafb]/80 border-gray-200 backdrop-blur"
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between gap-6 py-4">
        {/* BRANDING */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          {branding.logoUrl ? (
            <img
              src={branding.logoUrl}
              alt="AI Freedom Studios Logo"
              width={40}
              height={40}
              className="rounded-2xl shadow-sm"
            />
          ) : (
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-[#ef4444] via-[#f97316] to-[#2563eb] flex items-center justify-center text-white font-bold text-lg shadow-sm">
              AI
            </div>
          )}

          <div className="leading-snug">
            <div
              className={`font-semibold text-base sm:text-lg ${
                darkMode ? "text-white" : "text-slate-900"
              }`}
            >
              AI Freedom Studios
            </div>
            <div className={`text-xs ${darkMode ? "text-slate-300" : "text-slate-500"}`}>
              @aifreedomduane
            </div>
          </div>
        </Link>

        {/* NAV LINKS */}
        <nav className="hidden md:flex items-center gap-2">
          {/* If logged in and on /app or /admin, show app nav */}
          {isLoggedIn && isAppRoute ? (
            <div
              className={`flex items-center gap-2 rounded-full border px-2 py-1 ${
                darkMode
                  ? "border-slate-800 bg-slate-950/40"
                  : "border-gray-200 bg-white/70"
              }`}
            >
              {appNav.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-full text-sm font-medium border transition ${
                      isActive
                        ? activePill
                        : darkMode
                        ? "border-transparent text-slate-200 hover:bg-white/10 hover:text-white"
                        : "border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
          ) : (
            <div
              className={`flex items-center gap-2 rounded-full border px-2 py-1 ${
                darkMode
                  ? "border-slate-800 bg-slate-950/40"
                  : "border-gray-200 bg-white/70"
              }`}
            >
              {[
                { href: "/#features", label: "Features" },
                { href: "/#pricing", label: "Pricing" },
                { href: "/#how-it-works", label: "How It Works" },
                { href: "/#testimonials", label: "Testimonials" },
                { href: "/#faq", label: "FAQ" },
              ].map((item) => {
                const isActive =
                  typeof window !== "undefined" &&
                  window.location.hash === item.href.replace("/#", "#");
                return (
                  <a
                    key={item.href}
                    href={item.href}
                    className={`px-3 py-2 rounded-full text-sm font-medium border border-transparent transition ${linkBase} ${
                      isActive
                        ? darkMode
                          ? "bg-white/10 text-white"
                          : "bg-slate-100 text-slate-900"
                        : ""
                    }`}
                  >
                    {item.label}
                  </a>
                );
              })}
            </div>
          )}
        </nav>

        {/* RIGHT SIDE CTAS */}
        <div className="flex items-center gap-3">
          {isLoggedIn ? (
            <>
              {/* Mobile shortcut when logged-in */}
              <Link
                href={isAppRoute ? "/app/dashboard" : "/app/dashboard"}
                className={`md:hidden px-4 py-2 rounded-full text-sm font-semibold border ${
                  darkMode
                    ? "border-slate-700 text-white"
                    : "border-gray-300 text-slate-900"
                }`}
              >
                App
              </Link>

              <button
                onClick={signOut}
                className="
                  inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold
                  text-white bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
                  shadow-md hover:shadow-lg hover:opacity-95 transition
                "
              >
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className={`text-sm ${
                  darkMode ? "text-slate-200 hover:text-white" : "text-slate-700 hover:text-slate-900"
                } transition`}
              >
                Sign In
              </Link>

              <Link
                href="/signup"
                className="
                  inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold
                  text-white bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
                  shadow-md hover:shadow-lg hover:opacity-95 transition
                "
              >
                Get Started Today
              </Link>
            </>
          )}
        </div>
      </div>

      {/* MOBILE NAV: show app nav if logged in + on app/admin */}
      {isLoggedIn && isAppRoute && (
        <div
          className={`md:hidden border-t ${
            darkMode ? "border-slate-800" : "border-gray-200"
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex gap-2 overflow-x-auto">
            {appNav.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`whitespace-nowrap px-3 py-2 rounded-full text-sm font-semibold border transition ${
                    isActive
                      ? activePill
                      : darkMode
                      ? "border-slate-800 bg-slate-950/40 text-slate-200 hover:bg-white/10 hover:text-white"
                      : "border-gray-200 bg-white/70 text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
}
