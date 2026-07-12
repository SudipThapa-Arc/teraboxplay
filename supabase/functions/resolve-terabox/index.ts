/**
 * resolve-terabox/index.ts — Deno Edge Function
 *
 * Handles POST requests containing a TeraBox URL.
 * Implements Upstash Redis caching with MD5 hash keys and 8-hour TTL.
 * Falls back to parser.ts for cache misses.
 */

import { resolveTeraBoxLink } from './parser.ts';

// ─── Upstash Redis helpers ───

const UPSTASH_URL = Deno.env.get('UPSTASH_REDIS_REST_URL') ?? '';
const UPSTASH_TOKEN = Deno.env.get('UPSTASH_REDIS_REST_TOKEN') ?? '';
const CACHE_TTL_SECONDS = 8 * 60 * 60; // 8 hours

async function md5(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('MD5', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function redisGet(key: string): Promise<string | null> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return null;
  try {
    const res = await fetch(`${UPSTASH_URL}/get/${key}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
    const data = await res.json();
    return data.result ?? null;
  } catch {
    return null;
  }
}

async function redisSet(key: string, value: string, ttl: number): Promise<void> {
  if (!UPSTASH_URL || !UPSTASH_TOKEN) return;
  try {
    await fetch(`${UPSTASH_URL}/set/${key}/${encodeURIComponent(value)}/ex/${ttl}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
    });
  } catch {
    // Silent fail on cache write — non-critical
  }
}

// ─── CORS headers ───

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ─── Handler ───

Deno.serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const { url } = await req.json();

    if (!url || typeof url !== 'string') {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid "url" in request body' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // ─── Cache check ───
    const cacheKey = `terabox:${await md5(url)}`;
    const cached = await redisGet(cacheKey);

    if (cached) {
      console.log(`[CACHE HIT] ${cacheKey}`);
      return new Response(cached, {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' },
      });
    }

    // ─── Cache miss: resolve via parser ───
    console.log(`[CACHE MISS] ${cacheKey} — resolving...`);
    const result = await resolveTeraBoxLink(url);
    const payload = JSON.stringify(result);

    // Write to Redis with 8h TTL
    await redisSet(cacheKey, payload, CACHE_TTL_SECONDS);

    return new Response(payload, {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'MISS' },
    });
  } catch (err) {
    console.error('[ERROR]', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
