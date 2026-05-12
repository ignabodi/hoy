import { useState, useEffect } from 'react';
import {
  collection, query, where, onSnapshot, updateDoc, doc,
} from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function FriendRequests() {
  const { currentUser } = useAuth();
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, [currentUser.uid]);

  async function accept(requestId) {
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'accepted' });
  }

  async function decline(requestId) {
    await updateDoc(doc(db, 'friendRequests', requestId), { status: 'declined' });
  }

  if (requests.length === 0) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-zinc-500 text-sm">No pending requests</p>
      </div>
    );
  }

  return (
    <ul className="p-4 flex flex-col gap-2">
      {requests.map((r) => (
        <li key={r.id} className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
          <span className="font-medium">@{r.fromUsername}</span>
          <div className="flex gap-2">
            <button
              onClick={() => accept(r.id)}
              className="text-sm bg-white text-black font-semibold rounded-lg px-3 py-1"
            >
              Accept
            </button>
            <button
              onClick={() => decline(r.id)}
              className="text-sm bg-zinc-700 text-white rounded-lg px-3 py-1"
            >
              Decline
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
