import { build } from 'vite';

await build({
  configFile: false,
  root: process.cwd(),
  base: '/amina-yasmina-mystery-game/',
  esbuild: {
    jsx: 'automatic',
  },
});
