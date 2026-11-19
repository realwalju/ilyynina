import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname } from 'node:path';
import arcade from '../api/arcade.js';
import callback from '../api/auth/callback.js';

const root = new URL('../', import.meta.url);
const port = Number(process.env.PORT || 4175);
process.env.ARCADE_ORIGIN ||= 'http://localhost:' + port;
const types = {'.html':'text/html', '.css':'text/css', '.js':'text/javascript', '.mjs':'text/javascript',
  '.svg':'image/svg+xml', '.ico':'image/x-icon', '.png':'image/png', '.jpg':'image/jpeg',
  '.webp':'image/webp', '.avif':'image/avif', '.woff2':'font/woff2'};
const pages = new Set(['index', 'about', 'emotes', 'patch-bay', 'play', 'raid-relay', 'setup', 'watch']);

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (url.pathname === '/api/arcade' || url.pathname === '/api/auth/callback') {
      req.query = Object.fromEntries(url.searchParams);
      if (req.method === 'POST') {
        const chunks = [];
        let bytes = 0;
        for await (const chunk of req) {
          bytes += chunk.length;
          if (bytes > 16384) { res.writeHead(413).end(); return; }
          chunks.push(chunk);
        }
        try { req.body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); }
        catch { res.writeHead(400).end(); return; }
      }
      return await (url.pathname === '/api/arcade' ? arcade : callback)(req, res);
    }
    let file = url.pathname.slice(1) || 'index.html';
    if (file === 'links' || file === 'links/') file = 'links/index.html';
    if (pages.has(file)) file += '.html';
    const publicFile = pages.has(file.replace(/\.html$/, '')) || file === 'links/index.html'
      || ['apple-touch-icon.png','favicon.svg','favicon.ico'].includes(file)
      || /^(?:css|assets|js)\/[\w.\/-]+$/.test(file);
    if (!publicFile || file.split('/').some(part => part.startsWith('.'))) {
      res.writeHead(404).end(); return;
    }
    const data = await readFile(new URL(file, root));
    res.writeHead(200, {'Content-Type': types[extname(file)] || 'application/octet-stream'}).end(data);
  } catch { res.writeHead(404).end(); }
}).listen(port, '127.0.0.1', () => console.log('Nina’s arcade at http://localhost:' + port + '/play'));
