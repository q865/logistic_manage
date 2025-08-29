
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Включаем Jest-совместимые globals (describe, it, expect)
    globals: true,
    // Указываем среду выполнения
    environment: 'node',
  },
});
