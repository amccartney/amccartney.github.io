<script>
    export let tag;
    export let title;
    export let desc;
    export let link;
</script>

<div class="project-card group-hover:scale-105 transition-transform duration-300 flex">
    <div class="project-img relative">
        <img src="https://placehold.co/600x400/EEE/31343C" alt="Profile Image" class="w-full h-full object-cover"/>
    </div>
    <div class="p-4">
         <h4>{title}</h4>
        <a href={link} class="project-link">View Project</a>
    </div>
   
</div>

<style>
    .project-card {
        background: #f7f7f7;
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.03);
        flex: 1;
        display: flex;
        flex-direction: row;
    }
    .project-img {
        max-width: 80px;
        border-bottom-left-radius: 12px;
        border-top-left-radius: 12px;
        overflow: hidden;
    }
    .project-tag {
        background: var(--olivetti-red );
        color: var(--white);
        font-size: 0.85rem;
        font-weight: 600;
        padding: 0.3rem 0.8rem;
        border-radius: 6px;
        align-self: flex-start;
        margin-bottom: 1rem;
        position: absolute
    }
    .project-link {
        margin-top: auto;
        color: var(--olivetti-blue);
        text-decoration: none;
        font-weight: 500;
        font-size: var(--text-sm);
    }

    .project-card h4 {
        margin: 0 0 0.5rem 0;
        font-size: var(--text-sm);
        font-weight: 600;
        color: var(--olivetti-charcoal);
        text-transform: uppercase;
        line-height: 1.2;
    }
</style>