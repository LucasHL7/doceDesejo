import { resolve } from 'node:path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      // Duas páginas: o site (/) e o painel administrativo (/admin/).
      input: {
        site: resolve(import.meta.dirname, 'index.html'),
        admin: resolve(import.meta.dirname, 'admin/index.html'),
      },
    },
  },
  test: {
    // Componentes React precisam de um DOM; os testes de lógica pura rodam nele sem problema.
    environment: 'jsdom',
    // Polyfills do jsdom (<dialog>, IntersectionObserver...) e trava contra o Firebase de verdade.
    setupFiles: ['./vitest.setup.js'],
    // Valores fictícios: os testes não dependem do .env.local de quem roda.
    env: { VITE_FIREBASE_API_KEY: 'teste', VITE_FIREBASE_PROJECT_ID: 'teste' },
    coverage: {
      provider: 'v8',
      // Mede todo o src, inclusive arquivos que ainda não têm teste (aparecem com 0%).
      include: ['src/**/*.{js,jsx}'],
      // Fora da conta: os próprios testes, os ajudantes de teste (src/test), os pontos de entrada
      // (main.jsx só chama createRoot().render) e a lista de imports de SVG dos ícones.
      exclude: [
        'src/**/*.test.{js,jsx}',
        'src/test/**',
        'src/main.jsx',
        'src/admin/main.jsx',
        'src/components/Icon/icones.js',
      ],
      reporter: ['text', 'html'],
    },
  },
});
