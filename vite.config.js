import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from "path";
import utoolsPlugin from './build/utoolsPlugin';


export default defineConfig({
  "base": "./",
  "plugins": [
    vue(),
    utoolsPlugin()
  ],
  // "css": {
  //   "preprocessorOptions": {
  //     "scss": {
  //       "additionalData": '@import "./src/styles/variable.scss";@import "./src/styles/mixin.scss";',
  //     },
  //   },
  // },
  "server": {
    "host": "0.0.0.0",
    "port": 9527,
    "cors": true,
    "open": false,
  },
  "resolve": {
    "alias": {
      "@": resolve(__dirname, "src"),
    },
  },
  "build": {
    "minify": {
      "compress": {
        "drop_console": true,
        "drop_debugger": true
      }
    },
  },
});
