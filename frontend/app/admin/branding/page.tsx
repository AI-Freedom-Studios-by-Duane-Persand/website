"use client";
import React, { useState, useRef } from "react";
import { adminApi } from "@/lib/api/admin.api";
import { parseApiError, getUserMessage } from "@/lib/error-handler";

export default function AdminBrandingPage() {
  const [logoPreview, setLogoPreview] = useState<string>("");
  const [faviconPreview, setFaviconPreview] = useState<string>("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [branding, setBranding] = useState<{ logoUrl: string; faviconUrl: string }>({
    logoUrl: "",
    faviconUrl: "",
  });

  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);
  React.useEffect(() => {
    const load = async () => {
      try {
        const data = await adminApi.getBrandingConfig();
        setBranding({
          logoUrl: data?.logoUrl || "",
          faviconUrl: data?.faviconUrl || "",
        });
      } catch {
        setBranding({ logoUrl: "", faviconUrl: "" });
      }
    };

    void load();
  }, []);

  function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setLogoFile(file);
    setSuccess("");
    setError("");
    setLogoPreview(file ? URL.createObjectURL(file) : "");
  }

  function handleFaviconChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] || null;
    setFaviconFile(file);
    setSuccess("");
    setError("");
    setFaviconPreview(file ? URL.createObjectURL(file) : "");
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!logoFile && !faviconFile) {
      setError("Please select a logo or favicon to upload.");
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      if (logoFile) formData.append("files", logoFile);
      if (faviconFile) formData.append("files", faviconFile);

      const result = await adminApi.uploadBranding(formData) as any;
      setSuccess("Branding updated successfully!");

      setLogoFile(null);
      setFaviconFile(null);
      setLogoPreview("");
      setFaviconPreview("");

      if (logoInputRef.current) logoInputRef.current.value = "";
      if (faviconInputRef.current) faviconInputRef.current.value = "";

      setBranding((b) => ({
        logoUrl: result.logoUrl || b.logoUrl,
        faviconUrl: result.faviconUrl || b.faviconUrl,
      }));
    } catch (err: any) {
      const parsed = parseApiError(err);
      setError(getUserMessage(parsed));
    } finally {
      setUploading(false);
    }
  }

  return (
    <main>
      {/* PAGE HEADER */}
      <header className="text-center mb-10 mt-20">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
          Branding Settings
        </h1>
        <p className="text-slate-400 mt-2">
          Upload and customize your platform’s logo & favicon
        </p>
      </header>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* ALERTS */}
        {error && (
          <div className="rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 px-4 py-3 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 px-4 py-3 text-sm">
            {success}
          </div>
        )}

        {/* CURRENT BRANDING */}
        <section className="rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl p-6 md:p-8">
          <h2 className="text-xl font-semibold text-white mb-4">
            Current Branding
          </h2>

          <div className="space-y-6">
            {/* Logo */}
            <div>
              <div className="text-slate-300 mb-2 font-medium">Logo</div>
              {branding.logoUrl ? (
                <img
                  src={branding.logoUrl}
                  alt="Logo"
                  className="max-h-16 rounded-lg bg-slate-800 p-2 shadow"
                />
              ) : (
                <div className="text-slate-500 text-sm">No logo uploaded</div>
              )}
            </div>

            {/* Favicon */}
            <div>
              <div className="text-slate-300 mb-2 font-medium">Favicon</div>
              {branding.faviconUrl ? (
                <img
                  src={branding.faviconUrl}
                  alt="Favicon"
                  className="max-h-10 rounded-lg bg-slate-800 p-2 shadow"
                />
              ) : (
                <div className="text-slate-500 text-sm">No favicon uploaded</div>
              )}
            </div>
          </div>
        </section>

        {/* UPLOAD FORM */}
        <form
          onSubmit={handleUpload}
          className="rounded-2xl border border-slate-800 bg-slate-900/50 shadow-xl p-6 md:p-8 space-y-8"
        >
          {/* Logo Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Upload Logo (SVG/PNG)
            </label>
            <input
              ref={logoInputRef}
              type="file"
              accept="image/svg+xml,image/png"
              onChange={handleLogoChange}
              className="
                w-full text-sm text-slate-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-gradient-to-r file:from-[#ef4444] file:via-[#f97316] file:to-[#2563eb]
                file:text-white
                hover:file:opacity-90
              "
            />
            {logoPreview && (
              <img
                src={logoPreview}
                className="max-h-16 mt-3 rounded-lg bg-slate-800 p-2 shadow"
              />
            )}
          </div>

          {/* Favicon Upload */}
          <div>
            <label className="block text-sm font-semibold text-slate-200 mb-2">
              Upload Favicon (32x32 PNG/SVG/ICO)
            </label>
            <input
              ref={faviconInputRef}
              type="file"
              accept="image/png,image/x-icon,image/svg+xml"
              onChange={handleFaviconChange}
              className="
                w-full text-sm text-slate-300
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-gradient-to-r file:from-[#ef4444] file:via-[#f97316] file:to-[#2563eb]
                file:text-white
                hover:file:opacity-90
              "
            />
            {faviconPreview && (
              <img
                src={faviconPreview}
                className="max-h-10 mt-3 rounded-lg bg-slate-800 p-2 shadow"
              />
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={uploading || (!logoFile && !faviconFile)}
            className="
              w-full py-3 rounded-xl text-white font-semibold text-sm
              bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb]
              shadow-lg hover:opacity-90 transition
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {uploading ? "Uploading…" : "Update Branding"}
          </button>
        </form>
      </div>
    </main>
  );
}
