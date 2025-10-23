# SpotVault

SpotVault is a lightweight Spotify backup utility built with vanilla JavaScript, Web Components, and a tiny Node.js static server. The client talks directly to Spotify through their web APIs and bundles backups entirely in the browser.

## Getting started

```bash
npm install
npm start
```

By default the server listens on [http://localhost:3000](http://localhost:3000) and simply serves the files from `public/`.

## Project layout

```
public/
  backup.html         # Backup workflow
  restore.html        # Restore placeholder flow
  index.html          # Landing and authentication entry point
  css/styles.css      # Shared styles
  js/
    auth.js           # Spotify PKCE flow and token helpers
    backup.js         # Backup orchestration + ZIP generation
    spotifyApi.js     # Thin wrapper around openapi-fetch for Spotify endpoints
    components/       # Reusable Web Components (navbar, etc.)
    pages/            # Page-specific controllers
server.js             # Static file server (ESM, Node built-ins only)
package.json          # Minimal scripts, no runtime dependencies
```

The browser bundles Spotify data using [`JSZip`](https://stuk.github.io/jszip/) and [`openapi-fetch`](https://github.com/drwpow/openapi-fetch) sourced via ESM CDNs. No bundler is involved—everything ships as native ES modules.

## Customisation

- **Spotify App credentials** – Update `clientId` in `public/js/auth.js` if you use your own Spotify application.
- **Server port** – Set the `PORT` environment variable before running `npm start` to change the listen port.

## Notes

- The restore flow remains a placeholder, mirroring the previous implementation. Backup zips can be inspected, but writing data back to Spotify is not yet implemented.
- The generated OpenAPI typings (`types/spotify_api.d.ts`) are kept for reference, but the current client runs purely in JavaScript.
