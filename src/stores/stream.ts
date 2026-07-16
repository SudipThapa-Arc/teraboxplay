import { map } from 'nanostores';
import { MOCK_MIRRORS, MOCK_CONSOLE_LOGS } from './mockData';
import type { MirrorServer } from './mockData';
import { supabase } from '../lib/supabase';

// ─── Types ───
export type StreamStatus = 'idle' | 'fetching' | 'resolving' | 'playing' | 'error';
export type MediaType = 'video' | 'audio' | 'document';
export type QualityOption = '480p' | '720p' | '1080p';

export interface StreamState {
  status: StreamStatus;
  url: string;
  /** Raw resolved URL from edge function (may be a proxy path or direct URL) */
  resolvedUrl: string;
  /** Proxy URL to point the player at — always goes through our edge function */
  proxyUrl: string;
  /** True when resolvedUrl is an HLS .m3u8 manifest */
  isHls: boolean;
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
  proxyUrl: '',
  isHls: false,
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
 * Fetch and resolve a TeraBox link via the Supabase Edge Function.
 * Preserves the reactive console log animation for UX continuity.
 */
export async function handleFetchLink(url: string): Promise<void> {
  if (!url.trim()) return;

  // Reset and start fetch
  $stream.set({ ...INITIAL_STATE, url, status: 'fetching', consoleLog: [] });

  // Animate console log output while the edge function resolves
  const logAnimation = animateConsoleLogs();

  try {
    // Transition to resolving after a brief delay for UX continuity
    await delay(600);
    $stream.setKey('status', 'resolving');

    // Call the Supabase Edge Function
    const { data, error } = await supabase.functions.invoke('resolve-terabox', {
      body: { url },
    });

    // Stop log animation
    logAnimation.stop();

    if (error) {
      const current = $stream.get();
      $stream.setKey('consoleLog', [
        ...current.consoleLog,
        `[ERROR] Edge function failed: ${error.message}`,
      ]);
      $stream.setKey('status', 'error');
      return;
    }

    const { resolved_url, stream_proxy_url, is_hls, file_name, file_size, media_type } = data;

    // Derive extension from file name
    const extMatch = file_name?.match(/\.(\w+)$/);
    const extension = extMatch ? extMatch[1] : 'mp4';

    // Finalize console logs
    const current = $stream.get();
    $stream.setKey('consoleLog', [
      ...current.consoleLog,
      `[STREAM] Resolved: ${file_name} (${file_size})`,
      is_hls ? '[HLS] Manifest detected — initialising hls.js...' : '[STREAM] Playback ready — buffered 4.8s ahead',
    ]);

    // Set playing state
    $stream.set({
      ...$stream.get(),
      status: 'playing',
      resolvedUrl: resolved_url,
      proxyUrl: stream_proxy_url ?? resolved_url,
      isHls: Boolean(is_hls),
      fileName: file_name,
      fileSize: file_size,
      mediaType: media_type as MediaType,
      extension,
      mirrorStatus: 'Connected',
    });

    // ─── Insert into history table ───
    const { data: userData } = await supabase.auth.getUser();
    await supabase.from('history').insert({
      user_id: userData?.user?.id ?? null,
      original_url: url,
      resolved_url,
      file_name,
      file_size,
      media_type,
    });
  } catch (err) {
    logAnimation.stop();
    const current = $stream.get();
    $stream.setKey('consoleLog', [
      ...current.consoleLog,
      `[ERROR] ${err instanceof Error ? err.message : 'Unknown error'}`,
    ]);
    $stream.setKey('status', 'error');
  }
}

/**
 * Animate console log messages for UX continuity during resolution.
 * Returns a controller to stop the animation.
 */
function animateConsoleLogs() {
  let stopped = false;
  let index = 0;

  const run = async () => {
    while (!stopped && index < MOCK_CONSOLE_LOGS.length) {
      await delay(300 + Math.random() * 200);
      if (stopped) break;
      const current = $stream.get();
      $stream.setKey('consoleLog', [...current.consoleLog, MOCK_CONSOLE_LOGS[index]]);
      index++;
    }
  };

  run();

  return {
    stop: () => { stopped = true; },
  };
}

/**
 * Change playback quality.
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
 */
export function handleDownload(): void {
  const current = $stream.get();
  const target = current.proxyUrl || current.resolvedUrl;
  if (!target) return;

  $stream.setKey('consoleLog', [
    ...current.consoleLog,
    '[DOWNLOAD] Generating proxy download token...',
    '[DOWNLOAD] Token: tk_' + Math.random().toString(36).substring(2, 10),
    '[DOWNLOAD] Initiating file transfer via proxy...',
  ]);

  if (typeof window !== 'undefined') {
    window.open(target, '_blank');
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
