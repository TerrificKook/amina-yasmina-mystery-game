import { createServer } from 'node:http';
import { extname, join, normalize, resolve } from 'node:path';
import { readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { networkInterfaces } from 'node:os';
import { build } from 'vite';

const root = process.cwd();
const distRoot = resolve(root, 'dist');
const host = '0.0.0.0';
const port = Number(process.env.PORT || 5173);
const pagesBase = '/amina-yasmina-mystery-game/';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
};

await build({
  configFile: false,
  root,
  base: pagesBase,
  esbuild: {
    jsx: 'automatic',
  },
});

const server = createServer(async (request, response) => {
  try {
    const url = new URL(request.url || '/', `http://${request.headers.host}`);
    const pathname = url.pathname.startsWith(pagesBase)
      ? url.pathname.slice(pagesBase.length - 1)
      : url.pathname;
    const cleanPath = normalize(decodeURIComponent(pathname)).replace(/^(\.\.[/\\])+/, '');
    const requestedPath = pathname === '/' ? 'index.html' : cleanPath.replace(/^[/\\]+/, '');
    let filePath = resolve(join(distRoot, requestedPath));

    if (!filePath.startsWith(distRoot) || !existsSync(filePath)) {
      filePath = join(distRoot, 'index.html');
    }

    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      filePath = join(filePath, 'index.html');
    }

    const body = await readFile(filePath);
    response.writeHead(200, {
      'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
    });
    response.end(body);
  } catch (error) {
    response.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end(`Ошибка dev-сервера: ${error.message}`);
  }
});

server.listen(port, host, () => {
  console.log(`Local: http://localhost:${port}/`);
  const addresses = Object.values(networkInterfaces())
    .flat()
    .filter((item) => item && item.family === 'IPv4' && !item.internal)
    .map((item) => `http://${item.address}:${port}/`);

  if (addresses.length > 0) {
    addresses.forEach((address) => console.log(`Network: ${address}`));
  } else {
    console.log(`Network: используйте IP-адрес компьютера и порт ${port}`);
  }
});
