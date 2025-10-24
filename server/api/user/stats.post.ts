import { defineEventHandler, readBody, getCookie, createError } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const token = getCookie(event, 'battlenet_token') as string | undefined;
    if (!token) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' });

    const body = await readBody(event) as Record<string, any>;

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
    if (!res.ok) throw createError({ statusCode: 401, statusMessage: 'Invalid token' });
    const profile = await res.json().catch(() => ({}));
    const userId = profile.id || profile.sub || profile.user_id || profile.battletag || JSON.stringify(profile);

    (globalThis as any).__MINIGAME_STATS = (globalThis as any).__MINIGAME_STATS || {};
    const store = (globalThis as any).__MINIGAME_STATS;
    if (!store[userId]) store[userId] = { gamesPlayed: 0, wins: 0, highScore: 0 };

    // body can contain increments or absolute values
    if (body.increment) {
      const inc = body.increment;
      if (inc.gamesPlayed) store[userId].gamesPlayed += Number(inc.gamesPlayed);
      if (inc.wins) store[userId].wins += Number(inc.wins);
      if (inc.highScore) store[userId].highScore = Math.max(store[userId].highScore, Number(inc.highScore));
    }

    if (body.set) {
      const s = body.set;
      if (s.gamesPlayed !== undefined) store[userId].gamesPlayed = Number(s.gamesPlayed);
      if (s.wins !== undefined) store[userId].wins = Number(s.wins);
      if (s.highScore !== undefined) store[userId].highScore = Number(s.highScore);
    }

    return { success: true, stats: store[userId] };
  } catch (err: any) {
    // log and rethrow with stacktrace for debugging
    // eslint-disable-next-line no-console
    console.error('[api/user/stats.post] error:', err && err.stack ? err.stack : err);
    throw err;
  }
});
