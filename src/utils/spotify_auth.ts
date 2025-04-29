"use client";
/**
 * _This is an example of a basic node.js script that performs_ the Authorization Code with PKCE oAuth2 flow to authenticate
 * against Spotify Accounts. _For more information, read_ https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow
 */

const clientId: string = "6f009299dfc74904993a1b595787371d"; // your clientId
const redirectUrl: string = "http://127.0.0.1:3000"; // your redirect URL - must be localhost URL and/or HTTPS

const authorizationEndpoint: string = "https://accounts.spotify.com/authorize";
const tokenEndpoint: string = "https://accounts.spotify.com/api/token";

const scope: string = ["playlist-read-private", "playlist-read-collaborative", "playlist-modify-private", "playlist-modify-public", "user-library-read", "user-follow-read"].join(" ");

// Interface for the token response
interface TokenResponse {
	access_token: string;
	refresh_token: string;
	expires_in: number;
}

// Data structure that manages the current active token, caching it in window.localStorage
export const currentToken = {
	get access_token(): string | null {
		if (typeof window !== "undefined") {
			return window.localStorage.getItem("access_token");
		}
		return null;
	},
	get refresh_token(): string | null {
		if (typeof window !== "undefined") {
			return window.localStorage.getItem("refresh_token");
		}
		return null;
	},
	get expires(): Date | null {
		if (typeof window !== "undefined") {
			const item = window.localStorage.getItem("expires");
			return item ? new Date(item) : null;
		}
		return null;
	},
	get isExpired(): boolean {
		const now = new Date();
		const expires = this.expires;
		return this.access_token !== null && expires !== null && now >= expires;
	},
	get notNull(): boolean {
		return this.access_token !== null && this.refresh_token !== null && this.expires !== null;
	},
	save: function (response: TokenResponse): void {
		if (typeof window !== "undefined") {
			console.log(response);
			const { access_token, refresh_token, expires_in } = response;
			window.localStorage.setItem("access_token", access_token);
			window.localStorage.setItem("refresh_token", refresh_token);
			window.localStorage.setItem("expires_in", expires_in.toString());
			const expiry = new Date(new Date().getTime() + expires_in * 1000);
			window.localStorage.setItem("expires", expiry.toISOString());
		}
	},
};

export async function tryFetchAndHandleAuthCode(): Promise<boolean> {
	// On page load, try to fetch auth code from current browser search URL
	const args = new URLSearchParams(window.location.search);
	const code = args.get("code");

	// If we find a code, we're in a callback, do a token exchange
	if (code) {
		const token = await getToken(code);
		currentToken.save(token);

		// Remove code from URL so we can refresh correctly.
		const url = new URL(window.location.href);
		url.searchParams.delete("code");
		const updatedUrl = url.search ? url.href : url.href.replace("?", "");

		// Remove code_verifier from local storage
		window.localStorage.removeItem("code_verifier");

		window.history.replaceState({}, document.title, updatedUrl);
		return true;
	}

	return false;
}

export async function redirectToSpotifyAuthorize(): Promise<void> {
	const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	const randomValues = crypto.getRandomValues(new Uint8Array(64));

	const randomString = Array.from(randomValues).reduce((acc, x) => acc + possible[x % possible.length], "");
	const code_verifier = randomString;

	const data = new TextEncoder().encode(code_verifier);
	const hashed = await crypto.subtle.digest("SHA-256", data);

	const code_challenge_base64 = btoa(String.fromCharCode(...new Uint8Array(hashed)))
		.replace(/=/g, "")
		.replace(/\+/g, "-")
		.replace(/\//g, "_");

	window.localStorage.setItem("code_verifier", code_verifier);

	const authUrl = new URL(authorizationEndpoint);
	const params = {
		response_type: "code",
		client_id: clientId,
		scope: scope,
		code_challenge_method: "S256",
		code_challenge: code_challenge_base64,
		redirect_uri: redirectUrl,
	};
	authUrl.search = new URLSearchParams(params).toString();

	window.location.href = authUrl.toString(); // Redirect the user to authorization server for login
}

// Spotify API Calls
async function getToken(code: string): Promise<TokenResponse> {
	const code_verifier = window.localStorage.getItem("code_verifier") ?? "";
	const response = await fetch(tokenEndpoint, {
		method: "POST",
		headers: {
			"Content-Type": "application/x-www-form-urlencoded",
		},
		body: new URLSearchParams({
			client_id: clientId,
			grant_type: "authorization_code",
			code: code,
			redirect_uri: redirectUrl,
			code_verifier: code_verifier,
		}),
	});

	return await response.json();
}

async function refreshTokenInternal(): Promise<TokenResponse | null> {
	const refresh_token = currentToken.refresh_token ?? "";
	try {
		const response = await fetch(tokenEndpoint, {
			method: "POST",
			headers: {
				"Content-Type": "application/x-www-form-urlencoded",
			},
			body: new URLSearchParams({
				client_id: clientId,
				grant_type: "refresh_token",
				refresh_token: refresh_token,
			}),
		});
		return await response.json();
	} catch (error) {
		console.error("Error refreshing token:", error);
		logout();
		return null;
	}
}

export async function tryRefreshToken() {
	if (currentToken.isExpired) {
		console.log("Token is expired, refreshing...");
		// If the token is expired, try to refresh it
		(async () => {
			const token = await refreshTokenInternal();
			if (token) {
				console.log("Token refreshed successfully :", token);
				currentToken.save(token);
			}
		})();
	}
}

export function logout(): void {
	// Clear local storage
	window.localStorage.removeItem("access_token");
	window.localStorage.removeItem("refresh_token");
	window.localStorage.removeItem("expires");
	window.localStorage.removeItem("code_verifier");
	window.location.href = "/"; // Redirect to the home page
}
