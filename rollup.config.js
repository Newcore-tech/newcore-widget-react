/*
 * @Author: YoungChan
 * @Date: 2024-04-10 10:58:32
 * @LastEditors: YoungChan
 * @LastEditTime: 2024-04-11 16:24:28
 * @Description: description
 */
import typescript from '@rollup/plugin-typescript';
import commonjs from '@rollup/plugin-commonjs';
import { getBabelOutputPlugin } from '@rollup/plugin-babel';
import image from '@rollup/plugin-image';
import postcss from 'rollup-plugin-postcss';
import json from '@rollup/plugin-json';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import url from '@rollup/plugin-url';

export default {
	input: 'src/index.ts',
	output: {
		file: 'dist/index.js',
		format: 'esm',
	},
	 external: ['react', 'react-dom'],
	plugins: [
		json(),
		image(),
		url({
			limit: 30 * 1024, // inline files < 10k, copy files > 10k
		}),
		postcss({
			extract: false,
			use: ['sass', 'less'],
			plugins: [
				autoprefixer(),
				cssnano(),
			]
		}),
		typescript({  // 详细配置TypeScript
			tsconfig: "./tsconfig.json",
			include: ["**/*.ts", "**/*.tsx"],
			exclude: ["node_modules/**"]
		}),
		commonjs(),
		getBabelOutputPlugin({
			presets: ['@babel/preset-env']
		}),
	],
};
