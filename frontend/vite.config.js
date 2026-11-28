import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src')
    }
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // CategoriesPage usa `lucide-react` dinámico (icono por nombre); su chunk
    // por ruta es mayor. Límite alto evita ruido sin afectar funcionalidad.
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        // `manualChunks` como función (Vite 8 / rolldown); code-splitting conservado.
        manualChunks(id) {
          const inPkg = (pkg) => id.includes(`node_modules/${pkg}/`) || id.includes(`node_modules/${pkg}`);
          if (['react', 'react-dom', 'react-router-dom', 'react-router'].some(inPkg)) return 'vendor';
          if (['chart.js', 'react-chartjs-2'].some(inPkg)) return 'charts';
          if (['axios', 'dayjs', 'zod', 'clsx'].some(inPkg)) return 'utils';
          return undefined;
        }
      }
    }
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.js'],
    globals: true,
    include: ['src/**/*.test.{js,jsx}', 'tests/**/*.test.{js,jsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html']
    }
  }
});