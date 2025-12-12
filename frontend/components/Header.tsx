"use client";
import React, { useEffect, useState } from "react";
import { getBrandingConfig } from "../lib/branding";
import Link from "next/link";

type HeaderProps = {
  darkMode?: boolean;
};

export default function Header({ darkMode = false }: HeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [branding, setBranding] = useState({ logoUrl: "" });

  useEffect(() => {
    function checkAuth() {
      let token = null;
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|; )auth_token=([^;]*)/);
        if (match) token = match[1];
      }
      if (!token && typeof window !== 'undefined') {
        token = localStorage.getItem('token');
      }
      setIsLoggedIn(!!token);
    }
    checkAuth();
    // Listen for storage events (cross-tab login/logout)
    function handleStorage(e: StorageEvent) {
      if (e.key === 'token') {
        checkAuth();
      }
    }
    window.addEventListener('storage', handleStorage);
    // Optionally, poll for cookie changes (for SSR login)
    const interval = setInterval(checkAuth, 2000);
    // Fetch branding config
    getBrandingConfig().then(setBranding);
    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

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
        <Link href="/" className="flex items-center gap-3">
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
            <div
              className={`text-xs ${
                darkMode ? "text-slate-300" : "text-slate-500"
              }`}
            >
              @aifreedomduane
            </div>
          </div>
        </Link>

        {/* NAV LINKS (center on desktop) */}
        <nav
          className={`hidden md:flex items-center gap-8 text-sm ${
            darkMode ? "text-slate-200" : "text-slate-600"
          }`}
        >
          <a href="#features" className="hover:text-slate-900 transition">
            Features
          </a>
          <a href="#pricing" className="hover:text-slate-900 transition">
            Pricing
          </a>
          <a href="#how-it-works" className="hover:text-slate-900 transition">
            How It Works
          </a>
          <a href="#testimonials" className="hover:text-slate-900 transition">
            Testimonials
          </a>
          <a href="#faq" className="hover:text-slate-900 transition">
            FAQ
          </a>
        </nav>

        {/* RIGHT SIDE CTAS */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <button
              onClick={() => {
                // Remove token from localStorage
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('token');
                }
                // Expire the auth_token cookie
                if (typeof document !== 'undefined') {
                  document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
                }
                // Reload the page to update UI
                window.location.reload();
              }}
              className="
                inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold
                text-white bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
                shadow-md hover:shadow-lg hover:opacity-95 transition
              "
            >
              Sign Out
            </button>
          ) : (
            <>
              <a
                href="/login"
                className={`text-sm ${
                  darkMode
                    ? "text-slate-200 hover:text-white"
                    : "text-slate-700 hover:text-slate-900"
                } transition`}
              >
                Sign In
              </a>
              <a
                href="/signup"
                className="
                  inline-flex items-center px-5 py-2.5 rounded-full text-sm font-semibold
                  text-white bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
                  shadow-md hover:shadow-lg hover:opacity-95 transition
                "
              >
                Get Started Today
              </a>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
