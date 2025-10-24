import { defineEventHandler, getCookie, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'battlenet_token') as string | undefined;
  if (!token) {
    return { authenticated: false };
  }

  // get runtime config (nuxt auto-import)
  const config = useRuntimeConfig();
  const region = config.battlenetRegion || 'eu';
  const userinfoUrl = `https://${region}.battle.net/oauth/userinfo`;

  // helper: fetch with timeout and better error messages
  const safeFetch = async (url: string, opts: RequestInit = {}, ms = 10000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
      const res = await globalThis.fetch(url, { ...opts, signal: controller.signal });
      return res;
    } catch (err: any) {
      const name = err?.name ?? '';
      const msg = name === 'AbortError' ? 'Request timed out' : `Network error: ${err?.message ?? String(err)}`;
      throw createError({ statusCode: 502, statusMessage: `Failed to fetch userinfo: ${msg}` });
    } finally {
      clearTimeout(timeout);
    }
  };

  try {
    const res = await safeFetch(userinfoUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) {
      // token invalid/expired
      return { authenticated: false };
    }
    const profile = await res.json().catch(() => ({}));
    // return minimal profile to client
    return { authenticated: true, profile };
  } catch (err: any) {
    // safeFetch already converts some errors to createError; rethrow so Nuxt handles properly
    throw err;
  }
});
