import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'src/main.tsx')
      },
      output: {
        entryFileNames: 'main.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
        format: 'iife',
        inlineDynamicImports: true
      }
    },
    minify: 'terser',
    sourcemap: false,
    // 针对油猴脚本的优化
    target: 'es2015',
    // 确保所有代码打包到一个文件
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  define: {
    // 定义全局常量
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString())
  },
  server: {
    port: 3000,
    host: true,
    cors: true
  },
  preview: {
    port: 3000,
    host: true,
    cors: true
  }
});
