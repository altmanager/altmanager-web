import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { minifyTemplateLiterals } from "rollup-plugin-minify-template-literals";

export default defineConfig({
  plugins: [
    tailwindcss(),
    minifyTemplateLiterals(),
  ],
});
