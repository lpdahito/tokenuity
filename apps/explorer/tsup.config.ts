import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/app.ts',
    'src/lambdas/findEvents.ts',
    'src/scripts/updateDatabase.ts',
    'src/scripts/container.ts',
  ],
  format: ['cjs'],
  target: 'node24',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: [/^@tokenuity\//, 'evmole'],
})