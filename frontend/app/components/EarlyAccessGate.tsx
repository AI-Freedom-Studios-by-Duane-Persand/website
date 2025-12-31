'use client';

import React, { useState } from 'react';

interface EarlyAccessGateProps {
  children: React.ReactNode;
  hasAccess: boolean;
}

export default function EarlyAccessGate({ children, hasAccess }: EarlyAccessGateProps) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    try {
      // TODO: Send to backend API to store early access requests
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
      await fetch(`${apiUrl}/api/early-access/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      }).catch(() => {
        // Silently fail for now if endpoint doesn't exist yet
      });
      
      setSubmitted(true);
    } catch (err) {
      console.error('Early access request failed:', err);
      setSubmitted(true); // Show success anyway
    }
  };

  if (hasAccess) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen  bg-gradient-to-b from-[#fff5eb] to-[#e0f2ff]  flex items-center justify-center px-4 py-16 mt-16">
      <div className="max-w-5xl w-full">
        <div className="bg-white backdrop-blur-xl rounded-2xl border border-white/10 p-8 md:p-12 shadow-2xl">
        
          {/* Heading */}
          <h1 className="text-3xl md:text-4xl font-bold text-center text-#252524 mb-4">
            Coming Soon
          </h1>
          
          <p className="text-lg text-#a29e89 text-center mb-8">
            We're launching soon! Get early access to our AI-powered social media automation platform.
          </p>

         
          {/* Email Form */}
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-medium #a29e89 mb-2">
                  Get notified when we launch
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 bg-white/20 border border border-white-200 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  required
                />
                {error && (
                  <p className="mt-2 text-sm text-red-400">{error}</p>
                )}
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#ef4444] via-[#f97316] to-[#2563eb] hover:opacity-95 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Request Early Access
              </button>
            </form>
          ) : (
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500/20 rounded-full mb-4">
                <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">You're on the list!</h3>
              <p className="text-gray-300">
                We'll notify you as soon as we launch. Check your email for updates.
              </p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/10 text-center">
            <p className="text-sm text-gray-400">
              Already have early access? Contact support at{' '}
              <a href="mailto:support@aifreedomstudios.com" className="text-blue-400 hover:text-blue-300 underline">
                support@aifreedomstudios.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
