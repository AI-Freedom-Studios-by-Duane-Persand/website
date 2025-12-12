// frontend/app/app/calendar/page.tsx
"use client";
import React, { useEffect, useState } from "react";

interface ScheduledPost {
  _id: string;
  content: string;
  assetUrl?: string;
  scheduledAt: string;
}

export default function CalendarPage() {
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [content, setContent] = useState("");
  const [assetUrl, setAssetUrl] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchPosts() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/scheduling");
      if (!res.ok) throw new Error("Failed to fetch scheduled posts");
      setPosts(await res.json());
    } catch (err: any) {
      setError(err.message || "Error loading posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPosts();
  }, []);

  async function handleSchedule(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("/api/scheduling", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, assetUrl, scheduledAt }),
      });
      if (!res.ok) throw new Error("Failed to schedule post");
      setContent("");
      setAssetUrl("");
      setScheduledAt("");
      fetchPosts();
    } catch (err: any) {
      setError(err.message || "Error scheduling post");
    }
  }

  return (
    <main>
      <h2>Calendar</h2>
      <form onSubmit={handleSchedule} style={{ marginBottom: 24 }}>
        <textarea
          placeholder="Post content"
          value={content}
          onChange={e => setContent(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="Asset URL (optional)"
          value={assetUrl}
          onChange={e => setAssetUrl(e.target.value)}
        />
        <input
          type="datetime-local"
          value={scheduledAt}
          onChange={e => setScheduledAt(e.target.value)}
          required
        />
        <button type="submit">Schedule Post</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <ul>
          {posts.map(post => (
            <li key={post._id}>
              <b>{new Date(post.scheduledAt).toLocaleString()}</b>: {post.content}
              {post.assetUrl && (
                <span> [<a href={post.assetUrl} target="_blank" rel="noopener noreferrer">Asset</a>]</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
