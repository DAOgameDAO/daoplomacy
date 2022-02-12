import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";
import content from "@originjs/vite-plugin-content";

export default defineConfig({
  base: "./",
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag === "def",
        },
      },
    }),
    svgLoader({
      svgoConfig: {
        plugins: [
          {
            name: "preset-default",
            params: {
              overrides: {
                collapseGroups: false,
                cleanupIDs: false,
              },
            },
          },
        ],
      },
    }),
    content(),
  ],
});
