# hoy — Build a Mobile Web App Like Locket Widget

### A Complete Step-by-Step Tutorial for Beginner-Intermediate Developers

---

## What We're Building

**hoy** is a mobile-optimized web app where you can:

- Create an account and add friends
- Take or choose a photo and post it for all your friends to see
- Open the app and instantly see a grid of your friends' latest photos with their names
- Install it to your phone's home screen so it feels like a native app

> **Note on "widgets":** True Lock Screen or Home Screen widgets that refresh automatically
> in the background require native iOS/Android code. On the web, the closest equivalent is a
> **Progressive Web App (PWA)** — an app you install to your home screen that opens
> full-screen and immediately shows the latest received photo. We build that in Phase 8.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Phase 1 — Project Setup](#phase-1--project-setup)
3. [Phase 2 — Firebase Setup](#phase-2--firebase-setup)
4. [Phase 3 — Authentication](#phase-3--authentication)
5. [Phase 4 — App Shell & Navigation](#phase-4--app-shell--navigation)
6. [Phase 5 — Friend System](#phase-5--friend-system)
7. [Phase 6 — Camera & Photo Sending](#phase-6--camera--photo-sending)
8. [Phase 7 — Real-Time Inbox](#phase-7--real-time-inbox)
9. [Phase 8 — PWA: Install to Home Screen](#phase-8--pwa-install-to-home-screen)
10. [Phase 9 — Deploy to Firebase Hosting](#phase-9--deploy-to-firebase-hosting)
11. [Phase 10 — Firestore Security Rules](#phase-10--firestore-security-rules)
12. [Summary & Next Steps](#summary--next-steps)
13. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Make sure you have:

| Tool | Version | How to check |
|---|---|---|
| Node.js | 18 or newer | `node --version` |
| npm | 9 or newer | `npm --version` |
| VS Code | Any recent | — |
| A Google account | For Firebase | — |
| A modern browser | Chrome or Safari | — |

To install Node.js, visit [nodejs.org](https://nodejs.org) and download the **LTS** version.

---

## Phase 1 — Project Setup

### Step 1.1 — Create the project

Open your terminal and run:

```bash
npm create vite@latest hoy -- --template react
cd hoy
npm install
```

`vite` is a fast, modern build tool. The `--template react` flag scaffolds a React project.
Open the `hoy` folder in VS Code:

```bash
code .
```

### Step 1.2 — Install dependencies

```bash
npm install firebase react-router-dom
npm install -D tailwindcss@3 postcss autoprefixer vite-plugin-pwa
npx tailwindcss init -p
```

What each package does:

- **firebase** — connects to Firebase (auth, database, file storage)
- **react-router-dom** — navigation between pages (Camera, Inbox, Friends)
- **tailwindcss** — utility CSS classes for fast, consistent mobile styling
- **vite-plugin-pwa** — turns our app into an installable PWA

### Step 1.3 — Configure Tailwind

Open `tailwind.config.js` and replace its contents:

```js
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
};
```

Open `src/index.css` and replace **all** of its contents with:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Prevent overscroll bounce on iOS */
html, body {
  overscroll-behavior: none;
  background-color: #000;
  color: #fff;
}
```

### Step 1.4 — Clean up boilerplate

Delete `src/App.css`.

Replace `src/App.jsx` with this temporary placeholder (Phase 4 will replace it fully):

```jsx
function App() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      <p className="text-zinc-500">hoy — setup complete</p>
    </div>
  )
}

export default App
```

Then replace `src/main.jsx` with:

```jsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

### Step 1.5 — Verify setup

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173). You should see the default Vite/React page.
We'll replace it completely in the next phases.

---

## Phase 2 — Firebase Setup

Firebase is Google's managed backend platform. It handles user accounts, a real-time database,
and file storage — all without you writing a server.

### Step 2.1 — Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
2. Click **"Add project"**
3. Name it `hoy` → click **Continue**
4. Disable Google Analytics (not needed) → click **Create project**

### Step 2.2 — Enable Authentication

1. In the left sidebar: **Build → Authentication**
2. Click **"Get started"**
3. Click **Email/Password** → toggle the first **Enable** switch → also toggle **Email link (passwordless sign-in)** → click **Save**

> **Why enable both?** Email link is technically a sub-feature of the Email/Password provider
> in Firebase — you must enable the parent toggle first, then the sub-toggle.

4. In the Firebase console → **Authentication → Settings → Authorized domains**, make sure
   `localhost` is listed (it is by default). When you deploy in Phase 9, your `.web.app`
   domain is also added automatically.

### Step 2.3 — Create a Firestore database

1. In the left sidebar: **Build → Firestore Database**
2. Click **"Create database"**
3. Choose **"Start in test mode"** → **Next**
4. Pick the region closest to you → **Enable**

> **Test mode** allows anyone to read/write for 30 days. This is fine while you're building.
> We add proper security rules in Phase 10.

### Step 2.4 — Set up Storage

1. In the left sidebar: **Build → Storage**
2. Click **"Get started"**
3. Choose **"Start in test mode"** → **Next** → **Done**

### Step 2.5 — Register your web app

1. On the Firebase project overview, click the **`</>`** (web) icon
2. Give it a nickname: `hoy-web`
3. Click **"Register app"**
4. You'll see a `firebaseConfig` object — **copy it**, you'll need it in the next step

### Step 2.6 — Add Firebase config to your project

Create the file `src/firebase.js`:

```js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Paste the config object you copied from the Firebase console
const firebaseConfig = {
  apiKey: 'YOUR_API_KEY',
  authDomain: 'YOUR_PROJECT.firebaseapp.com',
  projectId: 'YOUR_PROJECT_ID',
  storageBucket: 'YOUR_PROJECT.appspot.com',
  messagingSenderId: 'YOUR_SENDER_ID',
  appId: 'YOUR_APP_ID',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
```

Replace each `'YOUR_...'` placeholder with the real values from your Firebase console.

> **Is this safe?** Yes. These values are intentionally public — they just identify your
> Firebase project. Access to your actual data is controlled by Firestore security rules
> (Phase 10), not by keeping these values secret.

---

## Phase 3 — Authentication

We're using **passwordless email link** authentication. The flow is:

1. User enters their email → we send them a magic link
2. User taps the link in their email → they're redirected back to the app, signed in
3. If it's their first time, we show a screen to pick a username

> **No passwords to remember** — great for a casual social app like hoy.

### Step 3.1 — Create the AuthContext

Create the folder `src/contexts/`, then create `src/contexts/AuthContext.jsx`:

```jsx
import { createContext, useContext, useState, useEffect } from 'react';
import {
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext(null);

// actionCodeSettings tells Firebase where to redirect after the user clicks the link.
// During development this is localhost. In production it will be your deployed URL.
// We use window.location.href so it works both locally and when deployed without changing code.
const actionCodeSettings = {
  url: window.location.origin + '/',   // redirect back to our app's root
  handleCodeInApp: true,               // open the link in the app (not the email client)
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  // needsUsername is true when a user just signed in for the first time
  // and hasn't picked a username yet
  const [needsUsername, setNeedsUsername] = useState(false);

  // Step 1: Send a magic link to the user's email
  async function sendMagicLink(email) {
    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    // Save the email in localStorage so we can complete sign-in when they come back
    localStorage.setItem('hoy_email', email);
  }

  // Step 2: Complete sign-in when the user lands back on the app via the magic link
  async function completeMagicLinkSignIn() {
    if (!isSignInWithEmailLink(auth, window.location.href)) return false;

    let email = localStorage.getItem('hoy_email');
    if (!email) {
      // If the user opened the link on a different device, ask them for their email
      email = window.prompt('Please enter your email to confirm sign in:');
    }
    if (!email) return false;

    const { user } = await signInWithEmailLink(auth, email, window.location.href);
    localStorage.removeItem('hoy_email');
    // Clean the magic link params from the URL bar
    window.history.replaceState({}, document.title, window.location.pathname);
    return user;
  }

  // Step 3: After sign-in, check if user has a Firestore profile (i.e., has a username)
  async function loadOrInitProfile(user) {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists()) {
      setUserProfile(snap.data());
      setNeedsUsername(false);
    } else {
      // New user — they need to choose a username
      setNeedsUsername(true);
    }
  }

  // Step 4: Save username after the user picks one
  async function saveUsername(username) {
    if (!currentUser) return;
    await setDoc(doc(db, 'users', currentUser.uid), {
      uid: currentUser.uid,
      username: username.toLowerCase().trim(),
      email: currentUser.email,
      createdAt: serverTimestamp(),
    });
    const snap = await getDoc(doc(db, 'users', currentUser.uid));
    setUserProfile(snap.data());
    setNeedsUsername(false);
  }

  function logOut() {
    return signOut(auth);
  }

  // On every page load, check if the current URL is a sign-in link
  useEffect(() => {
    completeMagicLinkSignIn().catch(console.error);
  }, []);

  // Listen for auth state changes (login, logout, page refresh)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await loadOrInitProfile(user);
      } else {
        setUserProfile(null);
        setNeedsUsername(false);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    needsUsername,
    sendMagicLink,
    completeMagicLinkSignIn,
    saveUsername,
    logOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

**What's happening here?** Instead of a password, Firebase emails a one-time link.
When the user clicks it, our `completeMagicLinkSignIn` function runs and signs them in.
`needsUsername` lets us know whether to show a username-picker screen before the main app.

### Step 3.2 — Build the Magic Link form

This replaces the separate Sign Up / Login forms — there's only one form now.

Create `src/components/auth/MagicLinkForm.jsx`:

```jsx
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

export default function MagicLinkForm() {
  const { sendMagicLink } = useAuth();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await sendMagicLink(email);
      setSent(true);
    } catch (err) {
      setError(err.message.replace('Firebase: ', ''));
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 w-full max-w-sm text-center">
        <h1 className="text-3xl font-bold">hoy</h1>
        <div className="text-5xl">📬</div>
        <p className="text-white font-medium">Check your email</p>
        <p className="text-zinc-400 text-sm">
          We sent a sign-in link to <span className="text-white">{email}</span>.
          Tap the link in your email to continue.
        </p>
        <button
          onClick={() => setSent(false)}
          className="text-zinc-500 text-sm underline mt-2"
        >
          Use a different email
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      <h1 className="text-3xl font-bold text-center">hoy</h1>
      <p className="text-zinc-400 text-center text-sm">
        Enter your email — we'll send you a sign-in link.
        <br />No password needed.
      </p>

      {error && (
        <div className="bg-red-900/40 border border-red-500 text-red-300 text-sm p-3 rounded-lg">
          {error}
        </div>
      )}

      <input
        type="email"
        placeholder="your@email.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="bg-zinc-800 text-white placeholder-zinc-500 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-white/30"
        autoCapitalize="none"
        autoCorrect="off"
        required
      />

      <button
        type="submit"
        disabled={loading}
        className="bg-white text-black font-semibold rounded-xl py-3 mt-2 disabled:opacity-50"
      >
        {loading ? 'Sending…' : 'Send Sign-In Link'}
      </button>
    </form>
  );
}
```

### Step 3.3 — Build the Username picker

New users need to choose a username after their first sign-in.

Create `src/components/auth/UsernameForm.jsx`:

```jsx
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
```

### Step 3.4 — Build the Auth page

Create `src/pages/AuthPage.jsx`:

```jsx
import MagicLinkForm from '../components/auth/MagicLinkForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <MagicLinkForm />
    </div>
  );
}
```

---

## Phase 4 — App Shell & Navigation

Now we wire everything together: the AuthContext, routing, a bottom navigation bar,
and placeholder pages.

### Step 4.1 — Build the Bottom Navigation bar

Create `src/components/ui/BottomNav.jsx`:

```jsx
import { NavLink } from 'react-router-dom';

function CameraIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z" />
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0ZM18.75 10.5h.008v.008h-.008V10.5Z" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
    </svg>
  );
}

function FriendsIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"
      strokeWidth={1.8} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round"
        d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
    </svg>
  );
}

const tabs = [
  { to: '/camera', label: 'Send',    Icon: CameraIcon },
  { to: '/inbox',  label: 'Inbox',   Icon: InboxIcon  },
  { to: '/friends', label: 'Friends', Icon: FriendsIcon },
];

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-zinc-950 border-t border-zinc-800 flex justify-around items-center h-16 z-50">
      {tabs.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 text-xs transition-colors ${
              isActive ? 'text-white' : 'text-zinc-500'
            }`
          }
        >
          <Icon />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
```

### Step 4.2 — Wire up App.jsx

Replace `src/App.jsx` with:

```jsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import AuthPage from './pages/AuthPage';
import CameraPage from './pages/CameraPage';
import InboxPage from './pages/InboxPage';
import FriendsPage from './pages/FriendsPage';
import BottomNav from './components/ui/BottomNav';
import UsernameForm from './components/auth/UsernameForm';

// Redirects unauthenticated users to /auth
function ProtectedRoute({ children }) {
  const { currentUser } = useAuth();
  return currentUser ? children : <Navigate to="/auth" replace />;
}

function AppShell() {
  const { currentUser, needsUsername } = useAuth();

  // If signed in but hasn't chosen a username yet, show that screen
  if (currentUser && needsUsername) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
        <UsernameForm />
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* If already logged in, redirect away from /auth */}
        <Route
          path="/auth"
          element={currentUser ? <Navigate to="/camera" replace /> : <AuthPage />}
        />
        <Route path="/camera"  element={<ProtectedRoute><CameraPage /></ProtectedRoute>} />
        <Route path="/inbox"   element={<ProtectedRoute><InboxPage /></ProtectedRoute>} />
        <Route path="/friends" element={<ProtectedRoute><FriendsPage /></ProtectedRoute>} />
        {/* Any other URL redirects to camera or auth depending on login state */}
        <Route path="*" element={<Navigate to={currentUser ? '/camera' : '/auth'} replace />} />
      </Routes>

      {/* Only show nav when logged in */}
      {currentUser && <BottomNav />}
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </AuthProvider>
  );
}
```

### Step 4.3 — Create placeholder pages

We'll fill these in over the next phases. For now, create them as stubs.

Create `src/pages/CameraPage.jsx`:

```jsx
export default function CameraPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center pb-16">
      <p className="text-zinc-500">Camera — coming in Phase 6</p>
    </div>
  );
}
```

Create `src/pages/InboxPage.jsx`:

```jsx
export default function InboxPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center pb-16">
      <p className="text-zinc-500">Inbox — coming in Phase 7</p>
    </div>
  );
}
```

Create `src/pages/FriendsPage.jsx`:

```jsx
export default function FriendsPage() {
  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center pb-16">
      <p className="text-zinc-500">Friends — coming in Phase 5</p>
    </div>
  );
}
```

### Step 4.4 — Test auth

Run `npm run dev`. You should now be able to:

1. See the email form at `/auth`
2. Enter your email → see the "check your email" screen
3. Click the link in the email → redirected back to the app → shown the username picker
4. Pick a username → redirected to `/inbox` (the friends feed) with the bottom nav visible
5. Open the Firebase console → **Firestore Database** → see a document in the `users` collection

> **Testing tip:** The magic link email may land in your spam folder the first time.
> After sign-in, `localStorage` entry `hoy_email` is automatically removed.

---

## Phase 5 — Friend System

The friend system has three parts:

1. **Search** — find a user by their username
2. **Requests** — send, receive, and accept friend requests
3. **Friends list** — see all accepted friends

### Step 5.1 — Understand the Firestore schema

Our friend request documents look like this in Firestore:

```
/friendRequests/{requestId}
  fromUid:      "abc123"
  fromUsername: "alice"
  toUid:        "def456"
  toUsername:   "bob"
  status:       "pending"   ← changes to "accepted" or "declined"
  createdAt:    <timestamp>
```

When Bob accepts, we update `status` to `"accepted"`. Both Alice and Bob then appear
in each other's friends list by querying for accepted requests involving their uid.

### Step 5.2 — Create the FriendsPage with tabs

Replace `src/pages/FriendsPage.jsx`:

```jsx
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
            className={`pb-2 text-sm capitalize border-b-2 transition-colors ${
              tab === t ? 'border-white text-white' : 'border-transparent text-zinc-500'
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
```

### Step 5.3 — Build the Search view

Create `src/components/friends/SearchView.jsx`:

```jsx
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
```

### Step 5.4 — Build the Friend Requests view

Create `src/components/friends/FriendRequests.jsx`:

```jsx
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
    // Listen in real time for pending requests sent TO the current user
    const q = query(
      collection(db, 'friendRequests'),
      where('toUid', '==', currentUser.uid),
      where('status', '==', 'pending')
    );
    // onSnapshot fires immediately with current data, then again on any change
    const unsubscribe = onSnapshot(q, (snap) => {
      setRequests(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe; // clean up when the component unmounts
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
      {requests.map((req) => (
        <li key={req.id}
          className="flex items-center justify-between bg-zinc-900 rounded-xl px-4 py-3">
          <span className="font-medium">@{req.fromUsername}</span>
          <div className="flex gap-2">
            <button
              onClick={() => decline(req.id)}
              className="text-sm text-zinc-400 border border-zinc-600 rounded-lg px-3 py-1"
            >
              Decline
            </button>
            <button
              onClick={() => accept(req.id)}
              className="text-sm bg-white text-black font-semibold rounded-lg px-3 py-1"
            >
              Accept
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}
```

### Step 5.5 — Build the Friends List

Create `src/components/friends/FriendsList.jsx`:

```jsx
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
```

### Step 5.6 — Test the friend system

1. Open `npm run dev`
2. Create **two accounts** — one in a normal browser tab, one in a private/incognito window
3. From account A → Friends → Search → type account B's username → tap **Add**
4. From account B → Friends → Requests → tap **Accept**
5. Both accounts should see each other in the **Friends** tab instantly (real-time!)

---

## Phase 6 — Camera & Photo Sending

### Step 6.1 — Understand the approach

On mobile browsers, the easiest way to access the camera is with an
`<input type="file" accept="image/*" capture>` element.
When tapped on a phone, it opens the native camera. On desktop, it opens a file picker.

The post flow is:
1. User picks/takes a photo → we show a preview
2. User taps **Post** — no recipient needed, all friends will see it
3. We upload the image to **Firebase Storage**
4. We write a document to **Firestore** `/posts` with the download URL

### Step 6.2 — Build the Camera page

Replace `src/pages/CameraPage.jsx`:

```jsx
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
    // FileReader converts the file to a data URL we can use as an <img> src
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
      // 1. Upload to Firebase Storage
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
        <h2 className="text-lg font-semibold">Send a photo</h2>
        <p className="text-zinc-500 text-sm">@{userProfile?.username}</p>
      </div>

      {/* Photo picker / preview */}
      <div className="px-4 mb-4">
        {preview ? (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-2xl object-cover max-h-[50vh]"
            />
            <button
              onClick={clearPhoto}
              className="absolute top-3 right-3 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-xl leading-none"
            >
              ×
            </button>
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-700 rounded-2xl h-52 cursor-pointer text-zinc-500 gap-2">
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
```

> **Tip:** Change `capture="environment"` to `capture="user"` to default to the front
> (selfie) camera. Remove the `capture` attribute entirely to let the user choose between
> camera and photo library.

---

## Phase 7 — Real-Time Feed

The Inbox tab shows your friends' latest posts in a 2-column grid — one square per friend,
with their name underneath. Firestore's `onSnapshot` listener fires every time the data
changes, so new posts appear instantly without a page refresh.

### Step 7.1 — Build the feed page

Replace `src/pages/InboxPage.jsx`:

```jsx
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

  // Step 1: listen for accepted friends in real time
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

  if (friendUIDs?.length === 0) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center pb-16 gap-2">
        <p className="text-zinc-500">No friends yet</p>
        <p className="text-zinc-600 text-xs">Add friends in the Friends tab to see their photos</p>
      </div>
    );
  }

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
```

### Step 7.2 — Create the required Firestore index

The feed query filters by `uid` (using `in`) AND orders by `timestamp`. Firestore requires a
**composite index** for this combination.

When you first open the Inbox tab while logged in with at least one friend, check the
**browser console** (F12 → Console). You'll likely see an error like:

```
FirebaseError: The query requires an index. You can create it here: https://...
```

Click that URL — it takes you directly to the Firebase console to create the index.
It takes about 60 seconds to build. After that the feed loads correctly.

### Step 7.3 — Test end-to-end

1. Log in as **account A** in a normal browser tab
2. Log in as **account B** in a private/incognito window
3. Make sure A and B are already friends (Phase 5)
4. Account A: Camera tab → pick a photo → tap **Post**
5. Account B: switch to the Inbox tab — account A's photo appears in the grid **without refreshing** 🎉
6. Tap the photo to see it full-screen

---

## Phase 8 — PWA: Install to Home Screen

A **Progressive Web App (PWA)** can be "installed" on Android or iOS so it appears on the
home screen like a native app — full-screen, no browser address bar, with a custom icon.

### Step 8.1 — Create app icons

You need two PNG files in the `public/` folder:

- `public/icon-192.png` — 192×192 pixels
- `public/icon-512.png` — 512×512 pixels

For now, any square image works. Rename it and put copies at both sizes in `public/`.
(You can create a simple black square with "hoy" in white text using any image editor,
or use a free tool like [favicon.io](https://favicon.io).)

### Step 8.2 — Configure vite-plugin-pwa

Replace `vite.config.js`:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'hoy',
        short_name: 'hoy',
        description: 'Send photos to your friends',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',       // hides the browser UI when installed
        orientation: 'portrait',
        start_url: '/inbox',        // which page opens when you tap the home screen icon
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
    }),
  ],
});
```

> **What is `display: 'standalone'`?** When the user opens your app from the home screen,
> it launches in its own window with no browser chrome (no URL bar, no tabs). It looks and
> feels like a native app.

### Step 8.3 — Test the PWA

The PWA only works over HTTPS or on localhost. To test on your phone, deploy first
(Phase 9), then:

**On iOS (Safari only):**
1. Open your app's URL in Safari
2. Tap the **Share** button (box with arrow icon at the bottom)
3. Tap **"Add to Home Screen"**
4. Tap **"Add"** in the top-right corner
5. The app appears on your home screen — tap it to open full-screen

**On Android (Chrome):**
1. Open your app's URL in Chrome
2. Tap the menu (⋮) → **"Install app"** or **"Add to Home Screen"**

---

## Phase 9 — Deploy to Firebase Hosting

Firebase Hosting gives you a real HTTPS URL so you can open the app on your phone
and share it with friends.

### Step 9.1 — Install the Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

`firebase login` will open a browser window asking you to sign in with your Google account.

### Step 9.2 — Initialize hosting

Run this from inside the `hoy` project folder:

```bash
firebase init hosting
```

Answer the prompts:

| Prompt | Answer |
|---|---|
| Which Firebase project? | Select your `hoy` project |
| Public directory? | `dist` |
| Configure as single-page app? | **Yes** |
| Set up automatic GitHub deploys? | No |
| Overwrite `dist/index.html`? | **No** |

### Step 9.3 — Build and deploy

```bash
npm run build
firebase deploy --only hosting
```

Firebase outputs a URL like `https://hoy-12345.web.app`. Open it on your phone!

To redeploy after making changes:

```bash
npm run build && firebase deploy --only hosting
```

---

## Phase 10 — Firestore Security Rules

Right now the database is in "test mode" — anyone on the internet can read and write all
your data. Before sharing with real users, set proper security rules.

### Step 10.1 — Update Firestore rules

In the Firebase console → **Firestore Database → Rules tab**, replace the rules with:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // User profiles: anyone logged in can read (needed for friend search).
    // Only you can write your own profile.
    match /users/{userId} {
      allow read:  if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }

    // Friend requests: you can only see requests that involve you.
    // You can only CREATE a request as yourself (fromUid must match your uid).
    // You can only UPDATE a request where you are the recipient (to accept/decline).
    match /friendRequests/{requestId} {
      allow read: if request.auth != null && (
        resource.data.fromUid == request.auth.uid ||
        resource.data.toUid   == request.auth.uid
      );
      allow create: if request.auth != null &&
        request.resource.data.fromUid == request.auth.uid;
      allow update: if request.auth != null &&
        resource.data.toUid == request.auth.uid;
    }

    // Photos: you can only see photos you sent or received.
    // You can only CREATE photos as yourself.
    // You can only UPDATE a photo if you're the recipient AND only the `seen` field changes.
    match /photos/{photoId} {
      allow read: if request.auth != null && (
        resource.data.fromUid == request.auth.uid ||
        resource.data.toUid   == request.auth.uid
      );
      allow create: if request.auth != null &&
        request.resource.data.fromUid == request.auth.uid;
      allow update: if request.auth != null &&
        resource.data.toUid == request.auth.uid &&
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['seen']);
    }

  }
}
```

Click **Publish**.

### Step 10.2 — Update Storage rules

In the Firebase console → **Storage → Rules tab**, replace the rules with:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{userId}/{allPaths=**} {
      // You can only upload to your own folder
      allow write: if request.auth != null && request.auth.uid == userId;
      // Any authenticated user can read (so recipients can load the photo)
      allow read:  if request.auth != null;
    }
  }
}
```

Click **Publish**.

---

## Summary: What You've Built

| Feature | Phase |
|---|---|
| Email sign-up and login | Phase 3 |
| Persistent auth state (stay logged in) | Phase 3 |
| Three-tab navigation (Send / Inbox / Friends) | Phase 4 |
| Search for users by username | Phase 5 |
| Send and accept friend requests | Phase 5 |
| Real-time friends list | Phase 5 |
| Take or pick a photo from the camera | Phase 6 |
| Upload photo to Firebase Storage | Phase 6 |
| Post photo visible to all friends | Phase 6 |
| Real-time feed — photos appear instantly | Phase 7 |
| 2-column friend grid with full-screen viewer | Phase 7 |
| Installable PWA — add to home screen | Phase 8 |
| Live HTTPS deployment | Phase 9 |
| Production Firestore + Storage security rules | Phase 10 |

---

## Next Steps (Optional Improvements)

| Feature | How |
|---|---|
| **Push notifications** | Firebase Cloud Messaging (requires a backend Cloud Function + service worker) |
| **Video support** | Change `accept="image/*"` to `accept="image/*,video/*"` and store video URLs in Firestore |
| **Group sending** | Replace `toUid` with a `toUids: []` array and query with `array-contains` |
| **Reactions** | Add a `reactions` map to photo documents, update with `updateDoc` |
| **Live camera viewfinder** | Replace `<input capture>` with `navigator.mediaDevices.getUserMedia` + `<video>` element |
| **Username uniqueness** | Use a Firestore transaction to atomically check-and-reserve usernames |
| **Image compression** | Use the `browser-image-compression` npm package before uploading to reduce file size |

---

## Troubleshooting

| Problem | Solution |
|---|---|
| Inbox fails with "index" error in the console | Click the link in the error — it creates the Firestore composite index automatically |
| Camera input opens file picker on desktop | Expected behavior. Real camera access requires a phone. Use a file from your computer to test |
| PWA "Add to Home Screen" is missing | On iOS, must use **Safari** (not Chrome). On Android, use Chrome |
| Firebase 403 / permission errors | Make sure you replaced all `'YOUR_...'` placeholders in `src/firebase.js` |
| Widget doesn't update automatically | PWA home screen apps have no background sync. The latest photo shows when you open the app |
| `npm run dev` fails with Tailwind errors | Make sure `src/index.css` starts with the three `@tailwind` directives |
| Firestore rules block friend search | Make sure you're using the rules from Phase 10, not test-mode rules |
| Magic link email never arrives | Check spam. Make sure `localhost` is in Firebase Authentication → Settings → Authorized domains |
| "This sign-in link has already been used" | Links are single-use. Go back to `/auth` and request a new one |
| Clicking the magic link opens a blank page | Make sure `actionCodeSettings.url` in AuthContext matches `window.location.origin + '/'` |
| "The action code is invalid" after clicking link | The link expired (they last 1 hour). Request a fresh one from the auth page |
