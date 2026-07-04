import { atom } from 'nanostores';

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
 * Handle login.
 * Phase 1: Mock success with demo user.
 * Phase 2: Replace with Supabase auth.signInWithPassword()
 */
export async function handleLogin(email: string, password: string): Promise<void> {
  $authLoading.set(true);
  $authError.set('');

  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    // Phase 1: Accept any non-empty credentials
    if (!email.trim() || !password.trim()) {
      $authError.set('Please enter both email and password.');
      return;
    }

    if (password.length < 6) {
      $authError.set('Password must be at least 6 characters.');
      return;
    }

    // Mock success
    $user.set({ id: 'u-demo', email: email.trim() });
    $authModal.set('closed');
  } finally {
    $authLoading.set(false);
  }
}

/**
 * Handle signup.
 * Phase 1: Mock success.
 * Phase 2: Replace with Supabase auth.signUp()
 */
export async function handleSignup(email: string, password: string, confirmPassword: string): Promise<void> {
  $authLoading.set(true);
  $authError.set('');

  try {
    await new Promise(resolve => setTimeout(resolve, 1000));

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

    // Mock success
    $user.set({ id: 'u-demo', email: email.trim() });
    $authModal.set('closed');
  } finally {
    $authLoading.set(false);
  }
}

/**
 * Handle logout.
 * Phase 2: Replace with Supabase auth.signOut()
 */
export function handleLogout(): void {
  $user.set(null);
}
