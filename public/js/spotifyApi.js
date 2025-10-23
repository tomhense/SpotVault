import { createPathBasedClient } from "https://cdn.jsdelivr.net/npm/openapi-fetch/+esm";
import { currentToken } from "./auth.js";

const client = createPathBasedClient({ baseUrl: "https://api.spotify.com/v1" });

async function paginate(path, query = {}, limit = 50) {
	const authHeader = buildAuthHeader();
	if (!authHeader) {
		throw new Error("No access token available");
	}
	const firstPage = await client[path].GET({
		headers: authHeader,
		params: {
			query: {
				limit,
				offset: 0,
				...query,
			},
		},
	});
	if (firstPage.error || !firstPage.data) {
		throw new Error(`Spotify request failed for ${path}: ${firstPage.error}`);
	}
	const combined = { ...firstPage.data };
	if (!Array.isArray(combined.items)) {
		combined.items = Array.isArray(firstPage.data.items) ? [...firstPage.data.items] : [];
	}
	while (combined.next) {
		const nextPage = await client[path].GET({
			headers: authHeader,
			params: {
				query: {
					limit,
					offset: combined.items.length,
					...query,
				},
			},
		});
		if (nextPage.error || !nextPage.data) {
			throw new Error(`Spotify pagination failed for ${path}: ${nextPage.error}`);
		}
		if (Array.isArray(nextPage.data.items)) {
			combined.items = [...combined.items, ...nextPage.data.items];
		}
		combined.next = nextPage.data.next;
	}
	return combined;
}

function buildAuthHeader() {
	const access = currentToken.access_token;
	if (!access) {
		return null;
	}
	return {
		Authorization: `Bearer ${access}`,
	};
}

export async function getPlaylist(playlistId) {
	const authHeader = buildAuthHeader();
	if (!authHeader) {
		throw new Error("No access token available");
	}
	const response = await client["/playlists/{playlist_id}"].GET({
		headers: authHeader,
		params: {
			path: { playlist_id: playlistId },
		},
	});
	if (response.error || !response.data) {
		throw new Error(`Error fetching playlist: ${response.error}`);
	}
	return response.data;
}

export async function getPlaylists() {
	const { items } = await paginate("/me/playlists");
	return items;
}

export async function getSavedTracks() {
	const { items } = await paginate("/me/tracks");
	return items;
}

export async function getSavedAlbums() {
	const { items } = await paginate("/me/albums");
	return items;
}

export async function getFollowedArtists() {
	const data = await paginate("/me/following", { type: "artist" });
	return data.artists.items;
}

export async function getCurrentUser() {
	const authHeader = buildAuthHeader();
	if (!authHeader) {
		throw new Error("No access token available");
	}
	const response = await client["/me"].GET({ headers: authHeader });
	if (response.error || !response.data) {
		throw new Error(`Error fetching current user: ${response.error}`);
	}
	return response.data;
}
