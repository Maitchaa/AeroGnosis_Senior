import { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';

interface LoginProps {
  onLogin: (email: string, password: string) => Promise<void>;
  onCreateAccount: () => void;
  onForgotPassword: () => void;
  isSubmitting?: boolean;
  errorMessage?: string | null;
}

export function Login({ onLogin, onCreateAccount, onForgotPassword, isSubmitting, errorMessage }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    setFormError(null);

    if (!email.trim()) {
      setFormError('Please enter your email address.');
      return;
    }

    if (!password) {
      setFormError('Please enter your password.');
      return;
    }

    try {
      await onLogin(email.trim(), password);
    } catch (err) {
      if (err instanceof Error && err.name === 'FirebaseError') {
        return;
      }
    }
  };

  const helperMessage = formError ?? errorMessage ?? null;

  return (
    <div className="min-h-screen bg-[#2d3748] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <h1 className="text-5xl text-white mb-2">
            <span className="text-[#60a5fa]">Aero</span>Gnosis
          </h1>
        </div>

        <div className="bg-[#1e2837] rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2d3748] rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="flex-1 bg-white text-gray-900 border-0 h-12"
                required
                autoComplete="email"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#2d3748] rounded-full flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <div className="relative flex-1">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="bg-white text-gray-900 border-0 h-12 pr-12"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {helperMessage && <p className="text-sm text-red-400 text-center">{helperMessage}</p>}

            <Button
              type="submit"
              className="w-full bg-[#60a5fa] hover:bg-[#3b82f6] text-white h-12 rounded-xl"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Signing in…' : 'Login'}
            </Button>
          </form>
        </div>

        <div className="flex justify-between mt-6 px-4">
          <button onClick={onCreateAccount} className="text-white hover:text-[#60a5fa] transition-colors">
            Create Account
          </button>
          <button onClick={onForgotPassword} className="text-white hover:text-[#60a5fa] transition-colors">
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
}
