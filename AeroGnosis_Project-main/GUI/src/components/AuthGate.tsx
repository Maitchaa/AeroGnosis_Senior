import { useEffect, useMemo, useState } from 'react';
import type { ReactNode, FormEvent } from 'react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, getServerTimestamp } from '../lib/firebase';

type AuthGateProps = {
  children: (user: User) => ReactNode;
};

type AuthStage = 'loading' | 'sign-in' | 'profile' | 'authenticated';

type ProfileFields = {
  department: string;
  studentOrStaffId: string;
  role: string;
};

const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export function AuthGate({ children }: AuthGateProps) {
  const [stage, setStage] = useState<AuthStage>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profileFields, setProfileFields] = useState<ProfileFields>({
    department: '',
    studentOrStaffId: '',
    role: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const ensureUserProfileDocument = async (firebaseUser: User) => {
    const userDocRef = doc(db, 'users', firebaseUser.uid);
    const snapshot = await getDoc(userDocRef);

    if (!snapshot.exists()) {
      await setDoc(userDocRef, {
        createdAt: getServerTimestamp(),
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setStage('sign-in');
        setUser(null);
        setIsRegistering(false);
        setProfileFields({ department: '', studentOrStaffId: '', role: '' });
        return;
      }

      setUser(firebaseUser);
      try {
        await ensureUserProfileDocument(firebaseUser);
        setStage('authenticated');
      } catch (err) {
        handleAuthError(err);
        setStage('sign-in');
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const resetFormState = () => {
    setEmail('');
    setPassword('');
    setProfileFields({ department: '', studentOrStaffId: '', role: '' });
  };

  const handleAuthError = (err: unknown) => {
    const message =
      err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.';
    setError(message);
  };

  const createUserProfile = async (firebaseUser: User, fields: ProfileFields) => {
    const { department, studentOrStaffId, role } = fields;
    const trimmed: ProfileFields = {
      department: department.trim(),
      studentOrStaffId: studentOrStaffId.trim(),
      role: role.trim(),
    };

    await setDoc(doc(db, 'users', firebaseUser.uid), {
      ...trimmed,
      createdAt: getServerTimestamp(),
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setIsSubmitting(true);
    setError(null);

    try {
      if (isRegistering) {
        if (!profileFields.department || !profileFields.studentOrStaffId || !profileFields.role) {
          throw new Error('Please complete all profile fields.');
        }

        const credentials = await createUserWithEmailAndPassword(auth, email, password);
        await createUserProfile(credentials.user, profileFields);
        resetFormState();
        setStage('authenticated');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        resetFormState();
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await signInWithPopup(auth, googleProvider);
      const firebaseUser = result.user;

      if (firebaseUser) {
        await ensureUserProfileDocument(firebaseUser);
        setStage('authenticated');
      }
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProfileSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!user) {
      setError('Unable to save profile without an authenticated user.');
      return;
    }

    if (!profileFields.department || !profileFields.studentOrStaffId || !profileFields.role) {
      setError('Please complete all profile fields.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await createUserProfile(user, profileFields);
      resetFormState();
      setStage('authenticated');
    } catch (err) {
      handleAuthError(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const headingText = useMemo(() => {
    if (stage === 'profile') {
      return 'Complete your profile';
    }

    return isRegistering ? 'Create your account' : 'Sign in to continue';
  }, [isRegistering, stage]);

  if (stage === 'authenticated' && user) {
    return <>{children(user)}</>;
  }

  return (
    <div className="min-h-screen bg-[#e7eefc] px-4 py-10 text-[#0f172a]">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="mx-auto w-full max-w-md rounded-[32px] bg-white p-10 shadow-[0_25px_70px_rgba(15,23,42,0.18)]">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-[#0f172a] md:text-5xl">
              <span className="text-[#1d4ed8]">Aero</span>Gnosis
            </h1>
            <p className="mt-2 text-sm text-[#475569]">{headingText}</p>
          </div>

          {error && (
            <div className="mb-6 rounded-2xl border border-[#fca5a5] bg-[#fee2e2] px-4 py-3 text-sm text-[#991b1b]">
              {error}
            </div>
          )}

          {stage === 'loading' ? (
            <div className="text-center text-sm text-[#64748b]">Checking your session...</div>
          ) : stage === 'profile' ? (
            <form className="space-y-4" onSubmit={handleProfileSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0f172a]">Department</label>
                <input
                  className="h-12 w-full rounded-xl border border-[#cbd5f5] bg-white px-4 text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:outline-none"
                  value={profileFields.department}
                  onChange={(event) =>
                    setProfileFields((prev) => ({ ...prev, department: event.target.value }))
                  }
                  placeholder="e.g. Aerospace Engineering"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0f172a]">Student or Staff ID</label>
                <input
                  className="h-12 w-full rounded-xl border border-[#cbd5f5] bg-white px-4 text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:outline-none"
                  value={profileFields.studentOrStaffId}
                  onChange={(event) =>
                    setProfileFields((prev) => ({ ...prev, studentOrStaffId: event.target.value }))
                  }
                  placeholder="ID number"
                  disabled={isSubmitting}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0f172a]">Role</label>
                <input
                  className="h-12 w-full rounded-xl border border-[#cbd5f5] bg-white px-4 text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:outline-none"
                  value={profileFields.role}
                  onChange={(event) => setProfileFields((prev) => ({ ...prev, role: event.target.value }))}
                  placeholder="e.g. Research Assistant"
                  disabled={isSubmitting}
                />
              </div>
              <button
                type="submit"
                className="mt-4 w-full rounded-xl bg-[#1d4ed8] px-4 py-3 font-semibold text-white transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving profile…' : 'Save profile'}
              </button>
            </form>
          ) : isRegistering ? (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0f172a]">Work Email</label>
                <input
                  type="email"
                  className="h-12 w-full rounded-xl border border-[#cbd5f5] bg-white px-4 text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:outline-none"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="engineer@aerognosis.com"
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0f172a]">Password</label>
                <input
                  type="password"
                  className="h-12 w-full rounded-xl border border-[#cbd5f5] bg-white px-4 text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:outline-none"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Create a secure password"
                  autoComplete="new-password"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0f172a]">Department</label>
                <input
                  className="h-12 w-full rounded-xl border border-[#cbd5f5] bg-white px-4 text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:outline-none"
                  value={profileFields.department}
                  onChange={(event) =>
                    setProfileFields((prev) => ({ ...prev, department: event.target.value }))
                  }
                  placeholder="e.g. Line Maintenance"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0f172a]">Employee ID</label>
                <input
                  className="h-12 w-full rounded-xl border border-[#cbd5f5] bg-white px-4 text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:outline-none"
                  value={profileFields.studentOrStaffId}
                  onChange={(event) =>
                    setProfileFields((prev) => ({ ...prev, studentOrStaffId: event.target.value }))
                  }
                  placeholder="EMP-2025-XXXX"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-[#0f172a]">Role</label>
                <input
                  className="h-12 w-full rounded-xl border border-[#cbd5f5] bg-white px-4 text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:outline-none"
                  value={profileFields.role}
                  onChange={(event) =>
                    setProfileFields((prev) => ({ ...prev, role: event.target.value }))
                  }
                  placeholder="e.g. Aircraft Engineer"
                  disabled={isSubmitting}
                  required
                />
              </div>
              <button
                type="submit"
                className="mt-2 w-full rounded-xl bg-[#1d4ed8] px-4 py-3 font-semibold text-white transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Creating account…' : 'Create account'}
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="flex items-center gap-4 rounded-2xl bg-[#f1f5ff] px-4 py-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#dbe5ff]">
                  <svg className="h-6 w-6 text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  type="email"
                  className="h-12 flex-1 rounded-xl border border-[#cbd5f5] bg-white px-4 text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:outline-none"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="Username"
                  autoComplete="email"
                  disabled={isSubmitting}
                  required
                />
              </div>

              <div className="flex items-center gap-4 rounded-2xl bg-[#f1f5ff] px-4 py-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-[#dbe5ff]">
                  <svg className="h-6 w-6 text-[#1d4ed8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <div className="relative flex-1">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="h-12 w-full rounded-xl border border-[#cbd5f5] bg-white px-4 pr-12 text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#1d4ed8] focus:outline-none"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    disabled={isSubmitting}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] transition hover:text-[#0f172a]"
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                        />
                      </svg>
                    ) : (
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

              <button
                type="submit"
                className="w-full rounded-xl bg-[#1d4ed8] py-3 text-base font-semibold text-white transition hover:bg-[#1e40af] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in…' : 'Login'}
              </button>
            </form>
          )}

          {stage !== 'loading' && stage !== 'profile' && (
            <div className="mt-8 flex flex-col gap-4 text-sm text-[#475569]">
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="flex items-center justify-center gap-3 rounded-xl border border-[#cbd5f5] bg-white px-4 py-3 text-[#0f172a] transition hover:border-[#1d4ed8] hover:text-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                disabled={isSubmitting}
              >
                <svg className="h-5 w-5" viewBox="0 0 533.5 544.3" aria-hidden="true">
                  <path
                    fill="#4285f4"
                    d="M533.5 278.4c0-17.4-1.5-34-4.3-50.2H272v95h147.5c-6.4 34.6-25.7 63.8-54.6 83.4v68h88.2c51.7-47.6 80.4-117.8 80.4-196.2z"
                  />
                  <path
                    fill="#34a853"
                    d="M272 544.3c73.7 0 135.6-24.5 180.8-66.6l-88.2-68c-24.5 16.4-55.8 26-92.6 26-71 0-131.2-47.9-152.8-112.3h-90v70.6C74.5 480.3 166.2 544.3 272 544.3z"
                  />
                  <path
                    fill="#fbbc04"
                    d="M119.2 323.4c-10.4-30.4-10.4-63 0-93.4v-70.6h-90C4.1 211.5 0 236.3 0 261.8s4.1 50.3 11.6 102.4l107.6-40.8z"
                  />
                  <path
                    fill="#ea4335"
                    d="M272 107.7c39.9 0 75.7 13.7 104 40.5l77.8-77.8C407.4 24.4 345.6 0 272 0 166.2 0 74.5 64 29.6 161.8l89.6 70.6c21.6-64.4 81.8-112.3 152.8-112.3z"
                  />
                </svg>
                Continue with Google
              </button>

              {!isRegistering ? (
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(true);
                      setError(null);
                    }}
                    className="text-[#1d4ed8] transition hover:text-[#1e40af]"
                  >
                    Create Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setError('Password reset is not yet configured. Please contact your administrator.');
                    }}
                    className="text-[#1d4ed8] transition hover:text-[#1e40af]"
                  >
                    Forgot Password?
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between text-[#475569]">
                  <span>Already registered?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsRegistering(false);
                      setError(null);
                    }}
                    className="text-[#1d4ed8] transition hover:text-[#1e40af]"
                  >
                    Back to login
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="hidden max-w-lg flex-1 rounded-[32px] border border-[#d0dcff] bg-[#f1f5ff] p-10 shadow-[0_25px_70px_rgba(15,23,42,0.12)] lg:block">
          <h2 className="text-3xl font-semibold text-[#0f172a]">Trusted AI maintenance insights</h2>
          <p className="mt-4 text-sm leading-6 text-[#475569]">
            Access your unified maintenance workspace, upload inspection imagery, and receive automated crack detection
            insights faster than ever before. AeroGnosis keeps your fleet data secure with enterprise-grade authentication
            and storage powered by Firebase.
          </p>
          <div className="mt-8 grid gap-4 text-sm text-[#475569]">
            <div className="rounded-2xl border border-[#d0dcff] bg-white p-4">
              <p className="font-medium text-[#0f172a]">AI-assisted inspections</p>
              <p className="mt-2 leading-relaxed">
                Upload imagery and let our vision models highlight areas of interest across every airframe in seconds.
              </p>
            </div>
            <div className="rounded-2xl border border-[#d0dcff] bg-white p-4">
              <p className="font-medium text-[#0f172a]">Centralized document vault</p>
              <p className="mt-2 leading-relaxed">Manage logbooks, certifications, and maintenance records without leaving the dashboard.</p>
            </div>
            <div className="rounded-2xl border border-[#d0dcff] bg-white p-4">
              <p className="font-medium text-[#0f172a]">Realtime notifications</p>
              <p className="mt-2 leading-relaxed">Stay informed on inspection progress and scheduled maintenance across your organization.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthGate;
