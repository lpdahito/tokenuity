import { defineConfig } from 'tsup'

export default defineConfig({
  entry: [
    'src/app.ts',
  ],
  format: ['cjs'],
  target: 'node24',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: [/^@tokenuity\//, 'evmole'],
})