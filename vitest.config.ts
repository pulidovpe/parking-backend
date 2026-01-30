import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true, // Permite usar describe, it, expect sin importarlos
    environment: 'node',
    include: ['tests/**/*.test.ts'], // Buscará tests en la carpeta tests/
    fileParallelism: false, // Evita conflictos con la BD al correr en paralelo
  },
});