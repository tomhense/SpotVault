import '../components/navbar.js';
import { currentToken, tryRefreshToken } from '../auth.js';
import Backup from '../backup.js';

const statusEl = document.querySelector('[data-status]');
const dropzone = document.querySelector('[data-dropzone]');
const fileInput = document.querySelector('[data-file-input]');
const browseButton = document.querySelector('[data-action="browse"]');
const fileInfo = document.querySelector('[data-file-info]');
const metaBanner = document.querySelector('[data-meta]');
const librarySection = document.querySelector('[data-library-options]');
const playlistSections = document.querySelector('[data-playlist-sections]');
const ownList = document.querySelector('[data-list="own"]');
const followedList = document.querySelector('[data-list="followed"]');
const restoreButton = document.querySelector('[data-action="restore"]');
const backButton = document.querySelector('[data-action="back-home"]');

const restoreOptions = {
  backupSavedTracks: false,
  backupSavedAlbums: false,
  backupFollowedArtists: false,
  checkedPlaylistsIds: [],
  checkedFollowedPlaylistsIds: []
};

let backupInstance = null;

async function initialise() {
  if (!statusEl || !dropzone || !fileInput || !restoreButton) return;
  setStatus('Preparing restore workspace…');
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

  setStatus('Drop a SpotVault backup to begin.');
  attachDropzoneHandlers();
}

function attachDropzoneHandlers() {
  if (browseButton) {
    browseButton.addEventListener('click', () => fileInput.click());
  }

  fileInput.addEventListener('change', () => {
    const [file] = fileInput.files || [];
    if (file) {
      handleFile(file);
      fileInput.value = '';
    }
  });

  ['dragenter', 'dragover'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.add('drag-over');
    });
  });

  ['dragleave', 'dragend', 'drop'].forEach((eventName) => {
    dropzone.addEventListener(eventName, (event) => {
      event.preventDefault();
      dropzone.classList.remove('drag-over');
    });
  });

  dropzone.addEventListener('drop', (event) => {
    const files = event.dataTransfer?.files;
    if (!files || !files.length) return;
    const file = files[0];
    handleFile(file);
  });
}

async function handleFile(file) {
  setStatus(`Loading ${file.name}…`);
  restoreButton.disabled = true;
  try {
    backupInstance = await Backup.fromZip(file);
    backupInstance.onBackupStatusChange = (status) => setStatus(`Backup status: ${status}`);
    renderBackupContents();
    setStatus('Backup loaded. Choose what you would like to restore.');
    restoreButton.disabled = false;
  } catch (error) {
    console.error('Failed to load backup', error);
    setStatus('Could not read the backup. Make sure it was created with SpotVault.', true);
    restoreButton.disabled = true;
    if (fileInfo) {
      fileInfo.hidden = true;
    }
  }
}

function renderBackupContents() {
  if (!backupInstance || !fileInfo || !metaBanner || !librarySection || !playlistSections || !ownList || !followedList) {
    return;
  }

  fileInfo.hidden = false;
  const timestamp = backupInstance.metadata?.timestamp;
  const user = backupInstance.metadata?.user?.display_name || backupInstance.metadata?.user?.id || 'Unknown user';
  const createdAt = timestamp ? new Date(timestamp).toLocaleString() : 'Unknown date';
  metaBanner.textContent = `Backup created ${createdAt} for ${user}`;

  renderLibraryCheckboxes();
  renderPlaylistCheckboxes();
}

function renderLibraryCheckboxes() {
  if (!librarySection) return;
  librarySection.hidden = false;
  const savedTracks = backupInstance.saved_tracks?.length > 0;
  const savedAlbums = backupInstance.saved_albums?.length > 0;
  const followedArtists = backupInstance.followed_artists?.length > 0;
  const map = {
    'saved-tracks': savedTracks,
    'saved-albums': savedAlbums,
    'followed-artists': followedArtists
  };
  const libraryList = librarySection.querySelector('[data-section="library"]');
  if (!libraryList) return;

  libraryList.querySelectorAll('input[type="checkbox"]').forEach((input) => {
    const option = input.dataset.option;
    const available = option ? map[option] : false;
    input.checked = Boolean(available);
    input.disabled = !available;
    switch (option) {
      case 'saved-tracks':
        restoreOptions.backupSavedTracks = available;
        break;
      case 'saved-albums':
        restoreOptions.backupSavedAlbums = available;
        break;
      case 'followed-artists':
        restoreOptions.backupFollowedArtists = available;
        break;
      default:
        break;
    }
  });

  libraryList.onchange = (event) => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const { option } = event.target.dataset;
    if (!option) return;
    const value = event.target.checked;
    switch (option) {
      case 'saved-tracks':
        restoreOptions.backupSavedTracks = value;
        break;
      case 'saved-albums':
        restoreOptions.backupSavedAlbums = value;
        break;
      case 'followed-artists':
        restoreOptions.backupFollowedArtists = value;
        break;
      default:
        break;
    }
  };
}

function renderPlaylistCheckboxes() {
  if (!playlistSections || !ownList || !followedList) return;
  playlistSections.hidden = false;
  restoreOptions.checkedPlaylistsIds = [];
  restoreOptions.checkedFollowedPlaylistsIds = [];

  populatePlaylistList(ownList, backupInstance.playlists, restoreOptions.checkedPlaylistsIds, true);
  populatePlaylistList(followedList, backupInstance.followed_playlists, restoreOptions.checkedFollowedPlaylistsIds, true);
}

function populatePlaylistList(listEl, playlists, targetArray, defaultChecked) {
  listEl.innerHTML = '';
  if (!playlists?.length) {
    const li = document.createElement('li');
    li.textContent = 'No playlists included in this backup.';
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
      input.checked = Boolean(defaultChecked);
      if (defaultChecked) {
        targetArray.push(playlist.id);
      }
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

if (restoreButton) {
  restoreButton.addEventListener('click', async () => {
    if (!backupInstance) {
      setStatus('Load a backup before restoring.', true);
      return;
    }
    restoreButton.disabled = true;
    setStatus('Restore is not yet implemented. This feature will arrive in a future release.');
    try {
      await backupInstance.restoreBackup({ ...restoreOptions });
      alert('Restore flow is not implemented yet. Backup options were captured, but no changes were made.');
    } catch (error) {
      console.error('Restore failed', error);
      setStatus('Restore failed. Check the console for details.', true);
    } finally {
      restoreButton.disabled = false;
    }
  });
}

if (backButton) {
  backButton.addEventListener('click', () => {
    window.location.href = '/';
  });
}

function setStatus(message, isError = false) {
  if (!statusEl) return;
  statusEl.hidden = !message;
  statusEl.textContent = message;
  statusEl.classList.toggle('error', isError);
}

initialise();
