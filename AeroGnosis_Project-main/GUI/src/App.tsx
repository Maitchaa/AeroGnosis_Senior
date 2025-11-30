import { useEffect, useMemo, useState } from 'react';
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, getServerTimestamp } from './lib/firebase';
import { Login } from './components/Login';
import { CreateAccount } from './components/CreateAccount';
import { ForgotPassword } from './components/ForgotPassword';
import { Dashboard } from './components/Dashboard';
import { ScheduleMaintenance } from './components/ScheduleMaintenance';
import { Credentials } from './components/Credentials';
import { MaintenanceHistory } from './components/MaintenanceHistory';
import { Documents } from './components/Documents';
import { Notifications } from './components/Notifications';
import { CrackDetection } from './components/CrackDetection';
import { DroneStatus } from './components/DroneStatus';

const navigationItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'grid' },
  { id: 'schedule-maintenance', label: 'Schedule', icon: 'calendar' },
  { id: 'crack-detection', label: 'AI Detection', icon: 'sparkles' },
  { id: 'credentials', label: 'Credentials', icon: 'badge' },
  { id: 'maintenance-history', label: 'History', icon: 'clock' },
  { id: 'documents', label: 'Documents', icon: 'document' },
] as const;

const icons: Record<(typeof navigationItems)[number]['icon'], JSX.Element> = {
  grid: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  ),
  calendar: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
      />
    </svg>
  ),
  sparkles: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  ),
  badge: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"
      />
    </svg>
  ),
  clock: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  document: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
};

type AuthView = 'login' | 'create-account' | 'forgot-password';
type Page = (typeof navigationItems)[number]['id'];

async function ensureUserDocument(user: User, profile?: { department?: string; employeeId?: string }) {
  const userDocRef = doc(db, 'users', user.uid);
  const snapshot = await getDoc(userDocRef);

  if (!snapshot.exists()) {
    await setDoc(userDocRef, {
      email: user.email ?? null,
      displayName: user.displayName ?? null,
      department: profile?.department ?? null,
      employeeId: profile?.employeeId ?? null,
      createdAt: getServerTimestamp(),
      updatedAt: getServerTimestamp(),
    });
    return;
  }

  const updates: Record<string, unknown> = { updatedAt: getServerTimestamp() };

  if (profile?.department) {
    updates.department = profile.department;
  }

  if (profile?.employeeId) {
    updates.employeeId = profile.employeeId;
  }

  if (Object.keys(updates).length > 1) {
    await setDoc(userDocRef, updates, { merge: true });
  }
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showDroneStatus, setShowDroneStatus] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setIsAuthReady(true);
      if (!firebaseUser) {
        setCurrentPage('dashboard');
      }
    });

    return () => unsubscribe();
  }, []);

  const displayName = useMemo(() => {
    const fallbackName = 'engineer';

    if (!user) {
      return fallbackName;
    }

    const trimmedDisplayName = user.displayName?.trim();

    if (trimmedDisplayName && trimmedDisplayName.length > 0) {
      return trimmedDisplayName;
    }

    return fallbackName;
  }, [user]);

  const handleLogin = async (email: string, password: string) => {
    setAuthError(null);
    setIsProcessing(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to sign in. Please try again.';
      setAuthError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRegister = async (formData: {
    fullName: string;
    email: string;
    password: string;
    employeeId: string;
    department: string;
  }) => {
    setAuthError(null);
    setIsProcessing(true);

    try {
      const credentials = await createUserWithEmailAndPassword(auth, formData.email, formData.password);

      if (formData.fullName.trim().length > 0) {
        await updateProfile(credentials.user, { displayName: formData.fullName.trim() });
      }

      await ensureUserDocument(credentials.user, {
        department: formData.department,
        employeeId: formData.employeeId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create account. Please try again.';
      setAuthError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetPassword = async (email: string) => {
    setAuthError(null);
    setIsProcessing(true);

    try {
      await sendPasswordResetEmail(auth, email);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to send reset email. Please try again.';
      setAuthError(message);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setShowNotifications(false);
    setShowDroneStatus(false);
  };

  const renderPage = () => {
    if (!user) {
      return null;
    }

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard userName={displayName} onNavigate={setCurrentPage} />;
      case 'schedule-maintenance':
        return <ScheduleMaintenance currentEngineerName={displayName} />;
      case 'crack-detection':
        return <CrackDetection user={user} />;
      case 'credentials':
        return <Credentials user={user} userName={displayName} />;
      case 'maintenance-history':
        return <MaintenanceHistory />;
      case 'documents':
        return <Documents user={user} />;
      default:
        return <Dashboard userName={displayName} onNavigate={setCurrentPage} />;
    }
  };

  if (!isAuthReady) {
    return (
      <div className="min-h-screen bg-[#2d3748] flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#1e2837] border-t-[#60a5fa]" />
      </div>
    );
  }

  if (!user) {
    if (authView === 'create-account') {
      return (
        <CreateAccount
          isSubmitting={isProcessing}
          errorMessage={authError}
          onSubmit={async (data) => {
            await handleRegister(data);
          }}
          onBackToLogin={() => {
            setAuthView('login');
            setAuthError(null);
          }}
        />
      );
    }

    if (authView === 'forgot-password') {
      return (
        <ForgotPassword
          isSubmitting={isProcessing}
          errorMessage={authError}
          onSubmit={async (email) => {
            await handleResetPassword(email);
          }}
          onBackToLogin={() => {
            setAuthView('login');
            setAuthError(null);
          }}
        />
      );
    }

    return (
      <Login
        isSubmitting={isProcessing}
        errorMessage={authError}
        onLogin={async (email, password) => {
          await handleLogin(email, password);
        }}
        onCreateAccount={() => {
          setAuthView('create-account');
          setAuthError(null);
        }}
        onForgotPassword={() => {
          setAuthView('forgot-password');
          setAuthError(null);
        }}
      />
    );
  }

  return (
    <div className="flex h-screen bg-[#2d3748]">
      <div className="w-[200px] bg-[#1e2837] p-6 flex flex-col">
        <div className="mb-12">
          <h1 className="text-white">
            <span className="text-[#60a5fa]">Aero</span>Gnosis
          </h1>
        </div>

        <nav className="flex-1 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                currentPage === item.id
                  ? 'bg-[#2d3748] text-white'
                  : 'text-[#94a3b8] hover:text-white hover:bg-[#2d3748]'
              }`}
            >
              {icons[item.icon]}
              {item.label}
            </button>
          ))}
        </nav>

        <button
          onClick={() => {
            void handleLogout();
          }}
          className="flex items-center gap-3 px-4 py-3 text-[#94a3b8] hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
          Sign Out
        </button>
      </div>

      <div className="flex-1 overflow-auto relative">
        <div className="bg-[#2d3748] p-6 flex items-center justify-between border-b border-[#1e2837]">
          <div className="flex items-center gap-3">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span className="text-white text-xl">Hello, {displayName}</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search..."
                className="bg-white text-gray-900 px-4 py-2 rounded-lg w-[300px] pl-10"
              />
              <svg
                className="w-5 h-5 text-gray-500 absolute left-3 top-2.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            <button
              onClick={() => setShowDroneStatus((value) => !value)}
              className="relative p-2 hover:bg-[#1e2837] rounded-lg transition-colors group"
              title="Drone Status"
            >
              <svg className="w-6 h-6 text-[#22d3ee]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-green-500 rounded-full" />
            </button>

            <button
              onClick={() => setShowNotifications((value) => !value)}
              className="relative p-2 hover:bg-[#1e2837] rounded-lg transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#60a5fa] rounded-full" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6 pb-16">{renderPage()}</div>

        {showNotifications && <Notifications onClose={() => setShowNotifications(false)} />}
        {showDroneStatus && <DroneStatus onClose={() => setShowDroneStatus(false)} />}
      </div>
    </div>
  );
}
