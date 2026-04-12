<script>
	import { page } from '$app/state';
	import logo from '$lib/images/svelte-logo.svg';
	import github from '$lib/images/github.svg';
	import nav_items from '../../routes/nav-items.json' with { type: 'json' };
</script>

<header>
    <div class="header-content">
		<div class="brand">
			<!-- <ProfileMark size={36} /> -->
			<h2><a href="/">Allison McCartney</a></h2>
		</div>
    </div>
</header>

<style>
	header {
		position: sticky;
		top: 0;
		background: var(--background);
		border-bottom: 1px solid var(--border);
		z-index: 10;
	}

	.header-content {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 10px 20px;
		max-width: 960px;
		margin: 0 auto;
	}

	.header-content h2 {
		/* font-size: 1.5rem; */
		margin: 0;
		font-weight: 900;
		color: var(--olivetti-charcoal);
		text-transform: uppercase;
	}

	.brand { display: flex; align-items: center; gap: 12px; }
</style>