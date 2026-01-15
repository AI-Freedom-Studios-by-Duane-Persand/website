"use client";
import { useState } from "react";
import { toast, Toaster } from "react-hot-toast";
import { getAuthHeaders } from "@/lib/utils/auth-headers";

export default function DataDeletionPage() {
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!email || !confirmDelete) {
      toast.error("Please fill in all required fields and confirm deletion");
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`${apiUrl}/api/data-deletion/request`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ email, reason }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.message || "Failed to submit deletion request");
      }

      toast.success("Data deletion request submitted successfully. We will process your request within 30 days.");
      setEmail("");
      setReason("");
      setConfirmDelete(false);
    } catch (err: any) {
      toast.error(err.message || "Error submitting deletion request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 mt-20">
      <Toaster position="top-right" />
      
      <div className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold text-white mb-4">Data Deletion Request</h1>
        <p className="text-gray-300 mb-8">
          Request deletion of your personal data in compliance with GDPR, CCPA, and Meta Platform policies.
        </p>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-semibold text-white mb-4">What will be deleted?</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Your account and profile information</li>
            <li>All creative content (text, images, videos) you've created</li>
            <li>Campaign data and strategies</li>
            <li>Connected social media account tokens (connections will be revoked)</li>
            <li>Usage analytics and activity logs</li>
            <li>Billing history (except as required by law)</li>
          </ul>

          <div className="mt-6 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <p className="text-amber-200 text-sm">
              <strong>Note:</strong> This action cannot be undone. Your data will be permanently deleted within 30 days. 
              Some data may be retained for legal compliance (e.g., tax records).
            </p>
          </div>
        </div>

        <div className="bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-6">Submit Deletion Request</h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email Address <span className="text-red-400">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-2 text-sm text-gray-400">
                Enter the email address associated with your account
              </p>
            </div>

            <div>
              <label htmlFor="reason" className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Deletion (Optional)
              </label>
              <textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Help us improve by telling us why you're leaving..."
                rows={4}
                className="w-full px-4 py-3 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="confirm"
                checked={confirmDelete}
                onChange={(e) => setConfirmDelete(e.target.checked)}
                required
                className="mt-1 w-5 h-5 bg-slate-800 border border-slate-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <label htmlFor="confirm" className="text-sm text-gray-300">
                <span className="text-red-400">*</span> I understand that this action is permanent and cannot be undone. 
                All my data will be deleted within 30 days.
              </label>
            </div>

            <button
              type="submit"
              disabled={submitting || !email || !confirmDelete}
              className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition"
            >
              {submitting ? "Submitting..." : "Submit Deletion Request"}
            </button>
          </form>
        </div>

        <div className="mt-8 bg-slate-900/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8">
          <h2 className="text-2xl font-semibold text-white mb-4">For Meta Platform Users</h2>
          <p className="text-gray-300 mb-4">
            If you connected your Facebook or Instagram account to AI Freedom Studios, submitting this request will:
          </p>
          <ul className="list-disc pl-6 space-y-2 text-gray-300">
            <li>Revoke all permissions we have to your Meta accounts</li>
            <li>Delete your Meta access tokens from our systems</li>
            <li>Remove any data we received from Meta platforms</li>
          </ul>
          <p className="mt-4 text-gray-400 text-sm">
            To fully disconnect, you should also remove AI Freedom Studios from your Facebook app settings: 
            Settings → Security and Login → Apps and Websites → Remove AI Freedom Studios
          </p>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-400 text-sm">
            Have questions? Contact us at{" "}
            <a href="mailto:privacy@aifreedomstudios.com" className="text-blue-400 hover:underline">
              privacy@aifreedomstudios.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
