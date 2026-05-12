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