import { defineEventHandler, getCookie, createError } from 'h3';

export default defineEventHandler(async (event) => {
  const token = getCookie(event, 'battlenet_token') as string | undefined;
  if (!token) return createError({ statusCode: 401, statusMessage: 'Not authenticated' });

  // Get user profile from Battle.net userinfo
  const config = useRuntimeConfig();
  const region = config.battlenetRegion || 'eu';
  const userinfoUrl = `https://${region}.battle.net/oauth/userinfo`;

  try {
    const res = await globalThis.fetch(userinfoUrl, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return { authenticated: false };
    const profile = await res.json();
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
    throw createError({ statusCode: 502, statusMessage: `Failed to fetch userinfo: ${err?.message ?? String(err)}` });
  }
});
