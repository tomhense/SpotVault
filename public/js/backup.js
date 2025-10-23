import JSZip from 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm';
import { APP_VERSION } from './constants.js';
import {
  getFollowedArtists,
  getPlaylists,
  getSavedAlbums,
  getSavedTracks,
  getCurrentUser,
  getPlaylist
} from './spotifyApi.js';

export class Backup {
  constructor(onBackupStatusChange = () => {}) {
    this.metadata = {
      timestamp: Date.now(),
      version: APP_VERSION,
      user: {
        id: '',
        display_name: ''
      }
    };
    this.playlists = [];
    this.followed_playlists = [];
    this.saved_tracks = [];
    this.saved_albums = [];
    this.followed_artists = [];
    this.images = [];
    this.status = 'empty';
    this.mutex_lock = false;
    this.onBackupStatusChange = onBackupStatusChange;
  }

  changeStatus(status) {
    this.status = status;
    this.onBackupStatusChange(status);
  }

  async shallowFetch() {
    if (this.mutex_lock) throw new Error('Backup is locked');
    if (this.status !== 'empty') {
      throw new Error('Backup is not empty. Please create a new instance.');
    }
    this.mutex_lock = true;

    const user = await getCurrentUser();
    this.metadata.user = {
      id: user.id ?? '',
      display_name: user.display_name ?? ''
    };

    const playlists = await getPlaylists();
    this.playlists = playlists.filter((playlist) => playlist.owner?.id === this.metadata.user.id);
    this.followed_playlists = playlists.filter((playlist) => playlist.owner?.id !== this.metadata.user.id);

    this.changeStatus('shallow');
    this.mutex_lock = false;
  }

  async createBackup(backupOptions) {
    if (this.mutex_lock) throw new Error('Backup is locked');
    if (this.status === 'full') {
      console.warn('Backup is already full. Replacing existing data.');
    } else if (this.status !== 'shallow') {
      throw new Error('Backup is not shallow. Please run shallowFetch() first.');
    }
    this.mutex_lock = true;

    this.metadata.timestamp = Date.now();
    this.metadata.version = APP_VERSION;

    const tasks = [];

    if (backupOptions.backupSavedTracks) {
      tasks.push(
        getSavedTracks().then((tracks) => {
          this.saved_tracks = tracks;
        })
      );
    } else {
      this.saved_tracks = [];
    }

    if (backupOptions.backupSavedAlbums) {
      tasks.push(
        getSavedAlbums().then((albums) => {
          this.saved_albums = albums;
        })
      );
    } else {
      this.saved_albums = [];
    }

    if (backupOptions.backupFollowedArtists) {
      tasks.push(
        getFollowedArtists().then((artists) => {
          this.followed_artists = artists;
        })
      );
    } else {
      this.followed_artists = [];
    }

    await Promise.all(tasks);

    for (const playlist of this.playlists) {
      if (backupOptions.checkedPlaylistsIds.includes(playlist.id)) {
        const fullPlaylist = await getPlaylist(playlist.id);
        playlist.tracks = fullPlaylist.tracks;
      }
    }
    for (const playlist of this.followed_playlists) {
      if (backupOptions.checkedFollowedPlaylistsIds.includes(playlist.id)) {
        const fullPlaylist = await getPlaylist(playlist.id);
        playlist.tracks = fullPlaylist.tracks;
      }
    }

    const fetchPlaylistImages = async (playlist) => {
      if (!playlist.images || !playlist.images.length) return;
      const url = playlist.images[0].url;
      if (!url) return;
      const slug = this.getLastPathSegment(url);
      if (!slug) return;
      const filename = `${slug}.jpg`;
      try {
        const response = await fetch(url);
        const blob = await response.blob();
        this.images.push(new File([blob], filename));
      } catch (error) {
        console.error('Error downloading playlist image', error);
      }
    };

    await Promise.allSettled(this.playlists.map((playlist) => fetchPlaylistImages(playlist)));
    await Promise.allSettled(this.followed_playlists.map((playlist) => fetchPlaylistImages(playlist)));
    this.changeStatus('full');
    this.mutex_lock = false;
  }

  downloadBlob(blob, filename) {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  }

  localIsoDateString(date) {
    return date.toLocaleString('sv').replace(' ', 'T').replace(':', '-');
  }

  getLastPathSegment(url) {
    try {
      const urlObj = new URL(url);
      const segments = urlObj.pathname.split('/').filter((segment) => segment.length > 0);
      return segments[segments.length - 1] || '';
    } catch (error) {
      console.error('Invalid URL:', error);
      return '';
    }
  }

  async downloadZip() {
    if (this.status !== 'full') {
      throw new Error('Backup is not complete. Please run createBackup() first.');
    }

    const zip = new JSZip();
    zip.file('metadata.json', JSON.stringify(this.metadata, null, 2));
    zip.file('playlists.json', JSON.stringify(this.playlists, null, 2));
    zip.file('followed_playlists.json', JSON.stringify(this.followed_playlists, null, 2));
    zip.file('saved_tracks.json', JSON.stringify(this.saved_tracks, null, 2));
    zip.file('saved_albums.json', JSON.stringify(this.saved_albums, null, 2));
    zip.file('followed_artists.json', JSON.stringify(this.followed_artists, null, 2));
    const imagesFolder = zip.folder('images');

    this.images.forEach((image) => {
      imagesFolder.file(image.name, image);
    });

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 9 } });
    const filename = `SpotVault_backup_${this.localIsoDateString(new Date(this.metadata.timestamp))}.zip`;
    this.downloadBlob(blob, filename);
  }

  static async fromZip(file) {
    const loader = new JSZip();
    const backup = new Backup();
    const content = await loader.loadAsync(file);
    const metadataRaw = await content.file('metadata.json')?.async('string');
    if (!metadataRaw) {
      throw new Error('Invalid backup file: metadata missing');
    }
    backup.metadata = JSON.parse(metadataRaw);
    if (backup.metadata.version > APP_VERSION) {
      throw new Error('Backup file was created with a newer SpotVault version.');
    }

    const parseJson = async (path, fallback = []) => {
      const fileEntry = content.file(path);
      if (!fileEntry) return fallback;
      const raw = await fileEntry.async('string');
      try {
        return JSON.parse(raw);
      } catch (error) {
        console.error(`Failed parsing ${path}`, error);
        return fallback;
      }
    };

    backup.playlists = await parseJson('playlists.json');
    backup.followed_playlists = await parseJson('followed_playlists.json');
    backup.saved_tracks = await parseJson('saved_tracks.json');
    backup.saved_albums = await parseJson('saved_albums.json');
    backup.followed_artists = await parseJson('followed_artists.json');

    const imagesFolder = content.folder('images');
    if (imagesFolder) {
      const files = Object.keys(imagesFolder.files).filter((key) => key.startsWith('images/'));
      await Promise.allSettled(
        files.map(async (key) => {
          const entry = content.file(key);
          if (!entry) return;
          const blob = await entry.async('blob');
          const filename = key.replace('images/', '');
          backup.images.push(new File([blob], filename));
        })
      );
    }

    backup.changeStatus('full');
    return backup;
  }

  async restoreBackup(_backupOptions) {
    // TODO: Implement restore logic against Spotify APIs
    // Kept as a stub to match previous project behaviour.
  }
}

export default Backup;
