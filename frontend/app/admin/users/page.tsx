"use client";
import React, { useEffect, useState } from "react";

// Dummy roles for selection
const ALL_ROLES = ["superadmin", "admin", "tenantOwner", "manager", "editor"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      setError("");
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
        const res = await fetch(`${apiUrl}/api/admin/users`, {
          credentials: "include",
        });
        const data = await res.json();
        if (res.ok) setUsers(data);
        else setError(data.message || "Failed to load users");
      } catch (err) {
        setError("Network error");
      }
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, newRoles: string[]) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/api/admin/users/${userId}/roles`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roles: newRoles }),
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Failed to update roles");
      } else {
        setUsers((users) =>
          users.map((u) =>
            u._id === userId ? { ...u, roles: newRoles } : u
          )
        );
      }
    } catch (err) {
      setError("Network error");
    }
  };

  if (loading) {
    return (
      <main className="pt-8 px-4">
        <div className="max-w-6xl mx-auto text-sm text-slate-300">
          Loading users…
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="pt-8 px-4">
        <div className="max-w-6xl mx-auto rounded-lg border border-red-400/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      </main>
    );
  }

  return (
    <main className="pt-20 md:pt-20 px-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col gap-1">
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-50">
            User Management
          </h1>
          <p className="text-sm md:text-[15px] text-slate-400">
            View all users across tenants and manage their roles and permissions.
          </p>
        </header>

        {/* Table card */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/80 shadow-[0_18px_45px_rgba(15,23,42,0.35)]">
          <div className="px-4 pt-4 md:px-6 md:pt-6 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                Users ({users.length})
              </h2>
              <p className="text-xs text-slate-500">
                Toggle roles to grant or revoke access. Changes are saved
                instantly.
              </p>
            </div>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-slate-950/60 border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Roles
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {users.map((user: any, idx: number) => (
                  <tr
                    key={user._id}
                    className={
                      idx % 2 === 0
                        ? "border-t border-slate-800/80 bg-slate-900/60"
                        : "border-t border-slate-800/80 bg-slate-900/40"
                    }
                  >
                    <td className="px-4 py-3 align-top text-slate-100 text-xs md:text-sm break-all">
                      {user.email}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <RoleEditor
                        userRoles={user.roles}
                        allRoles={ALL_ROLES}
                        onChange={(roles: string[]) =>
                          handleRoleChange(user._id, roles)
                        }
                      />
                    </td>
                    <td className="px-4 py-3 align-top text-xs text-slate-500">
                      {/* Reserved for future actions (impersonate, reset, etc.) */}
                      —
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}

function RoleEditor({
  userRoles,
  allRoles,
  onChange,
}: {
  userRoles: string[];
  allRoles: string[];
  onChange: (roles: string[]) => void;
}) {
  const [selected, setSelected] = useState<string[]>(userRoles || []);

  useEffect(() => {
    setSelected(userRoles || []);
  }, [userRoles]);

  return (
    <div className="flex flex-wrap gap-2">
      {allRoles.map((role) => {
        const isChecked = selected.includes(role);
        return (
          <label
            key={role}
            className={`
              inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium
              ${
                isChecked
                  ? "border-[#f97316]/80 bg-[#f97316]/10 text-[#fed7aa]"
                  : "border-slate-700 bg-slate-950/40 text-slate-300"
              }
              cursor-pointer transition
            `}
          >
            <input
              type="checkbox"
              className="h-3.5 w-3.5 rounded border-slate-600 bg-slate-900 text-[#f97316] focus:ring-0"
              checked={isChecked}
              onChange={(e) => {
                const updated = e.target.checked
                  ? [...selected, role]
                  : selected.filter((r) => r !== role);
                setSelected(updated);
                onChange(updated);
              }}
            />
            <span className="capitalize">{role}</span>
          </label>
        );
      })}
    </div>
  );
}
