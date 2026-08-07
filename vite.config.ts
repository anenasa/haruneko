import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [
    svelte({
      onwarn: function(warning, handler) {
        return warning.code.startsWith('a11y-') ? undefined : handler?.call(this, warning);
      }
    }),
  ],
  build: {
    lib: {
      entry: 'test.ts',
      formats: ['es'],
      fileName: () => 'test.js',
    },
    outDir: 'dist',
    emptyOutDir: false,
  },
});