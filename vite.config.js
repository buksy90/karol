import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The build inlines script and styles into one dist/index.html that opens from disk.
export default defineConfig({
  plugins: [vue(), viteSingleFile()],
});
