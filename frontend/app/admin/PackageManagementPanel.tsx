
// "use client";
// import React, { useEffect, useState } from "react";

// interface Package {
//   _id: string;
//   name: string;
//   price: number;
//   features: string[];
//   active: boolean;
// }

// // Use absolute API base URL in browser, fallback to backend default for SSR/local
// const API_BASE = typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_BASE
//   ? process.env.NEXT_PUBLIC_API_BASE
//   : "/api";
// const fetchPackages = async (): Promise<Package[]> => {
//   const res = await fetch(`${API_BASE}/admin/packages`);
//   if (!res.ok) throw new Error("Failed to fetch packages");
//   return res.json();
// };

// const createPackage = async (data: Partial<Package>) => {
//   const res = await fetch(`${API_BASE}/admin/packages`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) throw new Error("Failed to create package");
//   return res.json();
// };

// const updatePackage = async (id: string, data: Partial<Package>) => {
//   const res = await fetch(`${API_BASE}/admin/packages/${id}`, {
//     method: "PUT",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(data),
//   });
//   if (!res.ok) throw new Error("Failed to update package");
//   return res.json();
// };


// const deletePackage = async (id: string) => {
//   const res = await fetch(`${API_BASE}/admin/packages/${id}`, {
//     method: "DELETE",
//   });
//   if (!res.ok) throw new Error("Failed to delete package");
//   return res.json();
// };


// const PackageManagementPanel: React.FC = () => {
//   const [packages, setPackages] = useState<Package[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [modalOpen, setModalOpen] = useState(false);
//   const [editing, setEditing] = useState<Package | null>(null);
//   const [formState, setFormState] = useState({
//     name: '',
//     price: 0,
//     features: '',
//     isActive: true,
//   });
//   const [error, setError] = useState<string | null>(null);
//   const [success, setSuccess] = useState<string | null>(null);

//   const loadPackages = async () => {
//     setLoading(true);
//     try {
//       const data = await fetchPackages();
//       setPackages(data);
//     } catch (e: any) {
//       setError(e.message);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     loadPackages();
//   }, []);

//   const openModal = (pkg?: Package) => {
//     setEditing(pkg || null);
//     setModalOpen(true);
//     if (pkg) {
//       setFormState({
//         name: pkg.name,
//         price: pkg.price,
//         features: pkg.features.join(", "),
//         isActive: pkg.active,
//       });
//     } else {
//       setFormState({ name: '', price: 0, features: '', isActive: true });
//     }
//     setError(null);
//     setSuccess(null);
//   };

//   const handleOk = async () => {
//     try {
//       if (!formState.name || !formState.features) throw new Error('Name and features are required');
//       const features = formState.features.split(",").map((f: string) => f.trim()).filter(Boolean);
//       if (editing) {
//         await updatePackage(editing._id, { ...formState, features });
//         setSuccess('Package updated');
//       } else {
//         await createPackage({ ...formState, features });
//         setSuccess('Package created');
//       }
//       setModalOpen(false);
//       loadPackages();
//     } catch (e: any) {
//       setError(e.message);
//     }
//   };

//   const handleDelete = async (id: string) => {
//     try {
//       await deletePackage(id);
//       setSuccess('Package deleted');
//       loadPackages();
//     } catch (e: any) {
//       setError(e.message);
//     }
//   };

//   return (
//     <div>
//       <div style={{ display: "flex", color: '#000', justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
//         <h2>Manage Subscription Packages</h2>
//         <button style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4 }} onClick={() => openModal()}>Create Package</button>
//       </div>
//       {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
//       {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
//       {loading ? (
//         <div>Loading...</div>
//       ) : (
//         <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
//           {packages.map((pkg) => (
//             <div key={pkg._id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, width: 320, color: "#000", background: '#fff', boxShadow: '0 1px 4px #0001' }}>
//               <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                 <h3 style={{ margin: 0 }}>{pkg.name}</h3>
//                 <span style={{ color: pkg.active ? '#059669' : '#d97706', fontWeight: 600 }}>{pkg.active ? 'Active' : 'Inactive'}</span>
//               </div>
//               <p><b>Price:</b> ${pkg.price.toFixed(2)}</p>
//               <p><b>Features:</b></p>
//               <ul>
//                 {pkg.features.map((f, i) => <li key={i}>{f}</li>)}
//               </ul>
//               <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
//                 <button style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 0' }} onClick={() => openModal(pkg)}>Edit</button>
//                 <button style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 0' }} onClick={() => handleDelete(pkg._id)}>Delete</button>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}
//       {modalOpen && (
//         <div style={{ position: 'fixed', top: 0, left: 0, color: '#000',  width: '100vw', height: '100vh', background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
//           <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 320, maxWidth: 400, boxShadow: '0 2px 12px #0002', position: 'relative' }}>
//             <h3 style={{ marginTop: 0 }}>{editing ? 'Edit Package' : 'Create Package'}</h3>
//             <form onSubmit={e => { e.preventDefault(); handleOk(); }}>
//               <div style={{ marginBottom: 12 }}>
//                 <label>Name<br />
//                   <input type="text" value={formState.name} onChange={e => setFormState(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }} required />
//                 </label>
//               </div>
//               <div style={{ marginBottom: 12 }}>
//                 <label>Price (USD)<br />
//                   <input type="number" value={formState.price} min={0} onChange={e => setFormState(f => ({ ...f, price: Number(e.target.value) }))} style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }} required />
//                 </label>
//               </div>
//               <div style={{ marginBottom: 12 }}>
//                 <label>Features (comma separated)<br />
//                   <input type="text" value={formState.features} onChange={e => setFormState(f => ({ ...f, features: e.target.value }))} style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }} required />
//                 </label>
//               </div>
//               <div style={{ marginBottom: 12 }}>
//                 <label><input type="checkbox" checked={formState.isActive} onChange={e => setFormState(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
//               </div>
//               <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
//                 <button type="submit" style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 0' }}>{editing ? 'Update' : 'Create'}</button>
//                 <button type="button" style={{ flex: 1, background: '#e5e7eb', color: '#222', border: 'none', borderRadius: 4, padding: '8px 0' }} onClick={() => setModalOpen(false)}>Cancel</button>
//               </div>
//             </form>
//             {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
//             {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default PackageManagementPanel;
"use client";
import React, { useEffect, useState } from "react";

interface Package {
  _id: string;
  name: string;
  price: number;
  features: string[];
  active: boolean;
}

/* ---------------- API ---------------- */

const API_BASE =
  typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_BASE
    ? process.env.NEXT_PUBLIC_API_BASE
    : "/api";

const fetchPackages = async (): Promise<Package[]> => {
  const res = await fetch(`${API_BASE}/admin/packages`);
  if (!res.ok) throw new Error("Failed to fetch packages");
  return res.json();
};

const createPackage = async (data: Partial<Package>) => {
  const res = await fetch(`${API_BASE}/admin/packages`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to create package");
  return res.json();
};

const updatePackage = async (id: string, data: Partial<Package>) => {
  const res = await fetch(`${API_BASE}/admin/packages/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to update package");
  return res.json();
};

const deletePackage = async (id: string) => {
  const res = await fetch(`${API_BASE}/admin/packages/${id}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete package");
  return res.json();
};

/* ---------------- COMPONENT ---------------- */

const PackageManagementPanel: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);

  const [formState, setFormState] = useState({
    name: "",
    price: 0,
    features: "",
    isActive: true,
  });

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const loadPackages = async () => {
    setLoading(true);
    try {
      const data = await fetchPackages();
      setPackages(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPackages();
  }, []);

  const openModal = (pkg?: Package) => {
    setEditing(pkg || null);
    setModalOpen(true);
    setError(null);
    setSuccess(null);

    if (pkg) {
      setFormState({
        name: pkg.name,
        price: pkg.price,
        features: pkg.features.join(", "),
        isActive: pkg.active,
      });
    } else {
      setFormState({ name: "", price: 0, features: "", isActive: true });
    }
  };

  const handleOk = async () => {
    try {
      if (!formState.name || !formState.features)
        throw new Error("Name and features are required");

      const features = formState.features
        .split(",")
        .map(f => f.trim())
        .filter(Boolean);

      if (editing) {
        await updatePackage(editing._id, { ...formState, features });
        setSuccess("Package updated");
      } else {
        await createPackage({ ...formState, features });
        setSuccess("Package created");
      }

      setModalOpen(false);
      loadPackages();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this package?")) return;
    try {
      await deletePackage(id);
      setSuccess("Package deleted");
      loadPackages();
    } catch (e: any) {
      setError(e.message);
    }
  };

  /* ---------------- UI ---------------- */

  return (
    <div className="max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-slate-600">
            Subscription Packages
          </h2>
          <p className="text-sm text-slate-500">
            Create and manage pricing plans
          </p>
        </div>
        <button
          onClick={() => openModal()}
          className="px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
        >
          Create Package
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-500/10 text-red-400 px-4 py-2">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg bg-emerald-500/10 text-emerald-400 px-4 py-2">
          {success}
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading packages…</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map(pkg => (
            <div
              key={pkg._id}
              className="
                rounded-xl
                bg-white/40
                border border-slate-600/10
                 p-5
                shadow-lg
                hover:bg-white/60
                transition
              "
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-slate-600">
                  {pkg.name}
                </h3>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium
                    ${pkg.active
                      ? "bg-emerald-500/10 text-emerald-400"
                      : "bg-yellow-500/10 text-yellow-400"
                    }`}
                >
                  {pkg.active ? "Active" : "Inactive"}
                </span>
              </div>

              <div className="text-slate-500 text-sm mb-3">
                <b className="text-slate-400">Price:</b> ${pkg.price.toFixed(2)}
              </div>

              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-1">Features</p>
                <ul className="text-sm text-slate-400 space-y-1 list-disc list-inside">
                  {pkg.features.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => openModal(pkg)}
                  className="flex-1 px-3 py-2 rounded-md bg-blue-600/90 hover:bg-blue-600 text-white text-sm transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(pkg._id)}
                  className="flex-1 px-3 py-2 rounded-md bg-red-600/90 hover:bg-red-600 text-white text-sm transition"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur flex items-center justify-center">
          <div className="w-full max-w-md rounded-xl bg-white/40 border border-slate-600/10 p-6 shadow-2xl">
            <h3 className="text-lg font-semibold text-slate-600 mb-4">
              {editing ? "Edit Package" : "Create Package"}
            </h3>

            <form
              onSubmit={e => {
                e.preventDefault();
                handleOk();
              }}
              className="space-y-4"
            >
              <input
                className="w-full px-3 py-2 rounded-md bg-white/80 border border-slate-600/10 text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Package Name"
                value={formState.name}
                onChange={e =>
                  setFormState(f => ({ ...f, name: e.target.value }))
                }
              />

              <input
                type="number"
                min={0}
                className="w-full px-3 py-2 rounded-md bg-white/80 border border-slate-600/10 text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Price (USD)"
                value={formState.price}
                onChange={e =>
                  setFormState(f => ({ ...f, price: Number(e.target.value) }))
                }
              />

              <input
                className="w-full px-3 py-2 rounded-md bg-white/80 border border-slate-600/10 text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Features (comma separated)"
                value={formState.features}
                onChange={e =>
                  setFormState(f => ({ ...f, features: e.target.value }))
                }
              />

              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={formState.isActive}
                  onChange={e =>
                    setFormState(f => ({
                      ...f,
                      isActive: e.target.checked,
                    }))
                  }
                />
                Active
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-md bg-blue-600 hover:bg-blue-500 text-white transition"
                >
                  {editing ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 px-4 py-2 rounded-md bg-slate-700 hover:bg-slate-600 text-slate-200 transition"
                >
                  Cancel
                </button>
              </div>
            </form>

            {error && (
              <div className="mt-3 text-sm text-red-400">{error}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManagementPanel;
