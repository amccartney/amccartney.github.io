import adapter from '@sveltejs/adapter-static';
import legacyProjects from './src/lib/data/legacy-projects.json' assert { type: 'json' };

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
