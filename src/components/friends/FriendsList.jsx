import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';

export default function FriendsList() {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);

  useEffect(() => {
    // A "friendship" means a request where I'm either the sender OR recipient, and it's accepted.
    // We need two separate queries because Firestore can't query OR conditions across different fields.
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

    // We store the latest snapshot docs in variables so both listeners can combine their results
    let snap1Docs = [];
    let snap2Docs = [];

    function merge(docs1, docs2) {
      const result = [
        ...docs1.map((d) => ({ uid: d.data().toUid,   username: d.data().toUsername })),
        ...docs2.map((d) => ({ uid: d.data().fromUid, username: d.data().fromUsername })),
      ];
      setFriends(result);
    }

    const unsub1 = onSnapshot(q1, (snap) => {
      snap1Docs = snap.docs;
      merge(snap1Docs, snap2Docs);
    });
    const unsub2 = onSnapshot(q2, (snap) => {
      snap2Docs = snap.docs;
      merge(snap1Docs, snap2Docs);
    });

    return () => { unsub1(); unsub2(); };
  }, [currentUser.uid]);

  if (friends.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-2">
        <p className="text-zinc-500 text-sm">No friends yet</p>
        <p className="text-zinc-600 text-xs">Go to the Search tab to find people</p>
      </div>
    );
  }

  return (
    <ul className="p-4 flex flex-col gap-2">
      {friends.map((f) => (
        <li key={f.uid} className="flex items-center bg-zinc-900 rounded-xl px-4 py-3">
          {/* Avatar: first letter of username */}
          <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center text-sm font-bold mr-3">
            {f.username[0].toUpperCase()}
          </div>
          <span className="font-medium">@{f.username}</span>
        </li>
      ))}
    </ul>
  );
}