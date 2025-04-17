import createClient from "openapi-fetch";
import type { paths } from "../types/spotify_api.d.ts";

const client = createClient<paths>({ baseUrl: "https://api.spotify.com/v1" });

async function getPlaylist(playlist_id: string) {
	const { data, error } = await client.GET("/playlists/{playlist_id}", {
		headers: {
			Authorization: "Bearer " + localStorage.getItem("access_token"),
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
