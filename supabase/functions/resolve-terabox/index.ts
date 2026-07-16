/**
 * resolve-terabox/index.ts — Deno Edge Function (Phase 3)
 *
 * Routes:
 *   POST /resolve-terabox          → resolve a TeraBox share URL → metadata + proxy URL
 *   GET  /resolve-terabox/proxy    → stream proxy: fetch from TeraBox & relay bytes to browser
 *
 * Implements Upstash Redis caching (8h TTL) on the resolve route.
 * The proxy route injects Referer + User-Agent to bypass TeraBox anti-hotlink.
 */

import { resolveTeraBoxLink } from './parser.ts';

// ─── Upstash Redis helpers ───

const UPSTASH_URL   = Deno.env.get('UPSTASH_REDIS_REST_URL') ?? '';
const UPSTASH_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ?? '';
const CACHE_TTL     = 8 * 60 * 60; // 8 hours in seconds

async function md5(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const buf  = await crypto.subtle.digest('MD5', data);
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function redisGet(key: string): Promise<string | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res  = await fetch(`${UPSTASH_URL}/get/${key}`, { headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` } });
    const data = await res.json();
    return data.result ?? null;
  } catch { return null; }
}

async function redisSet(key: string, value: string, ttl: number): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    await fetch(`${UPSTASH_URL}/set/${key}/${encodeURIComponent(value)}/ex/${ttl}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
  } catch { /* silent — cache write is non-critical */ }
}

// ─── CORS headers ───

const CORS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function corsOk() {
  return new Response('ok', { headers: CORS });
}

function jsonError(msg: string, status = 400) {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

// ─── TeraBox spoofed request headers ───

const TERABOX_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Referer':    'https://www.terabox.com/',
  'Origin':     'https://www.terabox.com',
};

// ─── Proxy route handler ───

/**
 * GET /resolve-terabox/proxy?fs_id=...&uk=...&shareid=...&sign=...
 *
 * 1. Uses the file tokens to call TeraBox's filemetas API to get the real dlink.
 * 2. Fetches the dlink with spoofed headers.
 * 3. Streams the response body back to the browser.
 */
async function handleProxy(req: Request): Promise<Response> {
  const url        = new URL(req.url);
  const fs_id      = url.searchParams.get('fs_id');
  const uk         = url.searchParams.get('uk');
  const shareid    = url.searchParams.get('shareid');
  const sign       = url.searchParams.get('sign');
  const ndusCookie = Deno.env.get('TERABOX_NDUS_COOKIE') ?? '';

  if (!fs_id || !uk || !shareid || !sign) {
    return jsonError('Missing required proxy parameters: fs_id, uk, shareid, sign');
  }

  // Handle Range requests for seeking
  const rangeHeader = req.headers.get('Range');

  try {
    // ── Step 1: Get the real download link via filemetas API ──
    const metaUrl = new URL('https://www.terabox.com/api/filemetas');
    metaUrl.searchParams.set('target', JSON.stringify([`//${fs_id}`]));
    metaUrl.searchParams.set('dlink', '1');
    metaUrl.searchParams.set('uk', uk);
    metaUrl.searchParams.set('shareid', shareid);
    metaUrl.searchParams.set('sign', sign);

    const metaResp = await fetch(metaUrl.toString(), {
      headers: {
        ...TERABOX_HEADERS,
        ...(ndusCookie ? { 'Cookie': `ndus=${ndusCookie}` } : {}),
        'Accept': 'application/json',
      },
    });

    if (!metaResp.ok) {
      return jsonError(`TeraBox filemetas returned HTTP ${metaResp.status}`, 502);
    }

    const meta = await metaResp.json();
    const dlink: string | undefined = meta?.info?.[0]?.dlink;

    if (!dlink) {
      // Fallback: try direct path construction (older API format)
      console.warn('[PROXY] No dlink in filemetas response — trying direct path');
      return jsonError('Could not retrieve download link from TeraBox. The ndus cookie may be expired.', 502);
    }

    console.log(`[PROXY] Fetching dlink for fs_id=${fs_id}`);

    // ── Step 2: Fetch the actual media stream from TeraBox ──
    const mediaResp = await fetch(dlink, {
      headers: {
        ...TERABOX_HEADERS,
        ...(ndusCookie ? { 'Cookie': `ndus=${ndusCookie}` } : {}),
        ...(rangeHeader ? { 'Range': rangeHeader } : {}),
        'Accept': '*/*',
      },
      // Follow redirects — TeraBox uses multi-hop CDN redirects
      redirect: 'follow',
    });

    if (!mediaResp.ok && mediaResp.status !== 206) {
      return jsonError(`TeraBox CDN returned HTTP ${mediaResp.status}`, 502);
    }

    // ── Step 3: Relay response headers + stream body to browser ──
    const forwardHeaders: Record<string, string> = { ...CORS };

    const headersToForward = [
      'content-type', 'content-length', 'content-range',
      'accept-ranges', 'last-modified', 'etag',
    ];

    for (const h of headersToForward) {
      const val = mediaResp.headers.get(h);
      if (val) forwardHeaders[h] = val;
    }

    // Ensure browser can seek via byte-range
    forwardHeaders['accept-ranges'] = 'bytes';

    return new Response(mediaResp.body, {
      status: mediaResp.status,
      headers: forwardHeaders,
    });
  } catch (err) {
    console.error('[PROXY ERROR]', err);
    return jsonError(`Proxy error: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
  }
}

// ─── Resolve route handler ───

async function handleResolve(req: Request): Promise<Response> {
  if (req.method !== 'POST') {
    return jsonError('Method not allowed', 405);
  }

  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return jsonError('Invalid JSON body');
  }

  const { url } = body;
  if (!url || typeof url !== 'string') {
    return jsonError('Missing or invalid "url" in request body');
  }

  // Derive the base URL for building proxy URLs in the parser
  const reqUrl  = new URL(req.url);
  const edgeBase = `${reqUrl.origin}${reqUrl.pathname.replace(/\/[^/]*$/, '')}`;

  // ── Cache check ──
  const cacheKey = `terabox:${await md5(url)}`;
  const cached   = await redisGet(cacheKey);

  if (cached) {
    console.log(`[CACHE HIT] ${cacheKey}`);
    return new Response(cached, {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
    });
  }

  // ── Cache miss: resolve via parser ──
  console.log(`[CACHE MISS] ${cacheKey} — resolving...`);
  try {
    const result  = await resolveTeraBoxLink(url, edgeBase);
    const payload = JSON.stringify(result);

    await redisSet(cacheKey, payload, CACHE_TTL);

    return new Response(payload, {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('[RESOLVE ERROR]', err);
    return jsonError(`Resolution failed: ${err instanceof Error ? err.message : 'Unknown'}`, 500);
  }
}

// ─── Main handler ───

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') return corsOk();

  const pathname = new URL(req.url).pathname;

  // Route: GET .../proxy → stream proxy
  if (req.method === 'GET' && pathname.endsWith('/proxy')) {
    return handleProxy(req);
  }

  // Route: POST ... → resolve TeraBox link
  return handleResolve(req);
});
