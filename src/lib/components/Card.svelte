<script>
    export let title;
    export let link;
    export let image;
    export let index;

    console.log(index)

    let colors = [
        "red",
        "blue",
        "green",
    ];

    function nextColor() {
        let i = index % colors.length;
        return colors[i];   
    }
</script>

<div class="project-card transition-transform duration-300">
    <div class="project-img relative mb-4">
        <!-- <div class="project-tag left-4 top-4">{tag}</div> -->
    </div>
    <article class="tile {nextColor()}">
        {#if image}
        <a class="tile-link" href={link} aria-label={title}>
            <img src={image} alt={title} loading="lazy" />
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
    }

    .tile img {
        display: block;
        width: 100%;
        height: auto;
        object-fit: cover;
        filter: grayscale(100%) contrast(0.95);
        transition: transform 300ms ease, filter 300ms ease;
    }
    .tile .tile-link::after {
        content: "";
        position: absolute;
        top: 0; left: 0; width: 100%; height: 100%;
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

    .tile:hover img {
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
</style>