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

// Data structure that manages the current active token, caching it in localStorage
export const currentToken = {
	get access_token(): string | null {
		return localStorage.getItem("access_token");
	},
	get refresh_token(): string | null {
		return localStorage.getItem("refresh_token");
	},
	get expires_in(): number | null {
		const item = localStorage.getItem("expires_in");
		return item ? parseInt(item, 10) : null;
	},
	get expires(): Date | null {
		const item = localStorage.getItem("expires");
		return item ? new Date(item) : null;
	},
	save: function (response: TokenResponse): void {
		const { access_token, refresh_token, expires_in } = response;
		localStorage.setItem("access_token", access_token);
		localStorage.setItem("refresh_token", refresh_token);
		localStorage.setItem("expires_in", expires_in.toString());

		const now = new Date();
		const expiry = new Date(now.getTime() + expires_in * 1000);
		localStorage.setItem("expires", expiry.toISOString());
	},
};

async function login(): Promise<void> {
	// On page load, try to fetch auth code from current browser search URL
	const args = new URLSearchParams(window.location.search);
	const code = args.get("code");

	// If we find a code, we're in a callback, do a token exchange
	if (code) {
		(async () => {
			const token = await getToken(code);
			currentToken.save(token);

			// Remove code from URL so we can refresh correctly.
			const url = new URL(window.location.href);
			url.searchParams.delete("code");
			const updatedUrl = url.search ? url.href : url.href.replace("?", "");
			window.history.replaceState({}, document.title, updatedUrl);
		})();
	}

	// If we have a token, we're logged in, so fetch user data and render logged in template
	if (currentToken.access_token) {
		(async () => {
			//const userData = await getUserData();
			//renderTemplate("main", "logged-in-template", userData);
			//renderTemplate("oauth", "oauth-template", currentToken);
		})();
	}

	// Otherwise we're not logged in, so render the login template
	if (!currentToken.access_token) {
		//renderTemplate("main", "login");
	}
}

/* --------------- Change this following section ------------------- */

/* ------------------------ section end ---------------------------- */

async function redirectToSpotifyAuthorize(): Promise<void> {
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
	const code_verifier = localStorage.getItem("code_verifier") ?? "";
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

async function refreshToken(): Promise<TokenResponse> {
	const refresh_token = currentToken.refresh_token ?? "";
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
}

function logout(): void {
	// Clear local storage
	localStorage.removeItem("access_token");
	localStorage.removeItem("refresh_token");
	localStorage.removeItem("expires_in");
	localStorage.removeItem("expires");
	localStorage.removeItem("code_verifier");
}

function getAccessToken(): string {
	// We'll only check for missing token and token expiration on app load
	return localStorage.getItem("access_token") ?? "";
}
