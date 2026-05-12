import { useState } from 'react';
import {
  collection, query, where, getDocs,
  addDoc, serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function SearchView() {
  const { currentUser, userProfile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState(new Set());   // uids we've sent a request to
  const [error, setError] = useState('');

  async function handleSearch(e) {
    e.preventDefault();
    if (!searchTerm.trim()) return;
    setLoading(true);
    setError('');
    setResults([]);

    try {
      const q = query(
        collection(db, 'users'),
        where('username', '==', searchTerm.toLowerCase().trim())
      );
      const snap = await getDocs(q);
      // Filter out ourselves from results
      const found = snap.docs.map((d) => d.data()).filter((u) => u.uid !== currentUser.uid);
      setResults(found);
    } catch {
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function sendRequest(toUser) {
    // Check if a request already exists before creating a new one
    const existingQ = query(
      collection(db, 'friendRequests'),
      where('fromUid', '==', currentUser.uid),
      where('toUid', '==', toUser.uid)
    );
    const existing = await getDocs(existingQ);
    if (!existing.empty) {
      setSentTo((prev) => new Set([...prev, toUser.uid]));
      return;
    }

    await addDoc(collection(db, 'friendRequests'), {
      fromUid: currentUser.uid,
      fromUsername: userProfile.username,
      toUid: toUser.uid,
      toUsername: toUser.username,
      status: 'pending',
      createdAt: serverTimestamp(),
    });

    setSentTo((prev) => new Set([...prev, toUser.uid]));
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          placeholder="Search by username"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-3 outline-none"
          autoCapitalize="none"
          autoCorrect="off"
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-white text-black font-semibold rounded-xl px-4 disabled:opacity-50"
        >
          {loading ? '…' : 'Search'}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {results.length === 0 && searchTerm && !loading && (
        <p className="text-zinc-500 text-sm text-center py-4">No users found.</p>
      )}

      <ul className="flex flex-col gap-2">
        {results.map((user) => (
          <li key={user.uid}
            className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
            <span className="font-medium">@{user.username}</span>
            <button
              onClick={() => sendRequest(user)}
              disabled={sentTo.has(user.uid)}
              className="text-sm bg-white text-black font-semibold rounded-lg px-3 py-1 disabled:opacity-40"
            >
              {sentTo.has(user.uid) ? 'Sent ✓' : 'Add'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}