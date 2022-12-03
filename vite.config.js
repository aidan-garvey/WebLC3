import { sveltekit } from '@sveltejs/kit/vite';
import yaml from "@rollup/plugin-yaml";

/** @type {import('vite').UserConfig} */
const config = {
	plugins: [
		sveltekit(), yaml(),
		{
			name: "configure-response-headers",
			configureServer: (server) => {
				server.middlewares.use((_req, res, next) => {
				res.setHeader("Cross-Origin-Embedder-Policy", "credentialless");
				res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
				next();
				});
			}
		}
	]
};

export default config;
