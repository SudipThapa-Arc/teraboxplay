import { atom, computed } from 'nanostores';
import { MOCK_HISTORY } from './mockData';
import type { HistoryRecord } from './mockData';
import { supabase } from '../lib/supabase';

// ─── Types ───
export type HistoryFilter = 'all' | 'video' | 'audio' | 'document';

// ─── Stores ───
export const $historyRecords = atom<HistoryRecord[]>([...MOCK_HISTORY]);
export const $historyFilter = atom<HistoryFilter>('all');

// ─── Derived ───
export const $filteredHistory = computed(
  [$historyRecords, $historyFilter],
  (records, filter) => {
    if (filter === 'all') return records;
    return records.filter(r => r.media_type === filter);
  }
);

// ─── Actions ───

/**
 * Set the active filter for the history grid.
 */
export function setHistoryFilter(filter: HistoryFilter): void {
  $historyFilter.set(filter);
}

/**
 * Add a new record to history.
 * Phase 2: Replace with Supabase insert.
 */
export function addHistoryRecord(record: HistoryRecord): void {
  const current = $historyRecords.get();
  $historyRecords.set([record, ...current]);
}

/**
 * Remove a record from history.
 * Phase 2: Replace with Supabase delete.
 */
export function removeHistoryRecord(id: string): void {
  const current = $historyRecords.get();
  $historyRecords.set(current.filter(r => r.id !== id));
}

/**
 * Format relative time for display.
 */
export function formatRelativeTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Initialize history from Supabase and subscribe to realtime changes.
 */
export async function initHistoryStore(): Promise<void> {
  // Initial fetch
  const { data } = await supabase
    .from('history')
    .select('*')
    .order('created_at', { ascending: false });

  if (data && data.length > 0) {
    $historyRecords.set(data as HistoryRecord[]);
  }

  // Subscribe to realtime inserts
  supabase
    .channel('history-realtime')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'history' },
      (payload) => {
        addHistoryRecord(payload.new as HistoryRecord);
      }
    )
    .subscribe();
}
