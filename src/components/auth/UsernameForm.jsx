import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  collection, query, where, getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase';

export default function UsernameForm() {
  const { saveUsername } = useAuth();
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const clean = username.toLowerCase().trim();
    if (clean.length < 3) return setError('Username must be at least 3 characters.');
    if (!/^[a-z0-9_]+$/.test(clean))
      return setError('Only letters, numbers, and underscores allowed.');

    setLoading(true);
    try {
      // Check if username is already taken
      const q = query(collection(db, 'users'), where('username', '==', clean));
      const snap = await getDocs(q);
      if (!snap.empty) return setError('That username is taken. Try another.');

      await saveUsername(clean);
      // App.jsx will redirect automatically once needsUsername becomes false
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-3xl font-bold text-center">hoy</h1>
      <p className="text-zinc-400 text-center text-sm">Choose a username</p>

      {error && (
        <div className="bg-red-900/40 border border-red-500 text-red-300 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="relative">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
        <input
          type="text"
          placeholder="yourname"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-white/30"
          autoCapitalize="none"
          autoCorrect="off"
          required
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-white text-black font-semibold rounded-xl py-3 disabled:opacity-50"
      >
        {loading ? 'Saving…' : 'Set Username'}
      </button>
    </form>
  );
}