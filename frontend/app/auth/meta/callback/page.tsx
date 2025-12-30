"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "";

function getAuthHeaders(): Record<string, string> {
  const token =
    typeof window !== "undefined" &&
    (localStorage.getItem("token") || localStorage.getItem("auth_token"));
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function MetaOAuthCallback() {
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
        const redirectUri = `${window.location.origin}/auth/meta/callback`;

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

        // Store tokens and pages in user's account
        // TODO: Send to backend to store in database
        setMessage("Checking for Instagram Business accounts...");

        // Check each page for Instagram Business account
        const connectedAccounts: any[] = [];
        for (const page of pages) {
          try {
            const igRes = await fetch(
              `${API_BASE_URL}/api/meta/pages/${page.id}/instagram?accessToken=${page.access_token}`,
              {
                headers: getAuthHeaders(),
              }
            );

            if (igRes.ok) {
              const igAccount = await igRes.json();
              if (igAccount) {
                connectedAccounts.push({
                  type: "instagram",
                  pageId: page.id,
                  pageName: page.name,
                  instagramId: igAccount.id,
                  instagramUsername: igAccount.username,
                  accessToken: page.access_token,
                });
              }
            }
          } catch (err) {
            console.error(`Failed to get Instagram for page ${page.id}:`, err);
          }

          connectedAccounts.push({
            type: "facebook",
            pageId: page.id,
            pageName: page.name,
            accessToken: page.access_token,
          });
        }

        // Store connected accounts (in localStorage for now - should be in backend database)
        localStorage.setItem("meta_connected_accounts", JSON.stringify(connectedAccounts));
        localStorage.setItem("meta_user_token", longLivedData.access_token);

        // Clean up
        sessionStorage.removeItem("meta_oauth_state");

        setStatus("success");
        setMessage(`Successfully connected ${connectedAccounts.length} account(s)!`);

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
