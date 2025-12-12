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
    <div className="min-h-screen flex bg-slate-950 text-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col mt-16">
        <div className="px-6 pt-6 pb-4 border-b border-slate-800">
          <div className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
            AI Freedom Studios
          </div>
          <div className="mt-1 text-lg font-bold">@aifreedomduane</div>
          <div className="mt-1 text-[11px] text-slate-500">
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
                    block px-6 py-2.5 text-sm font-medium text-slate-200
                    hover:bg-slate-800 hover:text-white
                    transition-colors
                  "
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="px-6 pb-6 pt-2 text-[11px] text-slate-500">
          © {new Date().getFullYear()} AI Freedom Studios
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 min-h-screen bg-gradient-to-br from-[#020617] via-[#020617] to-slate-900 py-10">
        <div className="max-w-6xl mx-auto px-4">{children}</div>
      </main>
    </div>
  );
}
