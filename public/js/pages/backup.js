import '../components/navbar.js';
import { currentToken, tryRefreshToken } from '../auth.js';
import Backup from '../backup.js';

const statusEl = document.querySelector('[data-status]');
const progressEl = document.querySelector('[data-progress]');
const librarySection = document.querySelector('[data-library-options]');
const playlistSections = document.querySelector('[data-playlist-sections]');
const ownList = document.querySelector('[data-list="own"]');
const followedList = document.querySelector('[data-list="followed"]');
const backupButton = document.querySelector('[data-action="backup"]');
const backButton = document.querySelector('[data-action="back-home"]');

const backupOptions = {
  backupSavedTracks: false,
  backupSavedAlbums: false,
  backupFollowedArtists: false,
  checkedPlaylistsIds: [],
  checkedFollowedPlaylistsIds: []
};

let backupInstance;

async function initialise() {
  if (!statusEl || !backupButton) return;
  setStatus('Preparing SpotVault…');
  try {
    await tryRefreshToken();
  } catch (error) {
    console.error('Auth refresh failed', error);
  }

  if (!currentToken.notNull) {
    setStatus('Session expired. Redirecting to login…', true);
    window.location.href = '/';
    return;
  }

  backupInstance = new Backup((status) => updateProgress(status));
  try {
    setStatus('Fetching your playlists…');
    await backupInstance.shallowFetch();
  } catch (error) {
    console.error('Failed to fetch playlists', error);
    setStatus('Could not fetch playlists. Please try again or re-login.', true);
    return;
  }

  renderLibraryOptions();
  renderPlaylists();
  setStatus('Select what you want to include in this backup.');
  backupButton.disabled = false;
}

function renderLibraryOptions() {
  if (!librarySection) return;
  librarySection.hidden = false;
  const libraryList = librarySection.querySelector('[data-section="library"]');
  if (!libraryList) return;

  libraryList.addEventListener('change', (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    switch (event.target.dataset.option) {
      case 'saved-tracks':
        backupOptions.backupSavedTracks = event.target.checked;
        break;
      case 'saved-albums':
        backupOptions.backupSavedAlbums = event.target.checked;
        break;
      case 'followed-artists':
        backupOptions.backupFollowedArtists = event.target.checked;
        break;
      default:
        break;
    }
  });
}

function renderPlaylists() {
  if (!playlistSections || !ownList || !followedList) return;
  playlistSections.hidden = false;

  populatePlaylistList(ownList, backupInstance.playlists, backupOptions.checkedPlaylistsIds);
  populatePlaylistList(followedList, backupInstance.followed_playlists, backupOptions.checkedFollowedPlaylistsIds);
}

function populatePlaylistList(listEl, playlists, targetArray) {
  listEl.innerHTML = '';
  if (!playlists.length) {
    const li = document.createElement('li');
    li.textContent = 'No playlists available.';
    listEl.appendChild(li);
    return;
  }

  playlists
    .slice()
    .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
    .forEach((playlist) => {
      const li = document.createElement('li');
      const label = document.createElement('label');
      const input = document.createElement('input');
      input.type = 'checkbox';
      input.dataset.id = playlist.id;
      input.dataset.label = playlist.name ?? 'Untitled playlist';
      input.addEventListener('change', () => {
        updateSelection(targetArray, playlist.id, input.checked);
      });
      const span = document.createElement('span');
      span.textContent = playlist.name ?? 'Untitled playlist';
      label.appendChild(input);
      label.appendChild(span);
      li.appendChild(label);
      listEl.appendChild(li);
    });
}

function updateSelection(targetArray, playlistId, checked) {
  const index = targetArray.indexOf(playlistId);
  if (checked && index === -1) {
    targetArray.push(playlistId);
  } else if (!checked && index >= 0) {
    targetArray.splice(index, 1);
  }
}

function setStatus(message, isError = false) {
  statusEl.hidden = !message;
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

function updateProgress(message) {
  if (!progressEl) return;
  progressEl.hidden = !message;
  progressEl.textContent = message ? `Status: ${message}` : '';
}

if (backupButton) {
  backupButton.addEventListener('click', async () => {
    if (!backupInstance) return;
    backupButton.disabled = true;
    backButton.disabled = true;
    setStatus('Creating backup. This might take a moment…');
    try {
      await backupInstance.createBackup({ ...backupOptions });
      await backupInstance.downloadZip();
      setStatus('Backup ready! Your download should start automatically.');
    } catch (error) {
      console.error('Backup failed', error);
      setStatus('Backup failed. Please retry or check the console.', true);
    } finally {
      backupButton.disabled = false;
      if (backButton) backButton.disabled = false;
    }
  });
}

if (backButton) {
  backButton.addEventListener('click', () => {
    window.location.href = '/';
  });
}

initialise();
