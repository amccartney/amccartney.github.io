export const prerender = true;

import { error } from '@sveltejs/kit';
import legacy from '$lib/data/legacy-projects.json' with { type: 'json' };

/** @type {import('./$types').PageLoad} */
export function load({ params }){
    const project = legacy.find(p => p.slug === params.slug);
    if (!project) throw error(404, 'Project not found');
    return { project };
}
