import { atom } from 'nanostores';
import { supabase } from '../lib/supabase';

// ─── Types ───
export type AuthModalState = 'closed' | 'login' | 'signup';

export interface User {
  id: string;
  email: string;
}

// ─── Stores ───
export const $authModal = atom<AuthModalState>('closed');
export const $user = atom<User | null>(null);
export const $authError = atom<string>('');
export const $authLoading = atom<boolean>(false);

// ─── Session Hydration ───

/**
 * Initialize auth state from active Supabase session.
 * Call once on app load to hydrate the user store.
 */
export async function initAuthState(): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    $user.set({ id: session.user.id, email: session.user.email ?? '' });
  }

  // Listen for auth state changes (login, logout, token refresh)
  supabase.auth.onAuthStateChange((_event, session) => {
    if (session?.user) {
      $user.set({ id: session.user.id, email: session.user.email ?? '' });
    } else {
      $user.set(null);
    }
  });
}

// ─── Actions ───

/**
 * Open auth modal to login or signup view.
 */
export function openAuth(view: 'login' | 'signup'): void {
  $authError.set('');
  $authModal.set(view);
}

/**
 * Close auth modal.
 */
export function closeAuth(): void {
  $authModal.set('closed');
  $authError.set('');
}

/**
 * Toggle between login and signup views.
 */
export function toggleAuthView(): void {
  const current = $authModal.get();
  $authError.set('');
  if (current === 'login') $authModal.set('signup');
  else if (current === 'signup') $authModal.set('login');
}

/**
 * Handle login via Supabase auth.signInWithPassword().
 */
export async function handleLogin(email: string, password: string): Promise<void> {
  $authLoading.set(true);
  $authError.set('');

  try {
    if (!email.trim() || !password.trim()) {
      $authError.set('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      $authError.set('Password must be at least 6 characters.');
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      $authError.set(error.message);
      return;
    }

    // onAuthStateChange will hydrate $user
    $authModal.set('closed');
  } finally {
    $authLoading.set(false);
  }
}

/**
 * Handle signup via Supabase auth.signUp().
 */
export async function handleSignup(email: string, password: string, confirmPassword: string): Promise<void> {
  $authLoading.set(true);
  $authError.set('');

  try {
    if (!email.trim() || !password.trim()) {
      $authError.set('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      $authError.set('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      $authError.set('Passwords do not match.');
      return;
    }

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      $authError.set(error.message);
      return;
    }

    // onAuthStateChange will hydrate $user
    $authModal.set('closed');
  } finally {
    $authLoading.set(false);
  }
}

/**
 * Handle logout via Supabase auth.signOut().
 */
export async function handleLogout(): Promise<void> {
  await supabase.auth.signOut();
  $user.set(null);
}
