import { defineConfig } from 'vite';

const REPO_NAME = 'Gerber-Viewer'; 

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? `/${REPO_NAME}/` : '/',
  publicdir: '.',
  build: {
    rollupOptions: {
      input: {
        main: 'index.html'
      }
    }
  }
});