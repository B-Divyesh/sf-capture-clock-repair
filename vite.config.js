import { defineConfig } from "vite";
import { resolve } from "node:path";
import { readFileSync, readdirSync, writeFileSync } from "node:fs";

function addBuiltAssetsToServiceWorker() {
  return {
    name: "capture-clock-repair-service-worker-assets",
    closeBundle() {
      const output = resolve(import.meta.dirname, "dist/site");
      const assets = readdirSync(resolve(output, "assets"))
        .filter((name) => name.endsWith(".js") || name.endsWith(".css"))
        .map((name) => `/assets/${name}`);
      const serviceWorker = resolve(output, "sw.js");
      const source = readFileSync(serviceWorker, "utf8");
      writeFileSync(serviceWorker, source.replace("const buildAssets = [];", `const buildAssets = ${JSON.stringify(assets)};`));
    }
  };
}

export default defineConfig({
  plugins: [addBuiltAssetsToServiceWorker()],
  root: "site",
  publicDir: "public",
  build: {
    outDir: "../dist/site",
    emptyOutDir: true,
    target: "es2022",
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, "site/index.html"),
        demo: resolve(import.meta.dirname, "site/demo/index.html"),
        privacy: resolve(import.meta.dirname, "site/privacy/index.html"),
        terms: resolve(import.meta.dirname, "site/terms/index.html"),
        notFound: resolve(import.meta.dirname, "site/404.html")
      }
    }
  }
});
