"use client";
import React, { useState } from "react";

export default function CreativesPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [assets, setAssets] = useState<Array<{_id: string, url: string, name: string, description: string}>>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setUploading(true);
    setError("");
    setUrl("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/api/storage/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = await res.json();
      setUrl(data.url);
      // Optionally: fetch updated asset list
      fetchAssets();
    } catch (err: any) {
      setError(err.message || "Upload error");
    } finally {
      setUploading(false);
    }
  }

  async function fetchAssets() {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/api/creatives`);
      if (!res.ok) throw new Error("Failed to fetch assets");
      setAssets(await res.json());
    } catch (err: any) {
      setError(err.message || "Error loading assets");
    }
  }

  function startEdit(asset: {_id: string, url: string, name: string, description: string}) {
    setEditingId(asset._id);
    setEditName(asset.name);
    setEditDescription(asset.description);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError("");
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
      const res = await fetch(`${apiUrl}/api/creatives/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, description: editDescription }),
      });
      if (!res.ok) throw new Error("Failed to update asset");
      setEditingId(null);
      setEditName("");
      setEditDescription("");
      fetchAssets();
    } catch (err: any) {
      setError(err.message || "Error updating asset");
    }
  }

  // Fetch assets on mount
  React.useEffect(() => { fetchAssets(); }, []);

  return (
    <main>
      <h2>Upload Creative Asset</h2>
      <form onSubmit={handleUpload}>
        <input
          type="file"
          accept="image/*,video/*"
          onChange={e => setFile(e.target.files?.[0] || null)}
          required
        />
        <button type="submit" disabled={uploading || !file}>
          {uploading ? "Uploading..." : "Upload"}
        </button>
      </form>
      {url && (
        <div>
          <p>Uploaded! Asset URL:</p>
          <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
        </div>
      )}
      <h3>Your Assets</h3>
      <ul>
        {assets.map(asset => (
          <li key={asset._id}>
            <a href={asset.url} target="_blank" rel="noopener noreferrer">{asset.name || asset.url}</a>
            {editingId === asset._id ? (
              <form onSubmit={handleEdit} style={{ display: "inline" }}>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                />
                <input
                  type="text"
                  value={editDescription}
                  onChange={e => setEditDescription(e.target.value)}
                  required
                />
                <button type="submit">Save</button>
                <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
              </form>
            ) : (
              <>
                {asset.description && <span> - {asset.description}</span>}
                <button onClick={() => startEdit(asset)}>Edit</button>
              </>
            )}
          </li>
        ))}
      </ul>
      {error && <p style={{ color: "red" }}>{error}</p>}

    </main>
  );
}
