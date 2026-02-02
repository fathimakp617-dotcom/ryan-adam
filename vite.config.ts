import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom", "react/jsx-runtime"],
  },
  build: {
    // Optimize chunk splitting for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          // UI Components
          "vendor-ui": ["framer-motion", "lucide-react", "sonner"],
          // Forms & Validation
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          // Heavy libraries
          "vendor-pdf": ["jspdf", "jspdf-autotable", "html2canvas"],
        },
      },
    },
    // Target modern browsers for smaller bundles
    target: "es2020",
    // Improve minification
    minify: "esbuild",
    // Generate source maps only for production debugging if needed
    sourcemap: false,
  },
  // Optimize dependencies
  optimizeDeps: {
    include: ["react", "react-dom", "react-router-dom", "framer-motion"],
  },
}));
