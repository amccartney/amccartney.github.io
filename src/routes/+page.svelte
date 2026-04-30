<script>
	import Button from "$lib/components/Button.svelte";
	import Section from "$lib/components/Section.svelte";
    import Card from "$lib/components/Card.svelte";
	// Add any needed imports or data here
	import projects	 from '../lib/data/projects.json' with { type: 'json' };
</script>

<svelte:head>
    <title>Allison McCartney</title>
    <meta name="description" content="Allison McCartney - Graphics + Data" />
</svelte:head>

<Section className="hero">
	<div class="grid">
		<div class="hero-text">
			<p class="intro">
				I'm a story editor on the Graphics team at The New York Times. I edit, manage and design data-centered visuals alongside a team of talented designers, developers and journalists focused mostly on live election results and trackers. <a href="/resume">(っ◔◡◔)っ ♥ More about me ♥</a>
			</p>
		</div>
	</div>
    
</Section>

<Section className="recent-work" background="#fff">
    <!-- Gallery / tiled projects -->
    <div class="projects mb-12">
        {#each projects as project, index}
            <Card { ...project } {index} />
        {/each}
    </div>
</Section>


<style>
    .hero {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1100px;
        margin: 3rem auto 2rem auto;
        padding: 0 2rem;
    }

    .recent-work {
        background: #fff;
        padding: 2.5rem 0;
        max-width: 1100px;
        margin: 0 auto;
    }

    .projects {
        /* Masonry-like tiled layout using CSS columns */
        column-gap: 20px;
        column-count: 2;
        width: 100%;
        max-width: 1000px;
        margin: 0 auto;
    }

    .project-card {
        background: #f7f7f7;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        flex: 1;
        display: flex;
        flex-direction: column;
    }

    @media (max-width: 900px) {
        .hero {
            flex-direction: column;
            align-items: flex-start;
        }
    }

    @media (min-width: 800px) {
        .projects {
            column-count: 4;
        }
    }

    @media (min-width: 1200px) {
        .projects {
            column-count: 5;
        }
    }
</style>