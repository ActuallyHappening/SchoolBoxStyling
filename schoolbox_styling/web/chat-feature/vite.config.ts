import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  build: {
    // Change so that the built js file has the same name as the folder
    // This is needed for the import in the index.html file
    outDir: "dist",
    sourcemap: "inline",
    rollupOptions: {},
  },
});
