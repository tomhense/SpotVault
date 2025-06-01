import JSZip from "jszip";
import { components } from "../types/spotify_api.d";
import { getFollowedArtists, getPlaylists, getSavedAlbums, getSavedTracks, getCurrentUser, getPlaylist } from "./spotify_api";
import { version } from "../../package.json";

export interface BackupOptions {
	backupSavedTracks: boolean;
	backupSavedAlbums: boolean;
	backupFollowedArtists: boolean;
	checkedPlaylistsIds: string[];
	checkedFollowedPlaylistsIds: string[];
}
export default class Backup {
	metadata: {
		timestamp: number; // Timestamp of the backup creation in milliseconds
		version: string; // Version of the backup
		user: {
			id: string;
			display_name: string;
		};
	};
	playlists: components["schemas"]["SimplifiedPlaylistObject"][];
	followed_playlists: components["schemas"]["SimplifiedPlaylistObject"][];
	saved_tracks: components["schemas"]["SavedTrackObject"][];
	saved_albums: components["schemas"]["SavedAlbumObject"][];
	followed_artists: components["schemas"]["SimplifiedArtistObject"][];
	images: File[];
	status: string; // "empty" | "shallow" | "full"
	mutex_lock: boolean; // Prevents multiple calls to shallowFetch() and createBackup() at the same time
	onBackupStatusChange: (status: string) => void; // Callback function to notify about backup status changes

	constructor(onBackupStatusChange: (status: string) => void = () => {}) {
		this.metadata = {
			timestamp: Date.now(),
			version: version,
			user: {
				id: "",
				display_name: "",
			},
		};
		this.playlists = [];
		this.followed_playlists = [];
		this.saved_tracks = [];
		this.saved_albums = [];
		this.followed_artists = [];
		this.images = [];
		this.status = "empty";
		this.mutex_lock = false;
		this.onBackupStatusChange = onBackupStatusChange;
	}

	changeStatus(status: string) {
		this.status = status;
		this.onBackupStatusChange(status);
	}

	async shallowFetch() {
		if (this.mutex_lock) throw new Error("Backup is locked");
		if (this.status !== "empty") {
			throw new Error("Backup is not empty. Please create a new instance.");
		}
		this.mutex_lock = true;

		this.metadata.user = await getCurrentUser().then((user) => {
			return {
				id: user.id!,
				display_name: user.display_name!,
			};
		});

		const temp_playlists = await getPlaylists();
		this.playlists = temp_playlists.filter((playlist: components["schemas"]["SimplifiedPlaylistObject"]) => {
			return playlist.owner?.id == this.metadata.user.id;
		});
		this.followed_playlists = temp_playlists.filter((playlist: components["schemas"]["SimplifiedPlaylistObject"]) => {
			return playlist.owner?.id != this.metadata.user.id;
		});

		this.changeStatus("shallow");
		this.mutex_lock = false;
	}

	async createBackup(backupOptions: BackupOptions) {
		if (this.mutex_lock) throw new Error("Backup is locked");
		if (this.status === "full") {
			console.warn("Backup is already full. Replacing existing data.");
		} else if (this.status !== "shallow") {
			throw new Error("Backup is not shallow. Please run shallowFetch() first.");
		}
		this.mutex_lock = true;

		this.metadata.timestamp = Date.now();
		this.metadata.version = version;

		if (backupOptions.backupSavedTracks) this.saved_tracks = await getSavedTracks();
		if (backupOptions.backupSavedAlbums) this.saved_albums = await getSavedAlbums();
		if (backupOptions.backupFollowedArtists) this.followed_artists = await getFollowedArtists();

		// Deep fetch playlists
		for (const playlist of this.playlists) {
			if (backupOptions.checkedPlaylistsIds.includes(playlist.id!)) {
				playlist.tracks = (await getPlaylist(playlist.id!)).tracks;
			}
		}
		for (const playlist of this.followed_playlists) {
			if (backupOptions.checkedFollowedPlaylistsIds.includes(playlist.id!)) {
				playlist.tracks = (await getPlaylist(playlist.id!)).tracks;
			}
		}

		const fetchPlaylistImages = async (playlist: components["schemas"]["SimplifiedPlaylistObject"]) => {
			if (playlist.images && playlist.images.length > 0) {
				// The first image is always the widest one
				// Url should be in the format "https://i.scdn.co/image/ab67616d00001e02ff9ca10b55ce82ae553c8228"
				const url = playlist.images[0]!.url;
				const slug = this.getLastPathSegment(url);
				if (slug) {
					const filename = slug + ".jpg";
					try {
						const response = await fetch(url);
						this.images.push(new File([await response.blob()], filename));
					} catch (error) {
						console.error(`Error downloading image: ${error}`);
					}
				} else {
					console.error(`Error parsing image slug from URL: ${url}`);
				}
			}
		};

		// Download images
		await Promise.allSettled(
			this.playlists.map(async (playlist) => {
				await fetchPlaylistImages.call(this, playlist);
			})
		);
		await Promise.allSettled(
			this.followed_playlists.map(async (playlist) => {
				await fetchPlaylistImages.call(this, playlist);
			})
		);
		this.changeStatus("full");
		this.mutex_lock = false;
	}

	downloadBlob(blob: Blob, filename: string) {
		const url = window.URL.createObjectURL(blob); // Create a link to download the zip file
		const a = document.createElement("a"); // Create a link element
		a.href = url; // Set the href to the blob URL
		a.download = filename; // Set the download attribute to the desired file name
		document.body.appendChild(a); // Append the link to the body
		a.click(); // Programmatically click the link to trigger the download
		document.body.removeChild(a); //Remove the link from the document
		window.URL.revokeObjectURL(url); // Revoke the object URL to free up memory
	}

	localIsoDateString(date: Date) {
		return date.toLocaleString("sv").replace(" ", "T").replace(":", "-");
	}

	getLastPathSegment(url: string | URL): string {
		try {
			const urlObj = new URL(url);
			const pathSegments = urlObj.pathname.split("/").filter((segment) => segment.length > 0);
			return pathSegments[pathSegments.length - 1] || "";
		} catch (error) {
			console.error("Invalid URL:", error);
			return "";
		}
	}

	async downloadZip() {
		if (this.status !== "full") {
			throw new Error("Backup is not complete. Please run createBackup() first.");
		}

		const zip = new JSZip();
		zip.file("metadata.json", JSON.stringify(this.metadata, null, 2));
		zip.file("playlists.json", JSON.stringify(this.playlists, null, 2));
		zip.file("followed_playlists.json", JSON.stringify(this.followed_playlists, null, 2));
		zip.file("saved_tracks.json", JSON.stringify(this.saved_tracks, null, 2));
		zip.file("saved_albums.json", JSON.stringify(this.saved_albums, null, 2));
		zip.file("followed_artists.json", JSON.stringify(this.followed_artists, null, 2));
		zip.folder("images");

		this.images.forEach((image) => {
			zip.file(`images/${image.name}`, image);
		});

		const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE", compressionOptions: { level: 9 } });
		const filename = `SpotVault_backup_${this.localIsoDateString(new Date(this.metadata.timestamp))}.zip`;
		this.downloadBlob(blob, filename);
	}

	static async fromZip(file: File): Promise<Backup> {
		const zip = new JSZip();
		const backup = new Backup();
		const content = await zip.loadAsync(file);
		const metadata = await content.file("metadata.json")?.async("string");
		if (!metadata) {
			throw new Error("Invalid backup file");
		}

		backup.metadata = JSON.parse(metadata);
		if (backup.metadata.version > version) {
			throw new Error("Backup file is from a newer version of SpotVault");
		}

		backup.playlists = JSON.parse(await content.file("playlists.json")!.async("string"));
		backup.followed_playlists = JSON.parse(await content.file("followed_playlists.json")!.async("string")!);
		backup.saved_tracks = JSON.parse(await content.file("saved_tracks.json")!.async("string")!);
		backup.saved_albums = JSON.parse(await content.file("saved_albums.json")!.async("string")!);
		backup.followed_artists = JSON.parse(await content.file("followed_artists.json")!.async("string")!);

		// Load the images from the zip file
		const images = await content.folder("images");
		if (images) {
			await Promise.allSettled(
				Object.keys(images).map(async (key: string) => {
					const fileContent = await content.file(`images/${key}`)?.async("blob");
					if (fileContent) {
						backup.images.push(new File([fileContent], key));
					}
				})
			);
		}
		backup.changeStatus("full");

		return backup;
	}

	async restoreBackup(backupOptions: BackupOptions) {
		// TODO: Implement restore backup
		// This function should restore the backup using the provided options
	}
}
