// knexfile.cjs
// Используем асинхронный импорт, чтобы загрузить ESM-конфиг из CJS-файла.
module.exports = (async () => {
  const { config } = await import('./src/knexfile.ts');
  return config;
})();