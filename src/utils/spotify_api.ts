import { createPathBasedClient } from "openapi-fetch";
import type { paths } from "../types/spotify_api.d.ts";
import { currentToken } from "./spotify_auth";

const client = createPathBasedClient<paths>({ baseUrl: "https://api.spotify.com/v1" });

async function paginate(path: string, query: object = {}, limit: number = 50) {
	// @ts-expect-error type hint is too strict
	const { data, error } = await client[path].GET(params, {
		headers: {
			Authorization: "Bearer " + currentToken.access_token,
		},
		params: {
			query: {
				limit: limit,
				offset: 0,
				...query,
			},
		},
	});

	if (error || data == undefined) {
		throw new Error(`Error fetching data: ${error}`);
	}

	while (data.next) {
		// @ts-expect-error type hint is too strict
		const nextPage = await client[path].GET(data.next, {
			headers: {
				Authorization: "Bearer " + currentToken.access_token,
			},
			params: {
				query: {
					limit: limit,
					offset: data.items.length,
				},
			},
		});
		if (nextPage.error) {
			throw new Error(`Error fetching data: ${nextPage.error}`);
		}
		data.items = [...data.items, ...nextPage.data.items];
		data.next = nextPage.data.next;
	}

	return data;
}

export async function getPlaylist(playlist_id: string) {
	const { data, error } = await client["/playlists/{playlist_id}"].GET({
		headers: {
			Authorization: "Bearer " + currentToken.access_token,
		},
		params: {
			path: { playlist_id },
		},
	});
	if (error) {
		throw new Error(`Error fetching album: ${error}`);
	}
	return data;
}

export async function getPlaylists() {
	const { data, error } = await paginate("/me/playlists");
	if (error) {
		throw new Error(`Error fetching playlists: ${error}`);
	}
	return data.items;
}

export async function getSavedTracks() {
	const { data, error } = await paginate("/me/tracks");
	if (error) {
		throw new Error(`Error fetching saved tracks: ${error}`);
	}
	return data.items;
}

export async function getSavedAlbums() {
	const { data, error } = await paginate("/me/albums");
	if (error) {
		throw new Error(`Error fetching saved albums: ${error}`);
	}
	return data.items;
}

export async function getFollowedArtists() {
	const { data, error } = await paginate("/me/following", { type: "artist" });
	if (error) {
		throw new Error(`Error fetching followed artists: ${error}`);
	}
	return data.items;
}

export async function getCurrentUser() {
	const { data, error } = await client["/me"].GET({
		headers: {
			Authorization: "Bearer " + currentToken.access_token,
		},
	});
	if (error) {
		throw new Error(`Error fetching user: ${error}`);
	}
	return data;
}
