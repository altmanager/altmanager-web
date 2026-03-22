import { defineConfig, loadEnv } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { minifyTemplateLiterals } from "rollup-plugin-minify-template-literals";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");

  return {
    plugins: [
      tailwindcss(),
      minifyTemplateLiterals(),
      {
        name: "dev-env",
        configureServer(server) {
          server.middlewares.use("/env.json", (_, res) => {
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify(env));
          });
        },
      },
    ],
  };
});
