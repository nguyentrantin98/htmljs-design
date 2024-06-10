// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/index.js',
            name: 'htmljsCode',
            fileName: (format) => `htmljs-code.${format}.js`
        },
        rollupOptions: {
            // Ensure to externalize deps that shouldn't be bundled
            // into your library
            external: [],
            output: {
                globals: {}
            }
        }
    }
});
