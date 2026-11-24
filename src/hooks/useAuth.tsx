import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  User,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import {
  auth,
  db,
  googleProvider,
  handleFirestoreError,
  OperationType,
} from '../lib/firebase';

export type LoginReason = 'general' | 'download' | 'practice';

interface AuthContextValue {
  user: User | null;
  authReady: boolean;
  authLoading: boolean;
  authError: string | null;
  isLoginModalOpen: boolean;
  loginModalReason: LoginReason;
  openLoginModal: (reason?: LoginReason) => void;
  closeLoginModal: () => void;
  requireAuth: (reason: Exclude<LoginReason, 'general'>, action: () => void) => void;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  clearAuthError: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function mapFirebaseAuthError(err: unknown): string {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code?: unknown }).code)
      : '';

  if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
    return 'Proses masuk dibatalkan sebelum selesai. Silakan coba lagi.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Jendela login diblokir oleh browser. Izinkan pop-up untuk situs ini lalu coba lagi.';
  }
  if (code === 'auth/network-request-failed') {
    return 'Koneksi internet bermasalah saat menghubungi Google Sign-In.';
  }
  return 'Gagal masuk dengan Google. Silakan coba beberapa saat lagi.';
}

async function ensureUserProfileDocument(signedInUser: User) {
  const userPath = `users/${signedInUser.uid}`;
  const userRef = doc(db, 'users', signedInUser.uid);

  const safeName = (
    signedInUser.displayName?.trim() ||
    signedInUser.email?.split('@')[0] ||
    'Pengguna GridRumus'
  ).slice(0, 120);
  const safeEmail = (signedInUser.email || '').slice(0, 254);
  const safePhoto = signedInUser.photoURL ? signedInUser.photoURL.slice(0, 500) : '';

  if (!safeEmail) return;

  try {
    const snap = await getDoc(userRef);
    if (!snap.exists()) {
      const payload: Record<string, unknown> = {
        uid: signedInUser.uid,
        displayName: safeName,
        email: safeEmail,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (safePhoto) {
        payload.photoURL = safePhoto;
      }
      await setDoc(userRef, payload);
    } else {
      const updatePayload: Record<string, unknown> = {
        displayName: safeName,
        email: safeEmail,
        updatedAt: serverTimestamp(),
      };
      if (safePhoto) {
        updatePayload.photoURL = safePhoto;
      }
      await updateDoc(userRef, updatePayload);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, userPath);
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [loginModalReason, setLoginModalReason] = useState<LoginReason>('general');

  const pendingActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthReady(true);
      if (currentUser) {
        void ensureUserProfileDocument(currentUser).catch((err) => {
          console.error('Failed to sync user profile:', err);
        });
      }
    });
    return () => unsub();
  }, []);

  const openLoginModal = useCallback((reason: LoginReason = 'general') => {
    setAuthError(null);
    setLoginModalReason(reason);
    setIsLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
    setAuthError(null);
    pendingActionRef.current = null;
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const requireAuth = useCallback(
    (reason: Exclude<LoginReason, 'general'>, action: () => void) => {
      if (auth.currentUser || user) {
        action();
        return;
      }
      pendingActionRef.current = action;
      setAuthError(null);
      setLoginModalReason(reason);
      setIsLoginModalOpen(true);
    },
    [user]
  );

  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      if (cred.user) {
        await ensureUserProfileDocument(cred.user);
      }
      setIsLoginModalOpen(false);
      const pending = pendingActionRef.current;
      pendingActionRef.current = null;
      if (pending) {
        pending();
      }
    } catch (error) {
      setAuthError(mapFirebaseAuthError(error));
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const signOutUser = useCallback(async () => {
    pendingActionRef.current = null;
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      authReady,
      authLoading,
      authError,
      isLoginModalOpen,
      loginModalReason,
      openLoginModal,
      closeLoginModal,
      requireAuth,
      signInWithGoogle,
      signOutUser,
      clearAuthError,
    }),
    [
      user,
      authReady,
      authLoading,
      authError,
      isLoginModalOpen,
      loginModalReason,
      openLoginModal,
      closeLoginModal,
      requireAuth,
      signInWithGoogle,
      signOutUser,
      clearAuthError,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
