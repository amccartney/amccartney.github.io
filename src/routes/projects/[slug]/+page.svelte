<script>
  export let data;
  const project = data.project;

  function parseYouTube(url){
    if (!url) return null;
    try{
      const u = new URL(url);
      const host = u.hostname.replace('www.','');
      if (host.includes('youtube.com')) return u.searchParams.get('v');
      if (host === 'youtu.be') return u.pathname.slice(1);
    } catch(e){
      const m = url.match(/(?:youtube\.com\/embed\/|youtube\.com\/watch\?v=|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
      return m ? m[1] : null;
    }
    return null;
  }

  const youtubeId = parseYouTube(project.lead);
  const isYouTube = Boolean(youtubeId);
</script>

<svelte:head>
  <title>{project.title} — Allison McCartney</title>
</svelte:head>

<article class="legacy-page">
  <header>
    <h1>{project.title}</h1>
    {#if isYouTube}
      <div class="video-wrap">
        <iframe
          src={`https://www.youtube.com/embed/${youtubeId}?rel=0`}
          frameborder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
          title={project.title}
        ></iframe>
      </div>
    {:else if project.lead}
      <img src={project.lead} alt="{project.title} lead image" class="lead" />
    {/if}
  </header>

  <section class="content" bind:this={contentSection}>
    <p class="description">
        {@html project.content}
    </p>
    <p class="credits">
        {@html project.credits}
    </p>  
  </section>

  {#if project.link}
  <footer class="meta">
    <a href={project.link} target="_blank" rel="noopener">See page</a>
  </footer>
  {/if}
</article>

<style>
  .legacy-page h1 {
    font-weight: bold;
    color: var(--olivetti-charcoal);
    letter-spacing: -1px;
    font-size: 30px;
    margin:0 0 12px;
  }
  .legacy-page{ max-width:800px; margin: 20px auto; padding:0 20px; width: 100%; }
  .lead{ width:100%; height:auto; border-radius:6px; margin:10px 0 18px; display:block; }
  .video-wrap{ position:relative; width:100%; padding-top:56.25%; border-radius:8px; overflow:hidden; margin:10px 0 18px; }
  .video-wrap iframe{ position:absolute; top:0; left:0; width:100%; height:100%; border:0; }
  .content { margin-top:40px; }
  .content p { line-height:1.6; margin-bottom:1em;   }
  .meta{ margin-top:28px; color:var(--olivetti-charcoal); }
  @media (min-width: 800px) {
    .legacy-page { margin: 40px auto;}
    .legacy-page h1 {
        font-size: 36px;
    }
  }
  .credits {
        font-size: 0.9rem;
        color: var(--olivetti-charcoal);
        margin-top: 2rem;
    }
    .description {
        color: var(--olivetti-charcoal);
    }
    
</style>
