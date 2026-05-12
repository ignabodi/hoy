import MagicLinkForm from '../components/auth/MagicLinkForm';

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center px-6">
      <MagicLinkForm />
    </div>
  );
}