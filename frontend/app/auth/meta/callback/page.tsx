"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getAuthHeaders } from "@/lib/utils/auth-headers";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

function MetaOAuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"processing" | "success" | "error">("processing");
  const [message, setMessage] = useState("Processing OAuth callback...");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get parameters from URL
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // Check for OAuth errors
        if (error) {
          throw new Error(errorDescription || `OAuth error: ${error}`);
        }

        if (!code) {
          throw new Error("No authorization code received");
        }

        // Verify state (CSRF protection)
        const savedState = sessionStorage.getItem("meta_oauth_state");
        if (state !== savedState) {
          throw new Error("Invalid state parameter - possible CSRF attack");
        }

        setMessage("Exchanging authorization code for access token...");

        // Exchange code for access token
        const appId = process.env.NEXT_PUBLIC_META_APP_ID;
        const appSecret = process.env.NEXT_PUBLIC_META_APP_SECRET;
        const redirectUri = `${window.location.origin}/api/auth/meta/callback`;

        if (!appId || !appSecret) {
          throw new Error("Meta App credentials not configured");
        }

        const tokenRes = await fetch(`${API_BASE_URL}/api/meta/auth/token`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ appId, appSecret, redirectUri, code }),
        });

        if (!tokenRes.ok) {
          throw new Error(`Failed to exchange code for token (${tokenRes.status})`);
        }

        const tokenData = await tokenRes.json();
        const { access_token } = tokenData;

        setMessage("Getting long-lived access token...");

        // Exchange for long-lived token (60 days)
        const longLivedRes = await fetch(`${API_BASE_URL}/api/meta/auth/long-lived-token`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({ appId, appSecret, shortLivedToken: access_token }),
        });

        if (!longLivedRes.ok) {
          throw new Error(`Failed to get long-lived token (${longLivedRes.status})`);
        }

        const longLivedData = await longLivedRes.json();

        setMessage("Fetching your Facebook Pages...");

        // Get user's Pages
        const pagesRes = await fetch(
          `${API_BASE_URL}/api/meta/pages?accessToken=${longLivedData.access_token}`,
          {
            headers: getAuthHeaders(),
          }
        );

        if (!pagesRes.ok) {
          throw new Error(`Failed to fetch Pages (${pagesRes.status})`);
        }

        const pages = await pagesRes.json();

        setMessage("Saving connected accounts...");

        // Get user info from token (you should have userId and tenantId in your auth context)
        // For now, we'll get it from localStorage or auth context
        const userId = localStorage.getItem("userId") || localStorage.getItem("user_id");
        const tenantId = localStorage.getItem("tenantId") || localStorage.getItem("tenant_id");

        if (!userId || !tenantId) {
          throw new Error("User not authenticated");
        }

        // Save all accounts to database via backend
        const saveRes = await fetch(`${API_BASE_URL}/api/social-accounts-manager/connect`, {
          method: "POST",
          headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
          body: JSON.stringify({
            userId,
            tenantId,
            userAccessToken: longLivedData.access_token,
            scopes: ["pages_manage_posts", "pages_manage_engagement", "instagram_basic", "instagram_content_publish"],
          }),
        });

        if (!saveRes.ok) {
          throw new Error(`Failed to save accounts (${saveRes.status})`);
        }

        const saveData = await saveRes.json();
        
        setMessage("Successfully connected accounts!");

        // Clean up
        sessionStorage.removeItem("meta_oauth_state");

        setStatus("success");
        setMessage(`Successfully connected ${saveData.connectedAccounts} account(s)!`);

        // Redirect back to app after 2 seconds
        setTimeout(() => {
          router.push("/app/dashboard");
        }, 2000);
      } catch (err: any) {
        console.error("OAuth callback error:", err);
        setStatus("error");
        setMessage(err?.message || "Failed to complete OAuth flow");

        // Redirect back after 5 seconds
        setTimeout(() => {
          router.push("/app/dashboard");
        }, 5000);
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 text-center">
        {status === "processing" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">Connecting...</h1>
          </>
        )}

        {status === "success" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Success!</h1>
          </>
        )}

        {status === "error" && (
          <>
            <div className="w-16 h-16 mx-auto mb-4 bg-red-500 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
          </>
        )}

        <p className="text-slate-300">{message}</p>

        {status === "error" && (
          <button
            onClick={() => router.push("/app/dashboard")}
            className="mt-6 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition"
          >
            Return to Dashboard
          </button>
        )}
      </div>
    </div>
  );
}

export default function MetaOAuthCallback() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white/5 backdrop-blur border border-white/10 rounded-3xl p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-4 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <h1 className="text-2xl font-bold text-white mb-2">Loading...</h1>
            <p className="text-slate-300">Processing OAuth callback...</p>
          </div>
        </div>
      }
    >
      <MetaOAuthCallbackContent />
    </Suspense>
  );
}
