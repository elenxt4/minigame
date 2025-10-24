import { defineEventHandler, getCookie, createError } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const token = getCookie(event, 'battlenet_token') as string | undefined;
    if (!token) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' });

    // Get user profile from Battle.net userinfo
    const config = useRuntimeConfig();
    const region = config.battlenetRegion || 'eu';
    const userinfoUrl = `https://${region}.battle.net/oauth/userinfo`;

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

    const res = await safeFetch(userinfoUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { authenticated: false };
    const profile = await res.json().catch(() => ({}));
    const userId = profile.id || profile.sub || profile.user_id || profile.battletag || JSON.stringify(profile);

    // simple in-memory store on globalThis for dev (not persistent)
    // shape: { [userId]: { gamesPlayed, wins, highScore } }
    (globalThis as any).__MINIGAME_STATS = (globalThis as any).__MINIGAME_STATS || {};
    const store = (globalThis as any).__MINIGAME_STATS;
    if (!store[userId]) {
      store[userId] = { gamesPlayed: 0, wins: 0, highScore: 0 };
    }

    return { authenticated: true, profile, stats: store[userId] };
  } catch (err: any) {
    // log and rethrow so full stack appears in console
    // eslint-disable-next-line no-console
    console.error('[api/user/stats.get] error:', err && err.stack ? err.stack : err);
    throw err;
  }
});
