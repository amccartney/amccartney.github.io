<script>
	import { onMount } from "svelte";
	import projectImageDimensions from "$lib/data/projectImageDimensions";

	export let title;
	export let link;
	export let image;
	export let index;

	let colors = ["red", "blue", "green"];
	let mediaElement;
	let isImageLoaded = false;

	$: isVideo = typeof image === "string" && /\.mp4$/i.test(image);
	$: poster = isVideo ? image.replace(/\.mp4$/i, "-poster.webp") : undefined;
	$: imageDimensions = image ? projectImageDimensions[image] : null;
	$: imageStyle = imageDimensions
		? `--image-width: ${imageDimensions.width}; --image-height: ${imageDimensions.height};`
		: undefined;
	$: isPriority = typeof index === "number" && index < 4;
	$: if (image) {
		isImageLoaded = false;
	}

	onMount(() => {
		if (!mediaElement) return;

		if (isVideo) {
			if (mediaElement.readyState >= 2) {
				isImageLoaded = true;
			}
			return;
		}

		if (mediaElement.complete) {
			isImageLoaded = true;
		}
	});

	function nextColor() {
		let i = index % colors.length;
		return colors[i];
	}

	function markLoaded() {
		isImageLoaded = true;
	}
</script>

<div class="project-card transition-transform duration-300">
    <div class="project-img relative mb-4">
        <!-- <div class="project-tag left-4 top-4">{tag}</div> -->
    </div>
    <article class="tile {nextColor()}">
        {#if image}
        <a
            class="tile-link"
            class:has-dimensions={!!imageDimensions}
            class:is-loaded={isImageLoaded}
            href={link}
            aria-label={title}
            style={imageStyle}
        >
            {#if isVideo}
            <video
                bind:this={mediaElement}
                src={image}
                poster={poster}
                width={imageDimensions?.width}
                height={imageDimensions?.height}
                autoplay
                muted
                loop
                playsinline
                preload={isPriority ? "auto" : "metadata"}
                class:loaded={isImageLoaded}
                on:loadeddata={markLoaded}
                on:error={markLoaded}
            ></video>
            {:else}
            <img
                bind:this={mediaElement}
                src={image}
                alt={title}
                loading={isPriority ? "eager" : "lazy"}
                fetchpriority={isPriority ? "high" : "auto"}
                decoding="async"
                width={imageDimensions?.width}
                height={imageDimensions?.height}
                class:loaded={isImageLoaded}
                on:load={markLoaded}
                on:error={markLoaded}
            />
            {/if}
        </a>
        {/if}
        <a 
        class="title"
        class:no-image={!image}
        href={link} 
        aria-label={title}>
            {title}
        </a>
    </article>
</div>

<style>
    .project-card {
        border-bottom: 1px solid var(--border);
        margin-bottom: 40px;
        cursor: pointer;
    }
    :global(.tile) {
        display: inline-block;
        width: 100%;
        break-inside: avoid;
        -webkit-column-break-inside: avoid;
        background: transparent;
        position: relative;
    }

    .tile-link {
        display: block;
        width: 100%;
        overflow: hidden;
        position: relative;
        background: #f1f1ef;
    }
    .tile-link.has-dimensions {
        aspect-ratio: var(--image-width) / var(--image-height);
    }
    .tile-link::before {
        content: "";
        position: absolute;
        inset: 0;
        z-index: 0;
        background: linear-gradient(90deg, #ece9e4 25%, #f6f4f0 50%, #ece9e4 75%);
        background-size: 200% 100%;
        animation: image-placeholder 1.2s ease-in-out infinite;
        transition: opacity 200ms ease;
    }
    .tile-link.is-loaded::before {
        opacity: 0;
        animation: none;
    }

    .tile img,
    .tile video {
        display: block;
        width: 100%;
        height: auto;
        position: relative;
        z-index: 1;
        opacity: 0;
        object-fit: cover;
        filter: grayscale(100%) contrast(0.95);
        transition: opacity 200ms ease, transform 300ms ease, filter 300ms ease;
    }
    .tile video {
        pointer-events: none;
    }
    .tile img.loaded,
    .tile video.loaded {
        opacity: 1;
    }
    .tile .tile-link::after {
        content: "";
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
        z-index: 2;
        background-color: #595652; /* Semi-transparent Red */
        mix-blend-mode: overlay; /* Optional: blends color with image */
        pointer-events: none;
    }
    /* .tile.red::after {
        background-color: var(--olivetti-red);
    }
    .tile.blue::after {
        background-color: var(--olivetti-teal);
    }
    .tile.green::after {
        background-color: var(--olivetti-green);
    }
    .tile.yellow::after {
        background-color: var(--olivetti-yellow);
    } */

    .tile:hover::after {
        background-color: rgba(255, 0, 0, 0); /* Fully Transparent on Hover */
    }

    .tile:hover img,
    .tile:hover video {
        transform: scale(1.03);
        filter: grayscale(0%) contrast(1);
    }

    .title {
        display: block;
        padding: 10px 0;
        font-size: var(--text-sm);
        color: var(--olivetti-charcoal);
        text-wrap: pretty;
    }
    .title:hover {
        text-decoration: none;
    }
    .title.no-image {
        padding: 20px 10px;
        background-color: var(--background);
        margin-bottom: 20px;
    }

    .tag {
        font-size: 0.75rem;
        color: var(--muted-foreground);
        
        padding-bottom: 0.6rem;
        display: inline-block;
        width: 100%;
    }

    @keyframes image-placeholder {
        from {
            background-position: 200% 0;
        }
        to {
            background-position: -200% 0;
        }
    }
</style>
