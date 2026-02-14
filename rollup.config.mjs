import resolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import ts from "@rollup/plugin-typescript";
import commonjs from "@rollup/plugin-commonjs";
import dts from "rollup-plugin-dts";
// 基础配置
const main = {
  input: "src/index.ts", // 入口文件
  output: [
    {
      file: "dist/index.js", // CommonJS
      format: "esm",
      sourcemap: true,
    },
  ],
  plugins: [resolve(), json(), commonjs(), ts()],
  external: [
    "@minecraft/server",
    "@minecraft/server-ui"
  ],
};
const Dts = {
  input: "src/index.ts",
  output: {
    file: "dist/index.d.ts",
    format: "es",
  },
  plugins: [dts()],
};
export default [main, Dts];
