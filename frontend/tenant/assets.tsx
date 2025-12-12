import React, { useRef, useState } from 'react';
import Layout from '../components/Layout';

export default function Assets() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setFiles(Array.from(e.dataTransfer.files));
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError('');
      setSuccess('');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      setError('Please select files to upload.');
      return;
    }
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      // Replace with your actual upload API endpoint
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
      const formData = new FormData();
      files.forEach(file => formData.append('files', file));
      const res = await fetch(`${apiUrl}/api/assets/upload`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error('Upload failed');
      setSuccess('Files uploaded successfully!');
      setFiles([]);
    } catch {
      setError('Failed to upload files.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto w-full">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Upload Assets</h1>
        <div
          className="border-2 border-dashed border-blue-400 rounded p-8 flex flex-col items-center justify-center cursor-pointer bg-blue-50 hover:bg-blue-100 transition mb-4"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          tabIndex={0}
          aria-label="Drag and drop files here or click to select"
        >
          <span className="text-gray-600 mb-2">Drag and drop files here, or click to select</span>
          <input
            type="file"
            multiple
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
            aria-label="File input"
          />
        </div>
        {files.length > 0 && (
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Selected Files</h2>
            <ul className="list-disc pl-5">
              {files.map((file, idx) => (
                <li key={idx} className="text-gray-700">{file.name}</li>
              ))}
            </ul>
          </div>
        )}
        {error && <div className="text-red-500 mb-2">{error}</div>}
        {success && <div className="text-green-500 mb-2">{success}</div>}
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 transition w-full font-semibold focus:outline-none focus:ring-2 focus:ring-blue-400"
          onClick={handleUpload}
          disabled={uploading}
          aria-label="Upload Files"
        >
          {uploading ? 'Uploading...' : 'Upload Files'}
        </button>
      </div>
    </Layout>
  );
}
