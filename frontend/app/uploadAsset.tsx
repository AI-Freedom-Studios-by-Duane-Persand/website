
import React, { useState } from 'react';

export default function UploadAsset() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [url, setUrl] = useState('');
  const [creativeId, setCreativeId] = useState('');
  const [brandProfileId, setBrandProfileId] = useState('');
  const [creative, setCreative] = useState<any>(null);
  const [brandProfile, setBrandProfile] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] || null);
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    if (creativeId) formData.append('creativeId', creativeId);
    if (brandProfileId) formData.append('brandProfileId', brandProfileId);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${apiUrl}/api/assets/upload`, {
      method: 'POST',
      body: formData,
    });
    const data = await res.json();
    setUrl(data.url);
    setCreative(data.creative);
    setBrandProfile(data.brandProfile);
    setUploading(false);
  };

  return (
    <main className="min-h-screen bg-white text-gray-900 font-sans">
      {/* Header */}
      <nav className="w-full flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-white fixed top-0 left-0 z-50">
        <div className="flex items-center gap-2">
          <img src="/logo.svg" alt="AI Freedom Studios Logo" width={40} height={40} />
          <span className="font-bold text-xl tracking-tight">AI Freedom Studios</span>
        </div>
        <div className="flex gap-6 items-center">
          <a href="/" className="hover:text-blue-600 transition">Home</a>
          <a href="/app/dashboard" className="hover:text-blue-600 transition">Dashboard</a>
          <a href="/admin" className="hover:text-blue-600 transition">Admin</a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center pt-32 pb-10 px-4 text-center bg-gradient-to-b from-blue-50 to-white">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 leading-tight text-gray-900">Upload Your Brand Assets</h1>
        <p className="text-lg md:text-xl text-gray-700 mb-6 max-w-2xl">Easily upload images, videos, and branding files to power your campaigns. Supported formats: JPG, PNG, MP4, SVG, and more.</p>
      </section>

      {/* Upload Section */}
      <section className="flex flex-col items-center justify-center py-10 px-4">
        <div className="max-w-lg w-full bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-2xl font-bold mb-4">Asset Upload</h2>
          <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="mb-4 w-full" />
          <input type="text" value={creativeId} onChange={e => setCreativeId(e.target.value)} placeholder="Creative ID (optional)" className="mb-2 w-full px-3 py-2 border rounded" />
          <input type="text" value={brandProfileId} onChange={e => setBrandProfileId(e.target.value)} placeholder="BrandProfile ID (optional)" className="mb-4 w-full px-3 py-2 border rounded" />
          <button
            onClick={handleUpload}
            disabled={!file || uploading}
            className="px-6 py-2 bg-blue-600 text-white rounded font-semibold hover:bg-blue-700 transition w-full"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
          {uploading && <p className="mt-4 text-blue-600">Uploading...</p>}
          {url && <p className="mt-4 text-green-600">Uploaded! <a href={url} target="_blank" rel="noopener noreferrer" className="underline">View Asset</a></p>}
          {creative && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Updated Creative:</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(creative, null, 2)}</pre>
            </div>
          )}
          {brandProfile && (
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Updated BrandProfile:</h4>
              <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto">{JSON.stringify(brandProfile, null, 2)}</pre>
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full py-8 bg-gray-100 text-center text-gray-500 mt-20 border-t border-gray-200">
        &copy; {new Date().getFullYear()} AI Freedom Studios. All rights reserved.
      </footer>
    </main>
  );
}
