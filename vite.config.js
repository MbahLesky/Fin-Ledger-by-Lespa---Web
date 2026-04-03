import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
var __dirname = path.dirname(fileURLToPath(import.meta.url));
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src")
        }
    },
    build: {
        cssMinify: false
    },
    server: {
        port: 5173
    },
    preview: {
        port: 4173
    }
});
