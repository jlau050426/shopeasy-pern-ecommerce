import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // Set your desired port here
    proxy: {
      //server proxy config (when the address start with /api, automatically go to localhost 3000)
      "/": {
        target: "http://localhost:3000",
      },
    },
  },
});
