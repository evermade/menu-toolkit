import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';

const umd = { format: 'umd', name: 'Menu', exports: 'named' };
const es = { format: 'es' };
const minify = {
	plugins: [terser()],
	banner: () => `/*!  ${pkg.name} ${pkg.version} */`,
};

export default {
	input: 'src/index.ts',
	output: [
		// Main files
		{ file: 'dist/index.js', ...umd },
		{ file: 'dist/index.esm.js', ...es },
		{ file: 'demo/dist/menu-toolkit.esm.js', ...es },
		// Minified versions
		{ file: 'dist/index.min.js', ...umd, ...minify },
		{ file: 'dist/index.esm.min.js', ...es, ...minify },
	],
	plugins: [
		typescript(),
		nodeResolve(),
		commonjs({ include: 'node_modules/**' }),
	],
};
