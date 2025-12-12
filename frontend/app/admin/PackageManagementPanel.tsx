
"use client";
import React, { useEffect, useState } from "react";

interface Package {
  _id: string;
  name: string;
  price: number;
  features: string[];
  active: boolean;
}

// Use absolute API base URL in browser, fallback to backend default for SSR/local
const API_BASE = typeof window !== "undefined" && process.env.NEXT_PUBLIC_API_BASE
  ? process.env.NEXT_PUBLIC_API_BASE
  : "http://localhost:3001/api";
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


const PackageManagementPanel: React.FC = () => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Package | null>(null);
  const [formState, setFormState] = useState({
    name: '',
    price: 0,
    features: '',
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
    if (pkg) {
      setFormState({
        name: pkg.name,
        price: pkg.price,
        features: pkg.features.join(", "),
        isActive: pkg.active,
      });
    } else {
      setFormState({ name: '', price: 0, features: '', isActive: true });
    }
    setError(null);
    setSuccess(null);
  };

  const handleOk = async () => {
    try {
      if (!formState.name || !formState.features) throw new Error('Name and features are required');
      const features = formState.features.split(",").map((f: string) => f.trim()).filter(Boolean);
      if (editing) {
        await updatePackage(editing._id, { ...formState, features });
        setSuccess('Package updated');
      } else {
        await createPackage({ ...formState, features });
        setSuccess('Package created');
      }
      setModalOpen(false);
      loadPackages();
    } catch (e: any) {
      setError(e.message);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deletePackage(id);
      setSuccess('Package deleted');
      loadPackages();
    } catch (e: any) {
      setError(e.message);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", color: '#000', justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h2>Manage Subscription Packages</h2>
        <button style={{ padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4 }} onClick={() => openModal()}>Create Package</button>
      </div>
      {error && <div style={{ color: 'red', marginBottom: 8 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginBottom: 8 }}>{success}</div>}
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          {packages.map((pkg) => (
            <div key={pkg._id} style={{ border: '1px solid #e5e7eb', borderRadius: 8, padding: 16, width: 320, color: "#000", background: '#fff', boxShadow: '0 1px 4px #0001' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0 }}>{pkg.name}</h3>
                <span style={{ color: pkg.active ? '#059669' : '#d97706', fontWeight: 600 }}>{pkg.active ? 'Active' : 'Inactive'}</span>
              </div>
              <p><b>Price:</b> ${pkg.price.toFixed(2)}</p>
              <p><b>Features:</b></p>
              <ul>
                {pkg.features.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 0' }} onClick={() => openModal(pkg)}>Edit</button>
                <button style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: 4, padding: '6px 0' }} onClick={() => handleDelete(pkg._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}
      {modalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, color: '#000',  width: '100vw', height: '100vh', background: '#0008', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 320, maxWidth: 400, boxShadow: '0 2px 12px #0002', position: 'relative' }}>
            <h3 style={{ marginTop: 0 }}>{editing ? 'Edit Package' : 'Create Package'}</h3>
            <form onSubmit={e => { e.preventDefault(); handleOk(); }}>
              <div style={{ marginBottom: 12 }}>
                <label>Name<br />
                  <input type="text" value={formState.name} onChange={e => setFormState(f => ({ ...f, name: e.target.value }))} style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }} required />
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Price (USD)<br />
                  <input type="number" value={formState.price} min={0} onChange={e => setFormState(f => ({ ...f, price: Number(e.target.value) }))} style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }} required />
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label>Features (comma separated)<br />
                  <input type="text" value={formState.features} onChange={e => setFormState(f => ({ ...f, features: e.target.value }))} style={{ width: '100%', padding: 6, borderRadius: 4, border: '1px solid #e5e7eb' }} required />
                </label>
              </div>
              <div style={{ marginBottom: 12 }}>
                <label><input type="checkbox" checked={formState.isActive} onChange={e => setFormState(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                <button type="submit" style={{ flex: 1, background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 0' }}>{editing ? 'Update' : 'Create'}</button>
                <button type="button" style={{ flex: 1, background: '#e5e7eb', color: '#222', border: 'none', borderRadius: 4, padding: '8px 0' }} onClick={() => setModalOpen(false)}>Cancel</button>
              </div>
            </form>
            {error && <div style={{ color: 'red', marginTop: 8 }}>{error}</div>}
            {success && <div style={{ color: 'green', marginTop: 8 }}>{success}</div>}
          </div>
        </div>
      )}
    </div>
  );
};

export default PackageManagementPanel;
