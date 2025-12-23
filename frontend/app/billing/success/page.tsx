// frontend/app/billing/success/page.tsx
"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

export default function BillingSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617]" />}>
      <BillingSuccessContent />
    </Suspense>
  );
}

function BillingSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");

  return (
    <main className="min-h-screen bg-gradient-to-br from-[#0f172a] via-[#020617] to-[#020617] px-4 pt-24 pb-12 mt-20">
      <div className="max-w-3xl mx-auto">
        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur shadow-2xl">
          {/* subtle top glow */}
          <div className="absolute inset-x-0 -top-24 h-48 bg-gradient-to-r from-[#ef4444]/30 via-[#f97316]/20 to-[#2563eb]/30 blur-3xl" />

          <div className="relative p-8 sm:p-10 text-center">
            {/* badge */}
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-slate-200">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Payment confirmed
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              Payment Success
            </h1>
            <p className="mt-3 text-sm sm:text-base text-slate-300">
              Your payment was successful. Your account now has full access.
            </p>

            {sessionId && (
              <p className="mt-3 text-xs text-slate-400">
                Session ID: {sessionId}
              </p>
            )}

            {/* actions */}
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link
                href="/app/dashboard"
                className="
                  inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold
                  text-white bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
                  shadow-md hover:shadow-lg hover:opacity-95 transition
                "
              >
                Go to Dashboard
              </Link>

              <Link
                href="/"
                className="
                  inline-flex items-center justify-center px-6 py-3 rounded-full text-sm font-semibold
                  text-slate-200 border border-white/15 bg-white/5
                  hover:bg-white/10 transition
                "
              >
                Back to Homepage
              </Link>
            </div>

            {/* footer hint */}
            <div className="mt-6 text-xs text-slate-400">
              If you don’t see access immediately, refresh your dashboard.
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
