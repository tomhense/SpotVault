import '../components/navbar.js';
import { currentToken, redirectToSpotifyAuthorize, tryFetchAndHandleAuthCode, tryRefreshToken } from '../auth.js';

const statusEl = document.querySelector('[data-status]');
const loginButton = document.querySelector('[data-action="login"]');
const backupLink = document.querySelector('[data-link="backup"]');
const restoreLink = document.querySelector('[data-link="restore"]');

async function initialise() {
  if (!statusEl || !loginButton || !backupLink || !restoreLink) return;

  setStatus('Checking Spotify session…');
  try {
    const handled = await tryFetchAndHandleAuthCode();
    if (!handled) {
      await tryRefreshToken();
    }
  } catch (error) {
    console.error('Auth initialisation failed', error);
    setStatus('Could not verify Spotify authentication. Please login again.', true);
    toggleLoggedInState(false);
    return;
  }

  toggleLoggedInState(currentToken.notNull);
}

function toggleLoggedInState(isLoggedIn) {
  if (isLoggedIn) {
    loginButton.hidden = true;
    backupLink.hidden = false;
    restoreLink.hidden = false;
    setStatus('You are logged in. Start by creating a backup or loading one.', false);
  } else {
    loginButton.hidden = false;
    backupLink.hidden = true;
    restoreLink.hidden = true;
    setStatus('Login with your Spotify account to manage backups.', false);
  }
}

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.hidden = !message;
  statusEl.classList.toggle('error', isError);
}

if (loginButton) {
  loginButton.addEventListener('click', () => {
    redirectToSpotifyAuthorize();
  });
}

initialise();
