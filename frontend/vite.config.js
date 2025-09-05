import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';


export default defineConfig({
    root: 'src',
    publicDir: '../public',
    plugins: [react()],
    server: {
        port: 3001
    },
    build: {
        outDir: 'dist',
        rollupOptions: {
            input: {
                main: 'src/index.html',
            }
        }
    },
    define: {
        'process.env.NODE_ENV': JSON.stringify('production'),
        'process.env': '{URL: "http://localhost:4000"}'
    }
});