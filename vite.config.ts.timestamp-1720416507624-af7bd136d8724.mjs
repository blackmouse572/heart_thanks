// vite.config.ts
import { vitePlugin as remix } from "file:///D:/heart_thanks/node_modules/.pnpm/@remix-run+dev@2.9.2_@remix-run+react@2.9.2_@remix-run+serve@2.9.2_@types+node@20.14.10_typescript@5.5.3_vite@5.3.3/node_modules/@remix-run/dev/dist/index.js";
import { sentryVitePlugin } from "file:///D:/heart_thanks/node_modules/.pnpm/@sentry+vite-plugin@2.20.1/node_modules/@sentry/vite-plugin/dist/esm/index.mjs";
import { glob } from "file:///D:/heart_thanks/node_modules/.pnpm/glob@10.4.3/node_modules/glob/dist/esm/index.js";
import { flatRoutes } from "file:///D:/heart_thanks/node_modules/.pnpm/remix-flat-routes@0.6.5_@remix-run+dev@2.9.2/node_modules/remix-flat-routes/dist/index.js";
import { defineConfig } from "file:///D:/heart_thanks/node_modules/.pnpm/vite@5.3.3_@types+node@20.14.10/node_modules/vite/dist/node/index.js";
var MODE = process.env.NODE_ENV;
var vite_config_default = defineConfig({
  build: {
    cssMinify: MODE === "production",
    rollupOptions: {
      external: [/node:.*/, "stream", "crypto", "fsevents"]
    },
    assetsInlineLimit: (source) => {
      if (source.endsWith("sprite.svg")) {
        return false;
      }
    },
    sourcemap: true
  },
  server: {
    watch: {
      ignored: ["**/playwright-report/**"]
    }
  },
  plugins: [
    remix({
      ignoredRouteFiles: ["**/*"],
      serverModuleFormat: "esm",
      routes: async (defineRoutes) => {
        return flatRoutes("routes", defineRoutes, {
          ignoredRouteFiles: [
            ".*",
            "**/*.css",
            "**/*.test.{js,jsx,ts,tsx}",
            "**/__*.*",
            // This is for server-side utilities you want to colocate
            // next to your routes without making an additional
            // directory. If you need a route that includes "server" or
            // "client" in the filename, use the escape brackets like:
            // my-route.[server].tsx
            "**/*.server.*",
            "**/*.client.*"
          ]
        });
      }
    }),
    process.env.SENTRY_AUTH_TOKEN ? sentryVitePlugin({
      disable: MODE !== "production",
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      release: {
        name: process.env.COMMIT_SHA,
        setCommits: {
          auto: true
        }
      },
      sourcemaps: {
        filesToDeleteAfterUpload: await glob([
          "./build/**/*.map",
          ".server-build/**/*.map"
        ])
      }
    }) : null
  ]
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCJEOlxcXFxoZWFydF90aGFua3NcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkQ6XFxcXGhlYXJ0X3RoYW5rc1xcXFx2aXRlLmNvbmZpZy50c1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vRDovaGVhcnRfdGhhbmtzL3ZpdGUuY29uZmlnLnRzXCI7aW1wb3J0IHsgdml0ZVBsdWdpbiBhcyByZW1peCB9IGZyb20gJ0ByZW1peC1ydW4vZGV2J1xuaW1wb3J0IHsgc2VudHJ5Vml0ZVBsdWdpbiB9IGZyb20gJ0BzZW50cnkvdml0ZS1wbHVnaW4nXG5pbXBvcnQgeyBnbG9iIH0gZnJvbSAnZ2xvYidcbmltcG9ydCB7IGZsYXRSb3V0ZXMgfSBmcm9tICdyZW1peC1mbGF0LXJvdXRlcydcbmltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5cbmNvbnN0IE1PREUgPSBwcm9jZXNzLmVudi5OT0RFX0VOVlxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuXHRidWlsZDoge1xuXHRcdGNzc01pbmlmeTogTU9ERSA9PT0gJ3Byb2R1Y3Rpb24nLFxuXG5cdFx0cm9sbHVwT3B0aW9uczoge1xuXHRcdFx0ZXh0ZXJuYWw6IFsvbm9kZTouKi8sICdzdHJlYW0nLCAnY3J5cHRvJywgJ2ZzZXZlbnRzJ10sXG5cdFx0fSxcblxuXHRcdGFzc2V0c0lubGluZUxpbWl0OiAoc291cmNlOiBzdHJpbmcpID0+IHtcblx0XHRcdGlmIChzb3VyY2UuZW5kc1dpdGgoJ3Nwcml0ZS5zdmcnKSkge1xuXHRcdFx0XHRyZXR1cm4gZmFsc2Vcblx0XHRcdH1cblx0XHR9LFxuXG5cdFx0c291cmNlbWFwOiB0cnVlLFxuXHR9LFxuXHRzZXJ2ZXI6IHtcblx0XHR3YXRjaDoge1xuXHRcdFx0aWdub3JlZDogWycqKi9wbGF5d3JpZ2h0LXJlcG9ydC8qKiddLFxuXHRcdH0sXG5cdH0sXG5cdHBsdWdpbnM6IFtcblx0XHRyZW1peCh7XG5cdFx0XHRpZ25vcmVkUm91dGVGaWxlczogWycqKi8qJ10sXG5cdFx0XHRzZXJ2ZXJNb2R1bGVGb3JtYXQ6ICdlc20nLFxuXHRcdFx0cm91dGVzOiBhc3luYyAoZGVmaW5lUm91dGVzKSA9PiB7XG5cdFx0XHRcdHJldHVybiBmbGF0Um91dGVzKCdyb3V0ZXMnLCBkZWZpbmVSb3V0ZXMsIHtcblx0XHRcdFx0XHRpZ25vcmVkUm91dGVGaWxlczogW1xuXHRcdFx0XHRcdFx0Jy4qJyxcblx0XHRcdFx0XHRcdCcqKi8qLmNzcycsXG5cdFx0XHRcdFx0XHQnKiovKi50ZXN0Lntqcyxqc3gsdHMsdHN4fScsXG5cdFx0XHRcdFx0XHQnKiovX18qLionLFxuXHRcdFx0XHRcdFx0Ly8gVGhpcyBpcyBmb3Igc2VydmVyLXNpZGUgdXRpbGl0aWVzIHlvdSB3YW50IHRvIGNvbG9jYXRlXG5cdFx0XHRcdFx0XHQvLyBuZXh0IHRvIHlvdXIgcm91dGVzIHdpdGhvdXQgbWFraW5nIGFuIGFkZGl0aW9uYWxcblx0XHRcdFx0XHRcdC8vIGRpcmVjdG9yeS4gSWYgeW91IG5lZWQgYSByb3V0ZSB0aGF0IGluY2x1ZGVzIFwic2VydmVyXCIgb3Jcblx0XHRcdFx0XHRcdC8vIFwiY2xpZW50XCIgaW4gdGhlIGZpbGVuYW1lLCB1c2UgdGhlIGVzY2FwZSBicmFja2V0cyBsaWtlOlxuXHRcdFx0XHRcdFx0Ly8gbXktcm91dGUuW3NlcnZlcl0udHN4XG5cdFx0XHRcdFx0XHQnKiovKi5zZXJ2ZXIuKicsXG5cdFx0XHRcdFx0XHQnKiovKi5jbGllbnQuKicsXG5cdFx0XHRcdFx0XSxcblx0XHRcdFx0fSlcblx0XHRcdH0sXG5cdFx0fSksXG5cdFx0cHJvY2Vzcy5lbnYuU0VOVFJZX0FVVEhfVE9LRU5cblx0XHRcdD8gc2VudHJ5Vml0ZVBsdWdpbih7XG5cdFx0XHRcdFx0ZGlzYWJsZTogTU9ERSAhPT0gJ3Byb2R1Y3Rpb24nLFxuXHRcdFx0XHRcdGF1dGhUb2tlbjogcHJvY2Vzcy5lbnYuU0VOVFJZX0FVVEhfVE9LRU4sXG5cdFx0XHRcdFx0b3JnOiBwcm9jZXNzLmVudi5TRU5UUllfT1JHLFxuXHRcdFx0XHRcdHByb2plY3Q6IHByb2Nlc3MuZW52LlNFTlRSWV9QUk9KRUNULFxuXHRcdFx0XHRcdHJlbGVhc2U6IHtcblx0XHRcdFx0XHRcdG5hbWU6IHByb2Nlc3MuZW52LkNPTU1JVF9TSEEsXG5cdFx0XHRcdFx0XHRzZXRDb21taXRzOiB7XG5cdFx0XHRcdFx0XHRcdGF1dG86IHRydWUsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0c291cmNlbWFwczoge1xuXHRcdFx0XHRcdFx0ZmlsZXNUb0RlbGV0ZUFmdGVyVXBsb2FkOiBhd2FpdCBnbG9iKFtcblx0XHRcdFx0XHRcdFx0Jy4vYnVpbGQvKiovKi5tYXAnLFxuXHRcdFx0XHRcdFx0XHQnLnNlcnZlci1idWlsZC8qKi8qLm1hcCcsXG5cdFx0XHRcdFx0XHRdKSxcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KVxuXHRcdFx0OiBudWxsLFxuXHRdLFxufSlcbiJdLAogICJtYXBwaW5ncyI6ICI7QUFBbU8sU0FBUyxjQUFjLGFBQWE7QUFDdlEsU0FBUyx3QkFBd0I7QUFDakMsU0FBUyxZQUFZO0FBQ3JCLFNBQVMsa0JBQWtCO0FBQzNCLFNBQVMsb0JBQW9CO0FBRTdCLElBQU0sT0FBTyxRQUFRLElBQUk7QUFFekIsSUFBTyxzQkFBUSxhQUFhO0FBQUEsRUFDM0IsT0FBTztBQUFBLElBQ04sV0FBVyxTQUFTO0FBQUEsSUFFcEIsZUFBZTtBQUFBLE1BQ2QsVUFBVSxDQUFDLFdBQVcsVUFBVSxVQUFVLFVBQVU7QUFBQSxJQUNyRDtBQUFBLElBRUEsbUJBQW1CLENBQUMsV0FBbUI7QUFDdEMsVUFBSSxPQUFPLFNBQVMsWUFBWSxHQUFHO0FBQ2xDLGVBQU87QUFBQSxNQUNSO0FBQUEsSUFDRDtBQUFBLElBRUEsV0FBVztBQUFBLEVBQ1o7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNQLE9BQU87QUFBQSxNQUNOLFNBQVMsQ0FBQyx5QkFBeUI7QUFBQSxJQUNwQztBQUFBLEVBQ0Q7QUFBQSxFQUNBLFNBQVM7QUFBQSxJQUNSLE1BQU07QUFBQSxNQUNMLG1CQUFtQixDQUFDLE1BQU07QUFBQSxNQUMxQixvQkFBb0I7QUFBQSxNQUNwQixRQUFRLE9BQU8saUJBQWlCO0FBQy9CLGVBQU8sV0FBVyxVQUFVLGNBQWM7QUFBQSxVQUN6QyxtQkFBbUI7QUFBQSxZQUNsQjtBQUFBLFlBQ0E7QUFBQSxZQUNBO0FBQUEsWUFDQTtBQUFBO0FBQUE7QUFBQTtBQUFBO0FBQUE7QUFBQSxZQU1BO0FBQUEsWUFDQTtBQUFBLFVBQ0Q7QUFBQSxRQUNELENBQUM7QUFBQSxNQUNGO0FBQUEsSUFDRCxDQUFDO0FBQUEsSUFDRCxRQUFRLElBQUksb0JBQ1QsaUJBQWlCO0FBQUEsTUFDakIsU0FBUyxTQUFTO0FBQUEsTUFDbEIsV0FBVyxRQUFRLElBQUk7QUFBQSxNQUN2QixLQUFLLFFBQVEsSUFBSTtBQUFBLE1BQ2pCLFNBQVMsUUFBUSxJQUFJO0FBQUEsTUFDckIsU0FBUztBQUFBLFFBQ1IsTUFBTSxRQUFRLElBQUk7QUFBQSxRQUNsQixZQUFZO0FBQUEsVUFDWCxNQUFNO0FBQUEsUUFDUDtBQUFBLE1BQ0Q7QUFBQSxNQUNBLFlBQVk7QUFBQSxRQUNYLDBCQUEwQixNQUFNLEtBQUs7QUFBQSxVQUNwQztBQUFBLFVBQ0E7QUFBQSxRQUNELENBQUM7QUFBQSxNQUNGO0FBQUEsSUFDRCxDQUFDLElBQ0E7QUFBQSxFQUNKO0FBQ0QsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
