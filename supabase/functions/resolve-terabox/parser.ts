/**
 * parser.ts — Real TeraBox extraction layer (Phase 3).
 *
 * Calls the official internal shorturlinfo API with an authenticated ndus
 * session cookie to resolve share links into streamable file tokens.
 * Falls back to mock data when TERABOX_NDUS_COOKIE is not configured.
 */

// ─── Types ───

export interface ResolvedFile {
  /** Proxy URL for the browser player (always points through our edge function) */
  resolved_url: string;
  /** Same as resolved_url — explicit alias for the client store */
  stream_proxy_url: string;
  /** Whether this URL is an HLS manifest (.m3u8) */
  is_hls: boolean;
  file_name: string;
  file_size: string;
  media_type: 'video' | 'audio' | 'document';
  /** File tokens — consumed internally by the proxy route */
  fs_id: string;
  uk: string;
  shareid: string;
  sign: string;
}

interface TeraBoxListItem {
  server_filename: string;
  size: number;
  fs_id: string | number;
  isdir: number;
}

interface TeraBoxShortUrlResponse {
  errno: number;
  shareid?: string | number;
  uk?: string | number;
  sign?: string;
  list?: TeraBoxListItem[];
}

// ─── Helpers ───

/** Extract the short code from various TeraBox URL formats */
function extractShortCode(url: string): string {
  const patterns = [
    /\/s\/([A-Za-z0-9_-]+)/,
    /[?&]surl=([A-Za-z0-9_-]+)/,
    /^([A-Za-z0-9_-]+)$/,
  ];
  for (const pattern of patterns) {
    const m = url.match(pattern);
    if (m?.[1]) return m[1];
  }
  return url;
}

/** Format bytes into human-readable string */
function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(0)} MB`;
  if (bytes >= 1_024) return `${(bytes / 1_024).toFixed(0)} KB`;
  return `${bytes} B`;
}

/** Derive media type from filename extension */
function inferMediaType(filename: string): 'video' | 'audio' | 'document' {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  const VIDEO = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm', 'm4v', 'ts', 'm3u8'];
  const AUDIO = ['mp3', 'flac', 'wav', 'aac', 'ogg', 'm4a', 'opus', 'wma'];
  if (VIDEO.includes(ext)) return 'video';
  if (AUDIO.includes(ext)) return 'audio';
  return 'document';
}

// ─── Main resolver ───

/**
 * Resolve a TeraBox share link into streamable file metadata.
 *
 * With TERABOX_NDUS_COOKIE set  → calls the real shorturlinfo API.
 * Without it                    → returns mock data for testing.
 *
 * @param rawUrl             The raw TeraBox share URL pasted by the user.
 * @param edgeFunctionBase   The base URL of this edge function, used to build the proxy URL.
 */
export async function resolveTeraBoxLink(
  rawUrl: string,
  edgeFunctionBase: string,
): Promise<ResolvedFile> {
  const ndusCookie = Deno.env.get('TERABOX_NDUS_COOKIE');

  if (!ndusCookie) {
    console.warn('[PARSER] TERABOX_NDUS_COOKIE not set — returning mock data');
    return buildMockResult(rawUrl, edgeFunctionBase);
  }

  // ─── Hit the real TeraBox API ───
  const shortCode = extractShortCode(rawUrl);
  const apiUrl = `https://www.terabox.com/api/shorturlinfo?shorturl=${encodeURIComponent(shortCode)}&root=1`;

  const resp = await fetch(apiUrl, {
    headers: {
      'Cookie': `ndus=${ndusCookie}`,
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Referer': 'https://www.terabox.com/',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'en-US,en;q=0.9',
      'Origin': 'https://www.terabox.com',
    },
  });

  if (!resp.ok) {
    throw new Error(`TeraBox API returned HTTP ${resp.status}`);
  }

  const data = await resp.json() as TeraBoxShortUrlResponse;

  if (data.errno !== 0) {
    if (data.errno === -6) {
      throw new Error(`TeraBox session expired (errno -6). Refresh the ndus cookie secret.`);
    }
    throw new Error(`TeraBox API error: errno ${data.errno}`);
  }

  const list = data.list;
  if (!list || list.length === 0) {
    throw new Error('TeraBox returned an empty file list for this share link.');
  }

  // First non-directory entry wins
  const file = list.find((f) => f.isdir === 0) ?? list[0];

  const fs_id    = String(file.fs_id);
  const uk       = String(data.uk ?? '');
  const shareid  = String(data.shareid ?? '');
  const sign     = data.sign ?? '';
  const file_name = file.server_filename;
  const file_size = formatBytes(file.size);
  const media_type = inferMediaType(file_name);
  const is_hls   = file_name.toLowerCase().endsWith('.m3u8');

  // Build proxy URL — browser will never touch TeraBox directly
  const proxyParams = new URLSearchParams({ fs_id, uk, shareid, sign });
  const stream_proxy_url = `${edgeFunctionBase}/proxy?${proxyParams.toString()}`;

  console.log(`[PARSER] Resolved: ${file_name} (${file_size}) fs_id=${fs_id}`);

  return {
    resolved_url: stream_proxy_url,
    stream_proxy_url,
    is_hls,
    file_name,
    file_size,
    media_type,
    fs_id,
    uk,
    shareid,
    sign,
  };
}

// ─── Mock fallback ───

function buildMockResult(rawUrl: string, edgeFunctionBase: string): ResolvedFile {
  const lower = rawUrl.toLowerCase();
  const isAudio    = /\.(mp3|flac|wav|aac|ogg|m4a)/.test(lower) || lower.includes('audio');
  const isHls      = lower.includes('.m3u8');
  const isDocument = /\.(pdf|doc|docx|zip|rar|7z|pptx|xlsx)/.test(lower);

  if (isAudio) {
    return {
      resolved_url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
      stream_proxy_url: 'https://commondatastorage.googleapis.com/codeskulptor-assets/Epoq-Lepidoptera.ogg',
      is_hls: false, file_name: 'Audio_Track_HQ.mp3', file_size: '94 MB',
      media_type: 'audio', fs_id: 'mock', uk: 'mock', shareid: 'mock', sign: 'mock',
    };
  }

  if (isHls) {
    return {
      resolved_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      stream_proxy_url: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      is_hls: true, file_name: 'HLS_Stream_Demo.m3u8', file_size: '—',
      media_type: 'video', fs_id: 'mock', uk: 'mock', shareid: 'mock', sign: 'mock',
    };
  }

  if (isDocument) {
    return {
      resolved_url: rawUrl, stream_proxy_url: rawUrl,
      is_hls: false, file_name: 'Research_Paper_AI_2026.pdf', file_size: '12 MB',
      media_type: 'document', fs_id: 'mock', uk: 'mock', shareid: 'mock', sign: 'mock',
    };
  }

  // Default: video
  return {
    resolved_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    stream_proxy_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    is_hls: false, file_name: 'Big_Buck_Bunny_1080p.mp4', file_size: '2.4 GB',
    media_type: 'video', fs_id: 'mock', uk: 'mock', shareid: 'mock', sign: 'mock',
  };
}

