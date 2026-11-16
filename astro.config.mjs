import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://s411283037.github.io',
  output: 'static',
  base: process.env.BASE_PATH || '/portfolio-content',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
