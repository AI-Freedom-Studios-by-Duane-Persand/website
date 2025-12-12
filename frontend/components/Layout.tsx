import React from 'react';
import Link from 'next/link';
import Header from './Header';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0ea5e9]">
      <aside className="w-64 bg-gradient-to-b from-[#0ea5e9] via-[#1e293b] to-[#ef4444] shadow-lg flex flex-col p-6 text-white">
        <Header/>
        <nav className="flex-1 space-y-4">
          <Link href="/tenant/dashboard" className="block px-4 py-2 rounded hover:bg-[#0ea5e9]/30 text-white hover:text-[#f59e42] transition">Dashboard</Link>
          <Link href="/tenant/campaign" className="block px-4 py-2 rounded hover:bg-[#ef4444]/30 text-white hover:text-[#f59e42] transition">Campaigns</Link>
          <Link href="/tenant/assets" className="block px-4 py-2 rounded hover:bg-[#f59e42]/30 text-white hover:text-[#0ea5e9] transition">Assets</Link>
          <Link href="/tenant/billing" className="block px-4 py-2 rounded hover:bg-[#1e293b]/40 text-white hover:text-[#ef4444] transition">Billing</Link>
          <Link href="/admin" className="block px-4 py-2 rounded hover:bg-[#0ea5e9]/20 text-white hover:text-[#f59e42] transition">Admin</Link>
        </nav>
      </aside>
      <main className="flex-1 p-8 text-white">{children}</main>
    </div>
  );
}
