import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";

export default defineConfig({
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
  ],
});
