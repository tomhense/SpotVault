const clientId = '6f009299dfc74904993a1b595787371d';
const scope = [
  'playlist-read-private',
  'playlist-read-collaborative',
  'playlist-modify-private',
  'playlist-modify-public',
  'user-library-read',
  'user-follow-read'
].join(' ');

const authorizationEndpoint = 'https://accounts.spotify.com/authorize';
const tokenEndpoint = 'https://accounts.spotify.com/api/token';

function getRedirectUrl() {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.origin);
  url.pathname = '/';
  return url.toString().replace(/\/$/, '') + '/';
}

export const currentToken = {
  get access_token() {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('access_token');
    }
    return null;
  },
  get refresh_token() {
    if (typeof window !== 'undefined') {
      return window.localStorage.getItem('refresh_token');
    }
    return null;
  },
  get expires() {
    if (typeof window !== 'undefined') {
      const item = window.localStorage.getItem('expires');
      return item ? new Date(item) : null;
    }
    return null;
  },
  get isExpired() {
    const now = new Date();
    const expires = this.expires;
    return this.access_token !== null && expires !== null && now >= expires;
  },
  get notNull() {
    return this.access_token !== null && this.refresh_token !== null && this.expires !== null;
  },
  save(response) {
    if (typeof window === 'undefined') return;
    const { access_token, refresh_token, expires_in } = response;
    const expiry = new Date(Date.now() + expires_in * 1000);
    window.localStorage.setItem('access_token', access_token);
    if (refresh_token) {
      window.localStorage.setItem('refresh_token', refresh_token);
    }
    window.localStorage.setItem('expires_in', String(expires_in));
    window.localStorage.setItem('expires', expiry.toISOString());
  },
  clear() {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem('access_token');
    window.localStorage.removeItem('refresh_token');
    window.localStorage.removeItem('expires');
    window.localStorage.removeItem('expires_in');
    window.localStorage.removeItem('code_verifier');
  }
};

export async function tryFetchAndHandleAuthCode() {
  const args = new URLSearchParams(window.location.search);
  const code = args.get('code');
  if (!code) {
    return false;
  }
  const token = await getToken(code);
  if (!token || 'error' in token) {
    console.error('Error exchanging token', token);
    return false;
  }
  currentToken.save(token);
  const url = new URL(window.location.href);
  url.searchParams.delete('code');
  const updatedUrl = url.search ? url.href : url.href.replace('?', '');
  window.localStorage.removeItem('code_verifier');
  window.history.replaceState({}, document.title, updatedUrl);
  return true;
}

export async function redirectToSpotifyAuthorize() {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const randomValues = crypto.getRandomValues(new Uint8Array(64));
  const randomString = Array.from(randomValues).reduce((acc, x) => acc + possible[x % possible.length], '');
  const code_verifier = randomString;
  const data = new TextEncoder().encode(code_verifier);
  const hashed = await crypto.subtle.digest('SHA-256', data);
  const code_challenge_base64 = btoa(String.fromCharCode(...new Uint8Array(hashed)))
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
  window.localStorage.setItem('code_verifier', code_verifier);
  const redirectUrl = getRedirectUrl();
  const authUrl = new URL(authorizationEndpoint);
  const params = {
    response_type: 'code',
    client_id: clientId,
    scope,
    code_challenge_method: 'S256',
    code_challenge: code_challenge_base64,
    redirect_uri: redirectUrl
  };
  authUrl.search = new URLSearchParams(params).toString();
  window.location.href = authUrl.toString();
}

async function getToken(code) {
  const code_verifier = window.localStorage.getItem('code_verifier') ?? '';
  const redirectUrl = getRedirectUrl();
  const response = await fetch(tokenEndpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: new URLSearchParams({
      client_id: clientId,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUrl,
      code_verifier
    })
  });
  return response.json();
}

async function refreshTokenInternal() {
  const refresh_token = currentToken.refresh_token ?? '';
  if (!refresh_token) {
    return null;
  }
  try {
    const response = await fetch(tokenEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        client_id: clientId,
        grant_type: 'refresh_token',
        refresh_token
      })
    });
    return response.json();
  } catch (error) {
    console.error('Error refreshing token:', error);
    return null;
  }
}

export async function tryRefreshToken() {
  if (!currentToken.notNull) {
    return;
  }
  if (currentToken.isExpired) {
    const token = await refreshTokenInternal();
    if (token && !('error' in token)) {
      currentToken.save(token);
    } else {
      console.error('Failed to refresh token:', token);
      logout();
    }
  }
}

export function logout() {
  currentToken.clear();
  window.location.href = '/';
}
