import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, extname, join, resolve } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const publicDir = resolve(__dirname, 'build');

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.ico': 'image/x-icon',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.map': 'application/json; charset=utf-8'
};

function getMimeType(filePath) {
  return mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream';
}

async function serveFile(filePath, res) {
  try {
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      return serveFile(join(filePath, 'index.html'), res);
    }
    res.writeHead(200, { 'Content-Type': getMimeType(filePath) });
    const stream = createReadStream(filePath);
    stream.pipe(res);
    stream.on('error', (error) => {
      console.error('Stream error', error);
      if (!res.headersSent) {
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      }
      res.end('Internal Server Error');
    });
  } catch (error) {
    if (error.code === 'ENOENT') {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
    } else {
      console.error('Failed to serve file', error);
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Internal Server Error');
    }
  }
}

const server = createServer(async (req, res) => {
  if (!req.url) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Bad Request');
    return;
  }

  const { url } = req;
  const pathname = new URL(url, `http://${req.headers.host}`).pathname;
  const normalisedPath = pathname.endsWith('/') ? `${pathname}index.html` : pathname;
  const resolvedPath = resolve(publicDir, `.${normalisedPath}`);

  if (!resolvedPath.startsWith(publicDir)) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Forbidden');
    return;
  }

  await serveFile(resolvedPath, res);
});

const port = Number(process.env.PORT || 3000);
server.listen(port, () => {
  console.log(`SpotVault server running at http://localhost:${port}`);
});
