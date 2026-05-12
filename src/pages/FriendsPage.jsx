import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SearchView from '../components/friends/SearchView';
import FriendRequests from '../components/friends/FriendRequests';
import FriendsList from '../components/friends/FriendsList';

export default function FriendsPage() {
  const { userProfile, logOut } = useAuth();
  const [tab, setTab] = useState('friends');

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-16">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <h2 className="text-lg font-semibold">@{userProfile?.username}</h2>
        <button onClick={logOut} className="text-zinc-500 text-sm">
          Log out
        </button>
      </div>

      {/* Tab bar */}
      <div className="flex border-b border-zinc-800 px-4 gap-4">
        {['friends', 'requests', 'search'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 text-sm font-medium capitalize transition-colors border-b-2 ${
              tab === t
                ? 'border-white text-white'
                : 'border-transparent text-zinc-500'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'friends'  && <FriendsList />}
        {tab === 'requests' && <FriendRequests />}
        {tab === 'search'   && <SearchView />}
      </div>
    </div>
  );
}
