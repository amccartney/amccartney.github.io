import path from "node:path";
import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { generateProjectImageDimensions } from "./scripts/generate-project-image-dimensions.mjs";

function projectImageDimensionsPlugin() {
	let rootDir = process.cwd();
	let server;
	let generation = Promise.resolve();

	function shouldRegenerate(filePath) {
		const relativePath = path.relative(rootDir, filePath);

		if (!relativePath || relativePath.startsWith("..")) {
			return false;
		}

		const normalizedPath = relativePath.split(path.sep).join("/");

		return (
			normalizedPath === "src/lib/data/projects.json" ||
			normalizedPath === "src/lib/data/fine-art-projects.json" ||
			normalizedPath.startsWith("static/projects/")
		);
	}

	function queueGeneration({ reload = false } = {}) {
		const task = generation.then(async () => {
			try {
				const result = await generateProjectImageDimensions({ rootDir });

				for (const warning of result.warnings) {
					console.warn(`[project-image-dimensions] Skipped ${warning}`);
				}

				if (result.changed) {
					console.log(
						`[project-image-dimensions] Updated ${result.outputPath} with ${result.count} image entries.`
					);
				}

				if (reload && result.changed && server) {
					server.ws.send({ type: "full-reload" });
				}
			} catch (error) {
				console.error("[project-image-dimensions] Failed to generate image dimensions.");
				throw error;
			}
		});

		generation = task.catch(() => {});

		return task;
	}

	return {
		name: "project-image-dimensions",
		async buildStart() {
			rootDir = process.cwd();
			await queueGeneration();
		},
		configureServer(devServer) {
			server = devServer;
			rootDir = server.config.root;

			const handleFileEvent = (filePath) => {
				if (shouldRegenerate(filePath)) {
					void queueGeneration({ reload: true });
				}
			};

			server.watcher.on("add", handleFileEvent);
			server.watcher.on("change", handleFileEvent);
			server.watcher.on("unlink", handleFileEvent);
		}
	};
}

export default defineConfig({
	plugins: [projectImageDimensionsPlugin(), sveltekit()]
});
