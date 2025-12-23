"use client";
import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface ConnectedAccount {
  platform: string;
  status: string;
}

const SocialAccounts = () => {
  const [accounts, setAccounts] = useState<ConnectedAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchConnectedAccounts();
  }, []);

  const fetchConnectedAccounts = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/social-accounts');
      setAccounts(response.data);
    } catch (err) {
      setError('Failed to fetch connected accounts.');
    } finally {
      setLoading(false);
    }
  };

  const connectAccount = async (platform: string, credentials: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/social-accounts', { platform, credentials });
      fetchConnectedAccounts();
    } catch (err) {
      setError('Failed to connect account.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectAccount = async (platform: string) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/social-accounts/${platform}`);
      fetchConnectedAccounts();
    } catch (err) {
      setError('Failed to disconnect account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Social Accounts</h1>
      {loading && <p>Loading...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      <h2>Connected Accounts</h2>
      <ul>
        {accounts.map((account) => (
          <li key={account.platform}>
            {account.platform} - {account.status}
            <button onClick={() => disconnectAccount(account.platform)}>Disconnect</button>
          </li>
        ))}
      </ul>

      <h2>Connect a New Account</h2>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.target as HTMLFormElement;
          const platform = (form.elements.namedItem('platform') as HTMLInputElement).value;
          const credentials = (form.elements.namedItem('credentials') as HTMLInputElement).value;
          connectAccount(platform, credentials);
        }}
      >
        <label>
          Platform:
          <input name="platform" required />
        </label>
        <label>
          Credentials:
          <input name="credentials" required />
        </label>
        <button type="submit">Connect</button>
      </form>
    </div>
  );
};

export default SocialAccounts;