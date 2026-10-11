// CommonJS build for Node `require()`. ES module consumers are served the
// raw `src/main.js` via the `exports` field in package.json, so no ESM
// dist build is needed.
export default {
	input: 'src/main.js',
	output: {
		file: 'dist/signals.cjs',
		format: 'cjs',
		exports: 'default'
	}
};
