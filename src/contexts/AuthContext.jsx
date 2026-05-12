// ─── Imports ──────────────────────────────────────────────────────────────────

// Pull four tools out of React:
//   createContext – creates a shared "box" of data any component can read
//   useContext    – lets a component read from that box
//   useState      – creates a variable that re-renders the screen when changed
//   useEffect     – runs code as a side effect (e.g. "do this on page load")
import { createContext, useContext, useState, useEffect } from 'react';

// Five Firebase Authentication functions:
//   sendSignInLinkToEmail  – sends the magic link email
//   isSignInWithEmailLink  – checks if the current URL is a magic link
//   signInWithEmailLink    – exchanges the magic link URL for a real signed-in session
//   signOut                – logs the user out
//   onAuthStateChanged     – fires a callback whenever login state changes
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
} from 'firebase/auth';

// Four Firestore (database) functions:
//   doc            – a reference to a specific document, e.g. users/abc123
//   setDoc         – writes (or overwrites) a document
//   getDoc         – reads a document once
//   serverTimestamp – a special value Firebase replaces with the real server time when saved
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, collection, query, where, getDocs, writeBatch } from 'firebase/firestore';

// Our own firebase.js exports these two already-initialized Firebase services
// so we don't re-initialize them in every file
import { auth, db } from '../firebase';

// Keep the user logged in across browser closes and app restarts (uses localStorage).
// This is the default, but we set it explicitly to be safe.
setPersistence(auth, browserLocalPersistence).catch(console.error);

// ─── Context ──────────────────────────────────────────────────────────────────

// Creates an empty "box" that will hold all auth data.
// Components anywhere in the app can reach into this box via useAuth().
// null is just the default value before the box is filled.
const AuthContext = createContext(null);

// ─── Magic Link Config ────────────────────────────────────────────────────────

// Settings passed to Firebase when sending the magic link email.
const actionCodeSettings = {
  // Where Firebase should redirect the user after they click the link.
  // window.location.origin is the current domain:
  //   - in dev:        http://localhost:5173
  //   - in production: https://your-app.web.app
  // Using it here means this config works in both environments without changing code.
  url: window.location.origin + '/',

  // Tell Firebase to let our app handle the link, not a native email client.
  handleCodeInApp: true,
};

// ─── AuthProvider ─────────────────────────────────────────────────────────────

// A React component that wraps the whole app.
// "children" is whatever is nested inside <AuthProvider>...</AuthProvider> — in our case the entire app.
// "export" means other files can import this function.
export function AuthProvider({ children }) {

  // currentUser holds the Firebase user object, or null if logged out.
  // setCurrentUser is the function used to update it.
  const [currentUser, setCurrentUser] = useState(null);

  // userProfile holds the Firestore document for this user (username, email, etc.)
  const [userProfile, setUserProfile] = useState(null);

  // loading is true while we're still figuring out if someone is logged in.
  // We don't show the app at all until this becomes false — prevents a flash of the login screen.
  const [loading, setLoading] = useState(true);

  // needsUsername is true when a user signed in for the first time and hasn't picked a username yet.
  // While true, App.jsx shows the username picker instead of the main app.
  const [needsUsername, setNeedsUsername] = useState(false);

  // ─── Step 1: Send magic link ───────────────────────────────────────────────

  // async/await means: wait for each line to finish before moving to the next.
  async function sendMagicLink(email) {
    // Ask Firebase to email the user a one-time sign-in link
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);

    // Save the email in the browser's localStorage.
    // We need it again after the user clicks the link and the page reloads —
    // Firebase requires you to provide the email a second time to complete sign-in.
    localStorage.setItem('hoy_email', email);
  }

  // ─── Step 2: Complete sign-in from the magic link ─────────────────────────

  async function completeMagicLinkSignIn() {
    // Check if the current URL contains magic link parameters (e.g. ?apiKey=...&oobCode=...).
    // If not, there's nothing to do — exit early.
    if (!isSignInWithEmailLink(auth, window.location.href)) return false;

    // Retrieve the email we saved before the user left to check their email
    let email = localStorage.getItem('hoy_email');

    if (!email) {
      // The user opened the link on a different device where localStorage is empty.
      // Fall back to asking them directly.
      email = window.prompt('Please enter your email to confirm sign in:');
    }

    // If they cancelled the prompt, bail out
    if (!email) return false;

    // Exchange the magic link URL + email for a real Firebase session.
    // Destructuring { user } pulls the user object out of the response.
    const { user } = await signInWithEmailLink(auth, email, window.location.href);

    // Clean up: remove the saved email — we don't need it anymore
    localStorage.removeItem('hoy_email');

    // Strip the ugly magic link params from the URL bar
    // so it shows "/" instead of "/?apiKey=...&oobCode=..."
    window.history.replaceState({}, document.title, window.location.pathname);

    return user;
  }

  // ─── Step 3: Load or initialize user profile ──────────────────────────────

  async function loadOrInitProfile(user) {
    // Look up this user's document in Firestore at users/<uid>
    // snap (snapshot) is a reference to that document
    const snap = await getDoc(doc(db, 'users', user.uid));

    if (snap.exists()) {
      // Returning user — load their profile data into state
      setUserProfile(snap.data());
      setNeedsUsername(false);
    } else {
      // New user — no Firestore document yet, so they need to pick a username
      setNeedsUsername(true);
    }
  }

  // ─── Step 4: Save chosen username ─────────────────────────────────────────

  async function saveUsername(username) {
    // Guard: if somehow called when not logged in, do nothing
    if (!currentUser) return;

    // Write a new document to Firestore at users/<uid>
    await setDoc(doc(db, 'users', currentUser.uid), {
      uid: currentUser.uid,
      username: username.toLowerCase().trim(), // normalize: no uppercase, no extra spaces
      email: currentUser.email,
      createdAt: serverTimestamp(),            // Firebase fills this in with the real server time
    });

    // Re-read the document we just wrote so our local state matches the database
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    setUserProfile(snap.data());

    // Username is now set — hide the username picker and show the main app
    setNeedsUsername(false);
  }

  // ─── Update profile (username and/or avatar) ───────────────────────────────

  async function updateProfile({ username: newUsername, photoURL: newPhotoURL } = {}) {
    if (!currentUser) return;

    // If changing username, verify it isn't already taken by someone else
    if (newUsername !== undefined && newUsername !== userProfile.username) {
      const q = query(collection(db, 'users'), where('username', '==', newUsername));
      const snap = await getDocs(q);
      if (!snap.empty) throw new Error('That username is taken. Try another.');
    }

    const updates = {};
    if (newUsername !== undefined) updates.username = newUsername;
    if (newPhotoURL !== undefined) updates.photoURL = newPhotoURL;
    if (Object.keys(updates).length === 0) return;

    // Update the user document
    await updateDoc(doc(db, 'users', currentUser.uid), updates);

    // If username changed, update all of the user's existing posts too
    if (newUsername !== undefined) {
      const postsSnap = await getDocs(
        query(collection(db, 'posts'), where('uid', '==', currentUser.uid))
      );
      if (!postsSnap.empty) {
        const batch = writeBatch(db);
        postsSnap.docs.forEach((d) => batch.update(d.ref, { username: newUsername }));
        await batch.commit();
      }
    }

    // Reflect changes in local state immediately
    setUserProfile((prev) => ({ ...prev, ...updates }));
  }

  // ─── Log out ──────────────────────────────────────────────────────────────

  function logOut() {
    // Signs the user out of Firebase. Returns a promise so callers can await it.
    return signOut(auth);
  }

  // ─── Side effects ─────────────────────────────────────────────────────────

  // The empty [] means "run this exactly once, when the page first loads."
  // Every time the app opens, check if the URL is a magic link and complete sign-in if so.
  useEffect(() => {
    completeMagicLinkSignIn().catch(console.error);
  }, []);

  // Set up a persistent listener for auth state changes.
  // This fires immediately on page load (telling us if someone is already logged in),
  // and again whenever they log in or out.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Wrap everything in try/finally so setLoading(false) ALWAYS runs.
      // Without this, if loadOrInitProfile throws (e.g. a Firestore error),
      // loading stays true forever and the screen stays blank.
      try {
        setCurrentUser(user); // user is a Firebase user object, or null if logged out

        if (user) {
          // Someone is logged in — load their profile from Firestore
          await loadOrInitProfile(user);
        } else {
          // No one is logged in — clear all user data
          setUserProfile(null);
          setNeedsUsername(false);
        }
      } catch (err) {
        console.error('Auth state error:', err);
      } finally {
        // We now know the auth state (or failed trying) — safe to show the app
        setLoading(false);
      }
    });

    // Return the unsubscribe function: when AuthProvider is removed from the screen,
    // stop listening to avoid memory leaks.
    return unsubscribe;
  }, []); // [] means set this listener up once, never re-run

  // ─── Pack everything into one object to share ─────────────────────────────

  // All the data and functions other components need.
  // Components access these by calling useAuth().
  const value = {
    currentUser,
    userProfile,
    needsUsername,
    sendMagicLink,
    completeMagicLinkSignIn,
    saveUsername,
    updateProfile,
    logOut,
  };

  // Show a plain black screen while Firebase resolves auth state.
  // This replaces the empty white flash that "!loading && children" alone would cause.
  if (loading) {
    return <div style={{ minHeight: '100vh', background: '#000' }} />;
  }

  return (
    // AuthContext.Provider puts the value object into the context "box"
    // so any component inside it can call useAuth() to read it
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── useAuth hook ─────────────────────────────────────────────────────────────

// A convenience function so components can write useAuth() instead of useContext(AuthContext).
// This is the standard React pattern for consuming a context.
export function useAuth() {
  return useContext(AuthContext);
}