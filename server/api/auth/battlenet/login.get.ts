import { defineEventHandler, sendRedirect, setCookie } from 'h3';
import { useRuntimeConfig } from '#imports';

function generateState(len = 24) {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

export default defineEventHandler((event) => {
  const config = useRuntimeConfig();
  const clientId = config.battlenetClientId;
  const base = config.public.baseURL || 'http://localhost:3000';
  const region = config.battlenetRegion || 'eu';

  const redirectUri = `${base}/api/auth/battlenet/callback`;
  const state = generateState();
  // store state in a secure cookie to validate in callback
  setCookie(event, 'battlenet_oauth_state', state, { httpOnly: true, sameSite: 'lax' });

  const authorizeUrl = `https://${region}.battle.net/oauth/authorize?response_type=code&client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent('openid')}&state=${encodeURIComponent(state)}`;

  return sendRedirect(event, authorizeUrl);
});
