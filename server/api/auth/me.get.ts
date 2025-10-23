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

  try {
    const res = await globalThis.fetch(userinfoUrl, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!res.ok) {
      // token invalid/expired
      return { authenticated: false };
    }
    const profile = await res.json();
    // return minimal profile to client
    return { authenticated: true, profile };
  } catch (err: any) {
    throw createError({ statusCode: 502, statusMessage: `Failed to fetch userinfo: ${err?.message ?? String(err)}` });
  }
});
