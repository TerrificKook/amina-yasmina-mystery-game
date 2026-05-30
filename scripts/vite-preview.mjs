import { preview } from 'vite';

const pagesBase = '/amina-yasmina-mystery-game/';
const port = Number(process.env.PORT || 4173);

const server = await preview({
  configFile: false,
  root: process.cwd(),
  base: pagesBase,
  preview: {
    host: '0.0.0.0',
    port,
    strictPort: true,
  },
});

const localUrl = server.resolvedUrls.local?.[0] || `http://localhost:${port}${pagesBase}`;
console.log(`Local: ${localUrl}`);
