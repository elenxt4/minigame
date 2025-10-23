import { defineEventHandler, getQuery, sendRedirect, createError, setCookie, getCookie, deleteCookie } from 'h3';

export default defineEventHandler(async (event) => {
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

  const base = config.public.baseURL || 'http://localhost:3000';
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

  // Use AbortController to timeout the token exchange in case the remote closes early
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  let tokenRes: Response;
  try {
    tokenRes = await globalThis.fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString(),
      signal: controller.signal
    });
  } catch (err: any) {
    // Abort or network errors can cause premature close; return a 502 with details
    const msg = err?.name === 'AbortError' ? 'Token exchange timed out' : `Token exchange network error: ${err?.message ?? String(err)}`;
    throw createError({ statusCode: 502, statusMessage: msg });
  } finally {
    clearTimeout(timeout);
  }

  if (!tokenRes.ok) {
    const txt = await tokenRes.text().catch(() => 'unable to read response body');
    throw createError({ statusCode: 502, statusMessage: `Token exchange failed: ${txt}` });
  }

  const tokenJson = await tokenRes.json();
  const accessToken = tokenJson.access_token as string;
  const expiresIn = tokenJson.expires_in as number | undefined;

  // Store token in httpOnly cookie
  setCookie(event, 'battlenet_token', accessToken, {
    httpOnly: true,
    secure: (globalThis as any).process?.env?.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: expiresIn ?? 3600
  });

  return sendRedirect(event, '/dashboard');
});
