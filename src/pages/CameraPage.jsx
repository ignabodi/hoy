import { useState, useRef } from 'react';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { storage, db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

export default function CameraPage() {
  const { currentUser, userProfile } = useAuth();
  const [preview, setPreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [posted, setPosted] = useState(false);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target.result);
    reader.readAsDataURL(file);
    setImageFile(file);
    setPosted(false);
    setError('');
  }

  function clearPhoto() {
    setPreview(null);
    setImageFile(null);
    if (inputRef.current) inputRef.current.value = '';
  }

  async function handlePost() {
    if (!imageFile) return;
    setUploading(true);
    setProgress(0);
    setError('');

    try {
      // 1. Upload image to Firebase Storage
      const storageRef = ref(
        storage,
        `posts/${currentUser.uid}/${Date.now()}_${imageFile.name}`
      );
      const uploadTask = uploadBytesResumable(storageRef, imageFile);

      await new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot) => {
            setProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
          },
          reject,
          resolve
        );
      });

      // 2. Get the public download URL
      const imageURL = await getDownloadURL(storageRef);

      // 3. Write to /posts — no recipient, all friends will see it
      await addDoc(collection(db, 'posts'), {
        uid: currentUser.uid,
        username: userProfile.username,
        imageURL,
        timestamp: serverTimestamp(),
      });

      setPosted(true);
      clearPhoto();
      setProgress(0);
    } catch (err) {
      setError('Failed to post. Please try again.');
      console.error(err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex flex-col pb-16">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <h2 className="text-lg font-semibold">Post a photo</h2>
        <p className="text-zinc-500 text-sm">@{userProfile?.username}</p>
      </div>

      {/* Photo picker / preview */}
      <div className="px-4 mb-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-2xl object-cover max-h-[60vh]"
            />
            <button
              onClick={clearPhoto}
              className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-2xl h-64 cursor-pointer text-zinc-500 gap-2">
            <span className="text-5xl">📷</span>
            <span className="text-sm">Tap to take or pick a photo</span>
            {/* capture="environment" opens the rear camera on mobile */}
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
        )}
      </div>

      {error && <p className="px-4 text-red-400 text-sm mb-2">{error}</p>}

      {/* Post button — shown once a photo is chosen */}
      {preview && (
        <div className="px-4">
          <button
            onClick={handlePost}
            disabled={uploading}
            className="w-full bg-white text-black font-semibold rounded-xl py-3 disabled:opacity-50"
          >
            {uploading ? `Uploading… ${progress}%` : 'Post'}
          </button>
        </div>
      )}

      {posted && (
        <div className="mx-4 mt-4 bg-green-900/30 border border-green-500 rounded-xl py-3 text-green-300 text-sm text-center">
          Posted! Your friends will see it in their feed 🎉
        </div>
      )}
    </div>
  );
}
