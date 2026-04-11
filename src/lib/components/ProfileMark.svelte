<script>
  export let size = 36;
  export let title = 'Allison McCartney';
</script>

<div class="profile" aria-hidden="true" style="width:{size}px; height:{size}px">
  <svg viewBox="0 0 100 100" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" class="mark" role="img" aria-label={title}>
    <defs>
      <linearGradient id="g" x1="0" x2="1">
        <stop offset="0%" stop-color="var(--olivetti-rose)" />
        <stop offset="100%" stop-color="var(--olivetti-amber)" />
      </linearGradient>
    </defs>
    <circle cx="50" cy="50" r="46" fill="var(--background)" stroke="url(#g)" stroke-width="6" />
    <g transform="translate(50,50)" class="initials" fill="url(#g)">
      <path d="M-18,6 L-6,-20 L-6,6 L6,-20 L6,6 L18,6 L18,18 L-18,18 Z" opacity="0.95" />
    </g>
  </svg>
</div>

<style>
  .profile { display: inline-block; vertical-align: middle; }
  .mark { transition: transform 220ms ease, filter 220ms ease; will-change: transform; }
  .profile:hover .mark { transform: scale(1.07); filter: drop-shadow(0 4px 8px rgba(0,0,0,0.08)); }
  .initials { transform-origin: 50% 50%; transition: transform 240ms ease; }
  .profile:hover .initials { transform: translateY(-2px); }
</style>
