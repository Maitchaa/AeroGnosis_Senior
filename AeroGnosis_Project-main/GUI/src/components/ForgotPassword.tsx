import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

interface ForgotPasswordProps {
  onSubmit: (email: string) => Promise<void>;
  onBackToLogin: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function ForgotPassword({ onSubmit, onBackToLogin, isSubmitting, errorMessage }: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setFormError(null);
    setSuccessMessage(null);

    if (!email.trim()) {
      setFormError('Email is required');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setFormError('Invalid email format');
      return;
    }

    try {
      await onSubmit(email.trim());
      setSuccessMessage('Password reset email sent. Please check your inbox.');
    } catch (err) {
      if (err instanceof Error && err.name === 'FirebaseError') {
        return;
      }
    }
  };

  const helperMessage = successMessage ?? formError ?? errorMessage ?? null;
  const helperClassName = successMessage ? 'text-green-400' : 'text-red-400';

  return (
    <div className="min-h-screen bg-[#2d3748] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-white mb-2">
            <span className="text-[#60a5fa]">Aero</span>Gnosis
          </h1>
          <p className="text-[#94a3b8]">Reset Your Password</p>
        </div>

        <div className="bg-[#1e2837] rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="text-center mb-6">
              <svg className="w-16 h-16 mx-auto text-[#60a5fa] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p className="text-[#94a3b8] text-sm">
                Enter your email address and we'll send you instructions to reset your password.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="engineer@aerognosis.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="bg-[#2d3748] border-gray-600 text-white"
                autoComplete="email"
              />
            </div>

            {helperMessage && <p className={`text-sm text-center ${helperClassName}`}>{helperMessage}</p>}

            <Button
              type="submit"
              className="w-full bg-[#60a5fa] hover:bg-[#3b82f6] text-white h-12 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Sending reset link…' : 'Send Reset Link'}
            </Button>
          </form>
        </div>

        <div className="text-center mt-6">
          <button onClick={onBackToLogin} className="text-white hover:text-[#60a5fa] transition-colors">
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}
