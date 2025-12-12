// frontend/app/app/campaigns/page.tsx
"use client";
import { useEffect, useState } from "react";

interface Campaign {
  _id: string;
  name: string;
  objective: string;
  status: string;
}

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [objective, setObjective] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editObjective, setEditObjective] = useState("");

  async function fetchCampaigns() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/campaigns");
      if (!res.ok) throw new Error("Failed to fetch campaigns");
      setCampaigns(await res.json());
    } catch (err: any) {
      setError(err.message || "Error loading campaigns");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchCampaigns();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, objective }),
      });
      if (!res.ok) throw new Error("Failed to create campaign");
      setName("");
      setObjective("");
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message || "Error creating campaign");
    }
  }

  function startEdit(c: Campaign) {
    setEditingId(c._id);
    setEditName(c.name);
    setEditObjective(c.objective);
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editingId) return;
    setError("");
    try {
      const res = await fetch(`/api/campaigns/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, objective: editObjective }),
      });
      if (!res.ok) throw new Error("Failed to update campaign");
      setEditingId(null);
      setEditName("");
      setEditObjective("");
      fetchCampaigns();
    } catch (err: any) {
      setError(err.message || "Error updating campaign");
    }
  }

  return (
    <main>
      <h2>Campaigns</h2>
      <form onSubmit={handleCreate} style={{ marginBottom: 24 }}>
        <input
          type="text"
          placeholder="Campaign Name"
          value={name}
          onChange={e => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Objective"
          value={objective}
          onChange={e => setObjective(e.target.value)}
          required
        />
        <button type="submit">Create Campaign</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {campaigns.map(c => (
            <li key={c._id}>
              {editingId === c._id ? (
                <form onSubmit={handleEdit} style={{ display: "inline" }}>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    required
                  />
                  <input
                    type="text"
                    value={editObjective}
                    onChange={e => setEditObjective(e.target.value)}
                    required
                  />
                  <button type="submit">Save</button>
                  <button type="button" onClick={() => setEditingId(null)}>Cancel</button>
                </form>
              ) : (
                <>
                  <b>{c.name}</b> ({c.objective}) - {c.status} {" "}
                  <button onClick={() => startEdit(c)}>Edit</button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
