<script>
	import Button from "$lib/components/Button.svelte";
	import Section from "$lib/components/Section.svelte";
    import Card from "$lib/components/Card.svelte";
	// Add any needed imports or data here
	import projects	 from '../lib/data/projects.json';
</script>

<svelte:head>
    <title>Allison McCartney</title>
    <meta name="description" content="Allison McCartney - Graphics + Data" />
</svelte:head>

<Section className="hero">
	<div class="grid">
		<div class="hero-text">
			<p>
				I'm a story editor on the Graphics team at The New York Times. I edit, manage and design data-centered visuals alongside a team of talented designers, developers and journalists focused mostly on live election results and trackers. 
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
    /* Basic styles for layout and typography */
    body {
        font-family: 'Inter', sans-serif;
        background: #faf9f6;
        color: #222;
        margin: 0;
    }
    nav a {
        margin-left: 2rem;
        text-decoration: none;
        color: #222;
        font-weight: 500;
    }
    .hero {
        display: flex;
        justify-content: space-between;
        align-items: center;
        max-width: 1100px;
        margin: 3rem auto 2rem auto;
        padding: 0 2rem;
    }
    .hero-text {
        max-width: 600px;
    }
    .hero-text h1 {
        font-size: 2.5rem;
        font-weight: var(--font-weight-black);
        margin-bottom: 1rem;
		margin-top: 0;
		line-height: 1.2;
    }
    .hero-text p {
        font-size: 1.1rem;
        margin-bottom: 0;
        margin-top: 0;
    }
    .availability {
        display: flex;
        align-items: center;
        font-size: 0.95rem;
        color: #d32f2f;
        font-weight: 600;
    }
    .badge {
        width: 10px;
        height: 10px;
        background: #d32f2f;
        border-radius: 50%;
        display: inline-block;
        margin-right: 0.5rem;
    }
    .profile-img img {
        width: 100%;
        height: auto;
        object-fit: cover;
        border-radius: 16px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.06);
        background: linear-gradient(135deg, #f8e1e1 0%, #e3e6f3 100%);
    }
    .recent-work {
        background: #fff;
        padding: 2.5rem 0;
        max-width: 1100px;
        margin: 0 auto;
    }
    .recent-work h3 {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 2rem;
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
    .project-tag {
        background: #d32f2f;
        color: #fff;
        font-size: 0.85rem;
        font-weight: 600;
        padding: 0.3rem 0.8rem;
        border-radius: 6px;
        align-self: flex-start;
        margin-bottom: 1rem;
    }
    .project-link {
        margin-top: auto;
        color: #1976d2;
        text-decoration: none;
        font-weight: 500;
    }
    .all-projects {
        margin: 2rem auto 0 auto;
        display: block;
        padding: 0.7rem 2rem;
        border: 1px solid #d32f2f;
        background: #fff;
        color: #d32f2f;
        font-weight: 600;
        border-radius: 8px;
        cursor: pointer;
    }
    .cta {
        background: #f5f3ef;
        padding: 3rem 0;
        text-align: center;
    }
    .cta h3 {
        font-size: 1.4rem;
        font-weight: 700;
        margin-bottom: 1rem;
    }
    .cta p {
        font-size: 1.05rem;
        margin-bottom: 2rem;
    }
    .cta-buttons button {
        margin: 0 0.7rem;
        padding: 0.8rem 2rem;
        border-radius: 8px;
        border: none;
        font-weight: 600;
        cursor: pointer;
    }
    .cta-buttons .primary {
        background: #d32f2f;
        color: #fff;
    }
    
    @media (max-width: 900px) {
        .hero, .header-content, .recent-work {
            flex-direction: column;
            align-items: flex-start;
        }
        .profile-img img {
            width: 100%;
            height: auto;
        }
    }

    @media (min-width: 800px) {
        .projects {
            column-count: 4;
        }
        .hero-text p {
            margin-bottom: 1.5rem;
            margin-top: 1.5rem;
        }
    }

    @media (min-width: 1200px) {
        .projects {
            column-count: 5;
        }
    }
</style>