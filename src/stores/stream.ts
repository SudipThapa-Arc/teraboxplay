import { atom, map } from 'nanostores';
import { MOCK_STREAM_URL, MOCK_MIRRORS, MOCK_CONSOLE_LOGS, MOCK_AUDIO_URL } from './mockData';
import type { MirrorServer } from './mockData';

// ─── Types ───
export type StreamStatus = 'idle' | 'fetching' | 'resolving' | 'playing' | 'error';
export type MediaType = 'video' | 'audio' | 'document';
export type QualityOption = '480p' | '720p' | '1080p';

export interface StreamState {
  status: StreamStatus;
  url: string;
  resolvedUrl: string;
  fileName: string;
  fileSize: string;
  mediaType: MediaType;
  extension: string;
  mirrorStatus: string;
  quality: QualityOption;
  activeMirror: string;
  mirrors: MirrorServer[];
  consoleLog: string[];
  progress: number;
}

// ─── Initial State ───
const INITIAL_STATE: StreamState = {
  status: 'idle',
  url: '',
  resolvedUrl: '',
  fileName: '',
  fileSize: '',
  mediaType: 'video',
  extension: '',
  mirrorStatus: '',
  quality: '720p',
  activeMirror: 'cdn-sg-1',
  mirrors: MOCK_MIRRORS,
  consoleLog: [],
  progress: 0,
};

// ─── Store ───
export const $stream = map<StreamState>({ ...INITIAL_STATE });

// ─── Actions ───

/**
 * Fetch and resolve a TeraBox link.
 * Phase 1: Simulates CDN bypass with timed state transitions.
 * Phase 2: Replace internals with Supabase Edge Function call.
 */
export async function handleFetchLink(url: string): Promise<void> {
  if (!url.trim()) return;

  // Reset and start fetch
  $stream.set({ ...INITIAL_STATE, url, status: 'fetching', consoleLog: [] });

  // Simulate console log output (proxy tunnel messages)
  for (let i = 0; i < MOCK_CONSOLE_LOGS.length; i++) {
    await delay(300 + Math.random() * 200);
    const current = $stream.get();
    $stream.setKey('consoleLog', [...current.consoleLog, MOCK_CONSOLE_LOGS[i]]);

    // Transition to resolving after auth headers
    if (i === 2) {
      $stream.setKey('status', 'resolving');
    }
  }

  // Determine media type from URL or default to video
  const isAudio = url.toLowerCase().includes('audio') || url.toLowerCase().includes('mp3') || url.toLowerCase().includes('flac');
  const mediaType: MediaType = isAudio ? 'audio' : 'video';
  const streamUrl = isAudio ? MOCK_AUDIO_URL : MOCK_STREAM_URL;

  // Resolve
  await delay(400);
  $stream.set({
    ...$stream.get(),
    status: 'playing',
    resolvedUrl: streamUrl,
    fileName: isAudio ? 'Audio_Track_HQ.mp3' : 'Big_Buck_Bunny_1080p.mp4',
    fileSize: isAudio ? '94 MB' : '2.4 GB',
    mediaType,
    extension: isAudio ? 'mp3' : 'mp4',
    mirrorStatus: 'Connected',
  });
}

/**
 * Change playback quality.
 * Phase 1: Updates state only; no actual transcoding.
 */
export function handleQualityChange(quality: QualityOption): void {
  $stream.setKey('quality', quality);
  const current = $stream.get();
  $stream.setKey('consoleLog', [
    ...current.consoleLog,
    `[QUALITY] Switching to ${quality}...`,
    `[QUALITY] Stream rebuffering at ${quality} ✓`,
  ]);
}

/**
 * Switch active mirror server.
 * Phase 1: Updates resolved URL to mirror's URL.
 */
export function handleMirrorChange(mirrorId: string): void {
  const mirror = MOCK_MIRRORS.find(m => m.id === mirrorId);
  if (!mirror) return;

  $stream.setKey('activeMirror', mirrorId);
  $stream.setKey('resolvedUrl', mirror.url);

  const current = $stream.get();
  $stream.setKey('consoleLog', [
    ...current.consoleLog,
    `[MIRROR] Switching to ${mirror.label} (${mirror.region})...`,
    `[MIRROR] Latency: ${mirror.latency}ms — ${mirror.status}`,
  ]);
}

/**
 * Trigger download via proxy.
 * Phase 1: Opens resolved URL in new tab. Phase 2: Proxy token handoff.
 */
export function handleDownload(): void {
  const current = $stream.get();
  if (!current.resolvedUrl) return;

  $stream.setKey('consoleLog', [
    ...current.consoleLog,
    '[DOWNLOAD] Generating proxy download token...',
    '[DOWNLOAD] Token: tk_' + Math.random().toString(36).substring(2, 10),
    '[DOWNLOAD] Initiating file transfer...',
  ]);

  // Phase 1: direct open
  if (typeof window !== 'undefined') {
    window.open(current.resolvedUrl, '_blank');
  }
}

/**
 * Reset stream to idle.
 */
export function resetStream(): void {
  $stream.set({ ...INITIAL_STATE });
}

// ─── Helpers ───
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
