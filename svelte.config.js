import adapter from '@sveltejs/adapter-static';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const legacyProjects = JSON.parse(
	readFileSync(join(__dirname, 'src/lib/data/legacy-projects.json'), 'utf8')
);

const projectSlugs = legacyProjects.map((project) => `/projects/${project.slug}`);

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter(),
		prerender: {
			entries: ['*', ...projectSlugs]
		}
	}
};

export default config;
