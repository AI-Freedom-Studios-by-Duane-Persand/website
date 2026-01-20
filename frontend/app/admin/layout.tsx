// frontend/app/admin/layout.tsx
import React from "react";
import Link from "next/link";

const adminLinks = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/tenants", label: "Tenants" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/branding", label: "Branding" },
  { href: "/admin/integrations", label: "Integrations" },
  { href: "/admin/subscriptions", label: "Subscriptions" },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex ">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-600/10 bg-gradient-to-r from-[#ef4444]/15 via-[#f97316]/12 to-[#2563eb]/15   flex flex-col mt-16">
        <div className="px-6 pt-6 pb-4 border-b border-slate-600/10 ">
          <div className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
            AI Freedom Studios
          </div>
          <div className="mt-1 text-lg font-bold">@aifreedomduane</div>
          <div className="mt-1 text-[11px] text-slate-600">
            Admin Control Center
          </div>
        </div>

        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {adminLinks.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="
                    block px-6 py-2.5 text-sm font-medium text-slate-600
                    bg-white/20 hover:bg-white/60 hover:bg-slate-800
                    transition-colors
                  "
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-6 pb-6 pt-2 text-[11px] text-slate-600">
          © {new Date().getFullYear()} AI Freedom Studios
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-h-screen bg-gradient-to-r from-[#ef4444]/15 via-[#f97316]/12 to-[#2563eb]/15  py-10">
        <div className="max-w-6xl mx-auto px-4">{children}</div>
      </main>
    </div>
  );
}
