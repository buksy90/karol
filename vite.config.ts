import { defineConfig } from 'vitest/config';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The build inlines script and styles into one dist/index.html that opens from disk.
export default defineConfig({
  plugins: [vue(), viteSingleFile()],
  // Unit tests run in Node: nothing they cover needs a DOM.
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
