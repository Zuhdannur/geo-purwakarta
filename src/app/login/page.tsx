'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth');
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token && parsed?.expires && Date.now() < parsed.expires) {
          router.replace('/');
        }
      }
    } catch {}
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.error || 'Login failed');
      }
      const j = await res.json();
      const oneDay = 24 * 60 * 60 * 1000;
      const payload = { token: j?.token || 'ok', expires: Date.now() + oneDay };
      localStorage.setItem('auth', JSON.stringify(payload));
      router.replace('/');
    } catch (e: any) {
      setError(e?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-xl border border-gray-200 p-6">
        <div className="w-full flex justify-center">
          <Image src="/globe.svg" alt="Geo Logo" width={56} height={56} />
        </div>
        <h1 className="mt-4 text-center text-xl font-semibold text-gray-800">Sign in</h1>
        <p className="text-center text-gray-500 text-sm">Purwakarta Geospatial Dashboard</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="admin"
              autoComplete="username"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="password"
              autoComplete="current-password"
              required
            />
          </div>
          {error && <div className="text-sm text-red-600">{error}</div>}
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-2 rounded-md text-white ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? 'Signing in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
}


