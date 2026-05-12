import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function InboxPage() {
  const { currentUser } = useAuth();
  // null = still loading friends; [] = loaded but no friends
  const [friendUIDs, setFriendUIDs] = useState(null);
  const [latestPosts, setLatestPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // photo shown full-screen

  // Step 1: listen for accepted friends in real time (same logic as FriendsList)
  useEffect(() => {
    const q1 = query(
      collection(db, 'friendRequests'),
      where('fromUid', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );
    const q2 = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', currentUser.uid),
      where('status', '==', 'accepted')
    );
    let snap1Docs = [], snap2Docs = [];
    function merge(d1, d2) {
      setFriendUIDs([
        ...d1.map((d) => d.data().toUid),
        ...d2.map((d) => d.data().fromUid),
      ]);
    }
    const u1 = onSnapshot(q1, (s) => { snap1Docs = s.docs; merge(snap1Docs, snap2Docs); });
    const u2 = onSnapshot(q2, (s) => { snap2Docs = s.docs; merge(snap1Docs, snap2Docs); });
    return () => { u1(); u2(); };
  }, [currentUser.uid]);

  // Step 2: once we know our friends, listen for their latest posts
  useEffect(() => {
    if (friendUIDs === null) return; // still resolving friends, wait
    if (friendUIDs.length === 0) {
      setLatestPosts([]);
      setLoading(false);
      return;
    }

    // Query all posts from any friend, newest first
    // Firestore 'in' supports up to 30 values — enough for a personal app
    const q = query(
      collection(db, 'posts'),
      where('uid', 'in', friendUIDs),
      orderBy('timestamp', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      // Keep only the LATEST post per friend
      const seen = new Set();
      const latest = [];
      for (const post of all) {
        if (!seen.has(post.uid)) {
          seen.add(post.uid);
          latest.push(post);
        }
      }
      setLatestPosts(latest);
      setLoading(false);
    });
    return unsubscribe;
  }, [friendUIDs]);

  // Loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center pb-16">
        <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Full-screen photo viewer — tap anywhere to close
  if (selected) {
    return (
      <div
        className="fixed inset-0 bg-black z-50"
        onClick={() => setSelected(null)}
      >
        <img
          src={selected.imageURL}
          alt={`@${selected.username}`}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent">
          <p className="text-white font-semibold text-lg">@{selected.username}</p>
          <p className="text-zinc-400 text-sm">
            {selected.timestamp?.toDate().toLocaleString() ?? ''}
          </p>
          <p className="text-zinc-500 text-xs mt-2">Tap anywhere to close</p>
        </div>
      </div>
    );
  }

  // No friends yet
  if (friendUIDs?.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center pb-16 gap-2">
        <p className="text-zinc-500">No friends yet</p>
        <p className="text-zinc-600 text-xs">Add friends in the Friends tab to see their photos</p>
      </div>
    );
  }

  // Friends exist but none have posted
  if (latestPosts.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center pb-16 gap-2">
        <p className="text-zinc-500">Nothing here yet</p>
        <p className="text-zinc-600 text-xs">Your friends haven't posted anything yet</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-16">
      <div className="px-5 pt-12 pb-4">
        <h2 className="text-lg font-semibold">hoy</h2>
      </div>

      {/* 2-column grid: one cell per friend, showing their latest photo */}
      <div className="grid grid-cols-2 gap-3 px-4">
        {latestPosts.map((post) => (
          <div
            key={post.uid}
            onClick={() => setSelected(post)}
            className="cursor-pointer"
          >
            <img
              src={post.imageURL}
              alt={`@${post.username}`}
              className="w-full aspect-square object-cover rounded-2xl"
            />
            <p className="text-center text-sm text-zinc-300 mt-1.5">
              @{post.username}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
