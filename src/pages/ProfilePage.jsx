import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { currentUser, userProfile, updateProfile } = useAuth();
  const [username, setUsername] = useState(userProfile?.username ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const inputRef = useRef(null);

  const initials = (userProfile?.username?.[0] ?? '?').toUpperCase();
  const usernameUnchanged = username.toLowerCase().trim() === userProfile?.username;

  async function handleAvatarChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setError('');
    setSuccess('');
    try {
      // Always write to the same path — old avatar is automatically replaced
      const storageRef = ref(storage, `avatars/${currentUser.uid}/profile`);
      const task = uploadBytesResumable(storageRef, file);
      await new Promise((resolve, reject) => task.on('state_changed', null, reject, resolve));
      const photoURL = await getDownloadURL(storageRef);
      await updateProfile({ photoURL });
      setSuccess('Profile picture updated!');
    } catch (err) {
      setError(err.message ?? 'Failed to update photo.');
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected if needed
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function handleSaveUsername(e) {
    e.preventDefault();
    const clean = username.toLowerCase().trim();
    if (clean === userProfile?.username) return;
    if (clean.length < 3) return setError('Username must be at least 3 characters.');
    if (!/^[a-z0-9_]+$/.test(clean))
      return setError('Only letters, numbers, and underscores allowed.');
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await updateProfile({ username: clean });
      setSuccess('Username updated!');
    } catch (err) {
      setError(err.message ?? 'Failed to update username.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-16">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h2 className="text-lg font-semibold">Profile</h2>
        <p className="text-zinc-500 text-sm">{currentUser?.email}</p>
      </div>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-2 py-6">
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="relative w-24 h-24"
          aria-label="Change profile picture"
        >
          {userProfile?.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-zinc-700 flex items-center justify-center text-3xl font-bold">
              {initials}
            </div>
          )}
          {/* Edit badge */}
          <div className="absolute bottom-0 right-0 w-7 h-7 bg-white rounded-full flex items-center justify-center shadow">
            {uploading ? (
              <div className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="black" className="w-4 h-4">
                <path d="M2.695 14.763l-1.262 3.154a.5.5 0 0 0 .65.65l3.155-1.262a4 4 0 0 0 1.343-.885L17.5 5.5a2.121 2.121 0 0 0-3-3L3.58 13.42a4 4 0 0 0-.885 1.343Z" />
              </svg>
            )}
          </div>
        </button>
        <p className="text-zinc-500 text-xs">Tap to change photo</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          className="hidden"
        />
      </div>

      {/* Username */}
      <form onSubmit={handleSaveUsername} className="px-4 flex flex-col gap-3">
        <label className="text-sm text-zinc-400">Username</label>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500">@</span>
          <input
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
              setSuccess('');
            }}
            className="w-full bg-zinc-800 text-white placeholder-zinc-500 rounded-xl pl-8 pr-4 py-3 outline-none focus:ring-2 focus:ring-white/30"
            autoCapitalize="none"
            autoCorrect="off"
          />
        </div>
        <button
          type="submit"
          disabled={saving || usernameUnchanged}
          className="bg-white text-black font-semibold rounded-xl py-3 disabled:opacity-40"
        >
          {saving ? 'Saving…' : 'Save Username'}
        </button>
      </form>

      {error && (
        <div className="mx-4 mt-4 bg-red-900/40 border border-red-500 text-red-300 text-sm p-3 rounded-xl">
          {error}
        </div>
      )}
      {success && (
        <div className="mx-4 mt-4 bg-green-900/30 border border-green-500 text-green-300 text-sm p-3 rounded-xl text-center">
          {success}
        </div>
      )}
    </div>
  );
}
