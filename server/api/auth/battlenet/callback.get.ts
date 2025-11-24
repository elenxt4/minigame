import { defineEventHandler, getQuery, sendRedirect, createError, setCookie, getCookie, deleteCookie } from 'h3';

export default defineEventHandler(async (event) => {
  try {
    const config = useRuntimeConfig();
    const query = getQuery(event) as Record<string, any>;
  const code = query.code as string | undefined;
  const state = query.state as string | undefined;
  const storedState = getCookie(event, 'battlenet_oauth_state') as string | undefined;
  if (!state || !storedState || state !== storedState) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid or missing state parameter' });
  }
  // state validated — remove cookie
  deleteCookie(event, 'battlenet_oauth_state');
  if (!code) {
    throw createError({ statusCode: 400, statusMessage: 'Missing code' });
  }

const base = (config.public.baseURL || 'https://minigame-gules.vercel.app').replace(/\/$/, '');
  const region = config.battlenetRegion || 'eu';
  const tokenUrl = `https://${region}.battle.net/oauth/token`;
  const redirectUri = `${base}/api/auth/battlenet/callback`;

  // Buffer is available at runtime in Node. TypeScript may complain in some setups; ignore the type here.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const basicAuth = Buffer.from(`${config.battlenetClientId}:${config.battlenetClientSecret}`).toString('base64');

  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', code);
  params.append('redirect_uri', redirectUri);

  // helper safeFetch with timeout to avoid premature-close stream errors
  const safeFetch = async (url: string, opts: RequestInit = {}, ms = 10000) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), ms);
    try {
      const res = await globalThis.fetch(url, { ...opts, signal: controller.signal });
      return res;
    } catch (err: any) {
      const name = err?.name ?? '';
      const msg = name === 'AbortError' ? 'Token exchange timed out' : `Token exchange network error: ${err?.message ?? String(err)}`;
      throw createError({ statusCode: 502, statusMessage: msg });
    } finally {
      clearTimeout(timeout);
    }
  };

  let tokenRes: Response;
  tokenRes = await safeFetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basicAuth}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: params.toString()
  }, 10000);

  if (!tokenRes.ok) {
    const txt = await tokenRes.text().catch(() => 'unable to read response body');
    throw createError({ statusCode: 502, statusMessage: `Token exchange failed: ${txt}` });
  }

  // read text first and parse safely to avoid stream/json parsing errors when the
  // remote connection closes unexpectedly (this caused 'premature close' in dev)
  const tokenText = await tokenRes.text().catch(() => null);
  if (!tokenText) {
    throw createError({ statusCode: 502, statusMessage: 'Token exchange returned empty body' });
  }
  let tokenJson: any;
  try {
    tokenJson = JSON.parse(tokenText);
  } catch (err: any) {
    throw createError({ statusCode: 502, statusMessage: `Token exchange returned invalid JSON: ${err?.message ?? String(err)}` });
  }
  const accessToken = tokenJson.access_token as string;
  const expiresIn = tokenJson.expires_in as number | undefined;
  // Store token in httpOnly cookie
  setCookie(event, 'battlenet_token', accessToken, {
    httpOnly: true,
    secure: (globalThis as any).process?.env?.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: expiresIn ?? 3600
  });

  // Development-only: log token JSON and set a non-httpOnly debug cookie so you can inspect it in the browser
  try {
    const nodeEnv = (globalThis as any).process?.env?.NODE_ENV || 'development';
    // eslint-disable-next-line no-console
    console.log('[api/auth/battlenet/callback] token response:', JSON.stringify(tokenJson));
    if (nodeEnv !== 'production') {
      // Add a visible cookie for debugging (remove later) so DevTools shows the token value
      setCookie(event, 'battlenet_token_debug', accessToken, {
        httpOnly: false,
        secure: false,
        sameSite: 'lax',
        maxAge: expiresIn ?? 3600
      });
    }
  } catch (e) {
    // ignore logging errors
  }
    return sendRedirect(event, '/dashboard');
  } catch (err: any) {
    // Log full stack to help debug stream/premature-close issues
    // eslint-disable-next-line no-console
    console.error('[api/auth/battlenet/callback] error:', err && err.stack ? err.stack : err);
    throw err;
  }
});
