<script>
	import { onDestroy, onMount } from 'svelte';

	const RADIUS_MILES = 0.2;
	const SF_BBOX = { minLon: -122.52, minLat: 37.70, maxLon: -122.35, maxLat: 37.84 };
	const UNMETERED_CSV = '/data/Motorcycle_Parking_-_Unmetered_20260423.csv';
	const METERED_CSV = '/data/Metered_motorcycle_spaces_20260423.csv';

	/** @typedef {{ lon: number; lat: number; label: string; kind: 'metered' | 'unmetered' }} ParkingSpot */

	/** @type {HTMLDivElement | undefined} */
	let mapContainer = $state();
	/** @type {import('maplibre-gl').Map | null} */
	let map = $state(null);
	/** @type {import('maplibre-gl').Marker | null} */
	let searchMarker = $state(null);

	let searchQuery = $state('');
	let loading = $state(false);
	let mapReady = $state(false);
	let geocodeError = $state('');
	/** @type {ParkingSpot[]} */
	let allSpots = $state([]);
	let dataError = $state('');

	/** @type {null | { address: string; lon: number; lat: number; closest: ParkingSpot & { distanceMiles: number }; withinUnmetered: number; withinMetered: number }} */
	let searchSummary = $state(null);

	/**
	 * @param {string} line
	 */
	function splitCsvLine(line) {
		const fields = [];
		let cur = '';
		let i = 0;
		let inQ = false;
		while (i < line.length) {
			const c = line[i];
			if (inQ) {
				if (c === '"') {
					if (line[i + 1] === '"') {
						cur += '"';
						i += 2;
						continue;
					}
					inQ = false;
					i++;
					continue;
				}
				cur += c;
				i++;
				continue;
			}
			if (c === '"') {
				inQ = true;
				i++;
				continue;
			}
			if (c === ',') {
				fields.push(cur);
				cur = '';
				i++;
				continue;
			}
			cur += c;
			i++;
		}
		fields.push(cur);
		return fields;
	}

	/**
	 * @param {string} text
	 * @returns {ParkingSpot[]}
	 */
	function parseUnmeteredCsv(text) {
		const lines = text.trim().split(/\r?\n/);
		if (lines.length < 2) return [];
		const header = splitCsvLine(lines[0]);
		const iShape = header.indexOf('shape');
		const iLoc = header.indexOf('LOCATION_');
		if (iShape < 0) return [];
		/** @type {ParkingSpot[]} */
		const out = [];
		for (let li = 1; li < lines.length; li++) {
			const row = splitCsvLine(lines[li]);
			const shape = row[iShape];
			if (!shape) continue;
			const m = shape.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
			if (!m) continue;
			const lon = Number(m[1]);
			const lat = Number(m[2]);
			if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
			const label = (iLoc >= 0 && row[iLoc]) ? row[iLoc] : 'Unmetered motorcycle parking';
			out.push({ lon, lat, label, kind: 'unmetered' });
		}
		return out;
	}

	/**
	 * @param {string} text
	 * @returns {ParkingSpot[]}
	 */
	function parseMeteredCsv(text) {
		const lines = text.trim().split(/\r?\n/);
		if (lines.length < 2) return [];
		const header = splitCsvLine(lines[0]);
		const iLoc = header.indexOf('Location');
		const iNum = header.indexOf('STREET_NUM');
		const iName = header.indexOf('STREETNAME');
		if (iLoc < 0) return [];
		/** @type {ParkingSpot[]} */
		const out = [];
		for (let li = 1; li < lines.length; li++) {
			const row = splitCsvLine(lines[li]);
			const loc = row[iLoc];
			if (!loc) continue;
			const m = loc.match(/\(\s*([\d.]+)\s*,\s*(-?[\d.]+)\s*\)/);
			if (!m) continue;
			const lat = Number(m[1]);
			const lon = Number(m[2]);
			if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
			let label = 'Metered motorcycle space';
			if (iNum >= 0 && iName >= 0) {
				const street = `${row[iNum] ?? ''} ${row[iName] ?? ''}`.trim();
				if (street) label = street;
			}
			out.push({ lon, lat, label, kind: 'metered' });
		}
		return out;
	}

	/**
	 * @param {number} lat1
	 * @param {number} lon1
	 * @param {number} lat2
	 * @param {number} lon2
	 */
	function haversineMiles(lat1, lon1, lat2, lon2) {
		const R = 3959;
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLon = ((lon2 - lon1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos((lat1 * Math.PI) / 180) *
				Math.cos((lat2 * Math.PI) / 180) *
				Math.sin(dLon / 2) ** 2;
		return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	}

	/**
	 * @param {number} lon
	 * @param {number} lat
	 * @param {number} rMiles
	 * @param {number} [steps]
	 * @returns {[number, number][]}
	 */
	function milesToCircleRing(lon, lat, rMiles, steps = 72) {
		const latRad = (lat * Math.PI) / 180;
		const degLatPerMi = 1 / 69.172;
		const degLonPerMi = 1 / (69.172 * Math.cos(latRad));
		/** @type {[number, number][]} */
		const coords = [];
		for (let i = 0; i <= steps; i++) {
			const t = (i / steps) * 2 * Math.PI;
			const eastMi = rMiles * Math.cos(t);
			const northMi = rMiles * Math.sin(t);
			coords.push([lon + eastMi * degLonPerMi, lat + northMi * degLatPerMi]);
		}
		return coords;
	}

	/**
	 * @param {number} lon
	 * @param {number} lat
	 */
	function pointInSfBbox(lon, lat) {
		return (
			lon >= SF_BBOX.minLon &&
			lon <= SF_BBOX.maxLon &&
			lat >= SF_BBOX.minLat &&
			lat <= SF_BBOX.maxLat
		);
	}

	/**
	 * @param {ParkingSpot[]} spots
	 * @param {'metered' | 'unmetered'} kind
	 */
	function spotsToFeatureCollection(spots, kind) {
		return {
			type: 'FeatureCollection',
			features: spots
				.filter((s) => s.kind === kind)
				.map((s) => ({
					type: 'Feature',
					properties: { label: s.label, kind: s.kind },
					geometry: { type: 'Point', coordinates: [s.lon, s.lat] }
				}))
		};
	}

	/**
	 * @param {number} lon
	 * @param {number} lat
	 * @param {ParkingSpot[]} spots
	 */
	function summarizeAroundPoint(lon, lat, spots) {
		/** @type {(ParkingSpot & { distanceMiles: number }) | null} */
		let closest = null;
		let minD = Infinity;
		let withinUnmetered = 0;
		let withinMetered = 0;
		for (const s of spots) {
			const d = haversineMiles(lat, lon, s.lat, s.lon);
			if (d < minD) {
				minD = d;
				closest = { ...s, distanceMiles: d };
			}
			if (d <= RADIUS_MILES) {
				if (s.kind === 'unmetered') withinUnmetered++;
				else withinMetered++;
			}
		}
		return { closest, withinUnmetered, withinMetered };
	}

	/**
	 * @param {string} query
	 */
	async function geocodeSf(query) {
		const q = query.trim();
		if (!q) return null;
		const bbox = `${SF_BBOX.minLon},${SF_BBOX.minLat},${SF_BBOX.maxLon},${SF_BBOX.maxLat}`;
		const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(q + ', San Francisco')}&bbox=${bbox}&limit=10`;
		const res = await fetch(url);
		if (!res.ok) throw new Error('Geocoding request failed');
		const data = await res.json();
		const features = data.features ?? [];
		for (const f of features) {
			const coords = f.geometry?.coordinates;
			if (!coords || coords.length < 2) continue;
			const [flon, flat] = coords;
			if (!pointInSfBbox(flon, flat)) continue;
			const p = f.properties ?? {};
			const parts = [p.name, p.street, p.postcode, p.city].filter(Boolean);
			const address = parts.length ? parts.join(', ') : q;
			return { lon: flon, lat: flat, address };
		}
		return null;
	}

	onMount(() => {
		let cancelled = false;

		(async () => {
			await import('maplibre-gl/dist/maplibre-gl.css');
			const maplibregl = (await import('maplibre-gl')).default;

			let unmetered = [];
			let metered = [];
			try {
				const [unText, mText] = await Promise.all([
					fetch(UNMETERED_CSV).then((r) => {
						if (!r.ok) throw new Error('Could not load unmetered parking data');
						return r.text();
					}),
					fetch(METERED_CSV).then((r) => {
						if (!r.ok) throw new Error('Could not load metered parking data');
						return r.text();
					})
				]);
				if (cancelled) return;
				unmetered = parseUnmeteredCsv(unText);
				metered = parseMeteredCsv(mText);
				allSpots = [...unmetered, ...metered];
			} catch (e) {
				if (!cancelled) dataError = e instanceof Error ? e.message : 'Failed to load parking data';
				return;
			}

			if (cancelled || !mapContainer) return;

			const combinedSpots = [...unmetered, ...metered];

			const style = {
				version: 8,
				sources: {
					osm: {
						type: 'raster',
						tiles: ['https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}@2x.png'],
						tileSize: 256,
						attribution:
							'© <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a> © <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a>'
					}
				},
				layers: [{ id: 'osm', type: 'raster', source: 'osm' }]
			};

			const m = new maplibregl.Map({
				container: mapContainer,
				style,
				center: [-122.44, 37.765],
				zoom: 11,
				maxBounds: [
					[SF_BBOX.minLon - 0.08, SF_BBOX.minLat - 0.08],
					[SF_BBOX.maxLon + 0.08, SF_BBOX.maxLat + 0.08]
				],
				attributionControl: false
			});
			map = m;
			m.addControl(new maplibregl.NavigationControl(), 'top-right');
			m.dragPan.disable();
			m.scrollZoom.disable();
			m.fitBounds([
				[SF_BBOX.minLon - 0.08, SF_BBOX.minLat - 0.08],
				[SF_BBOX.maxLon + 0.08, SF_BBOX.maxLat + 0.08]
			]);
			// m.addControl(new maplibregl.AttributionControl({ compact: true }));

			m.on('load', () => {
				if (cancelled) return;
				m.addSource('unmetered', {
					type: 'geojson',
					data: /** @type {any} */ (spotsToFeatureCollection(combinedSpots, 'unmetered'))
				});
				m.addLayer({
					id: 'unmetered-circles',
					type: 'circle',
					source: 'unmetered',
					paint: {
						'circle-radius': 3,
						'circle-color': 'rgba(44,44,44,.8)',
						'circle-stroke-width': 1,
						'circle-stroke-color': '#2c2c2c'
					}
				});

				m.addSource('metered', {
					type: 'geojson',
					data: /** @type {any} */ (spotsToFeatureCollection(combinedSpots, 'metered'))
				});
				m.addLayer({
					id: 'metered-circles',
					type: 'circle',
					source: 'metered',
					paint: {
						'circle-radius': 3,
						'circle-color': 'rgba(255,107,53,.6)',
						'circle-stroke-width': 1,
						'circle-stroke-color': '#ff6b35'
					}
				});

				m.addSource('search-radius', {
					type: 'geojson',
					data: { type: 'FeatureCollection', features: [] }
				});
				m.addLayer({
					id: 'search-radius-fill',
					type: 'fill',
					source: 'search-radius',
					paint: { 'fill-color': '#2c2c2c', 'fill-opacity': 0.12 }
				});
				m.addLayer({
					id: 'search-radius-line',
					type: 'line',
					source: 'search-radius',
					paint: { 'line-color': '#2c2c2c', 'line-width': 2, 'line-opacity': 0.7 }
				});
				mapReady = true;
			});
		})();

		return () => {
			cancelled = true;
		};
	});

	onDestroy(() => {
		searchMarker?.remove();
		searchMarker = null;
		map?.remove();
		map = null;
	});

	async function handleSearch() {
		geocodeError = '';
		searchSummary = null;
		const q = searchQuery.trim();
		if (!q) {
			geocodeError = 'Enter an address or place in San Francisco.';
			return;
		}
		if (!map || !mapReady || allSpots.length === 0) {
			geocodeError = dataError || 'Map is still loading. Try again in a moment.';
			return;
		}

		loading = true;
		try {
			const maplibregl = (await import('maplibre-gl')).default;
			const hit = await geocodeSf(q);
			if (!hit) {
				geocodeError =
					'No result inside San Francisco city limits. Try a street address or neighborhood in SF.';
				return;
			}

			const { lon, lat, address } = hit;
			const { closest, withinUnmetered, withinMetered } = summarizeAroundPoint(
				lon,
				lat,
				allSpots
			);

			if (searchMarker) {
				searchMarker.remove();
				searchMarker = null;
			}
			searchMarker = new maplibregl.Marker({ color: '#2c2c2c' })
				.setLngLat([lon, lat])
				.addTo(map);

			const ring = milesToCircleRing(lon, lat, RADIUS_MILES);
			const radiusSrc = map.getSource('search-radius');
			if (radiusSrc && 'setData' in radiusSrc) {
				radiusSrc.setData({
					type: 'FeatureCollection',
					features: [
						{
							type: 'Feature',
							properties: {},
							geometry: { type: 'Polygon', coordinates: [ring] }
						}
					]
				});
			}

			map.flyTo({ center: [lon, lat], zoom: 15, essential: true });

			if (closest) {
				searchSummary = {
					address,
					lon,
					lat,
					closest,
					withinUnmetered,
					withinMetered
				};
			}
		} catch {
			geocodeError = 'Something went wrong while searching. Please try again.';
		} finally {
			loading = false;
		}
	}
</script>

<svelte:head>
	<title>San Francisco Motorcycle Parking Helper | Allison McCartney</title>
	<meta
		name="description"
		content="Map of metered and unmetered motorcycle parking in San Francisco with nearby search."
	/>
</svelte:head>

<div class="page">
	<h1>San Francisco Motorcycle Parking Helper</h1>

	<p class="intro">
		Search a location to find the closest dedicated motorcycle parking spots. Unmetered spaces are shown in
		<strong class="color-black">black</strong> and metered spaces in <strong class="color-orange">orange</strong>.
	</p>

	<form class="search-form" onsubmit={(e) => { e.preventDefault(); handleSearch(); }}>
		<label class="visually-hidden" for="address-search">Address in San Francisco</label>
		<input
			id="address-search"
			type="search"
			autocomplete="street-address"
			placeholder="e.g. 1 Ferry Building, San Francisco"
			bind:value={searchQuery}
			disabled={loading}
		/>
		<button type="submit" disabled={loading || !mapReady || !!dataError}>Search</button>
	</form>

	{#if dataError}
		<p class="error" role="alert">{dataError}</p>
	{/if}

	<div class="map-wrap" bind:this={mapContainer}></div>

	{#if geocodeError}
		<p class="error" role="alert">{geocodeError}</p>
	{/if}

	{#if searchSummary && searchSummary.closest}
		<section class="results" aria-live="polite">
			<p>
				The closest parking is a {searchSummary.closest.kind === 'metered' ? 'metered' : 'unmetered'} space at <strong>{searchSummary.closest.label}</strong> about <strong>{searchSummary.closest.distanceMiles.toFixed(2)} miles</strong> away.

			</p>
			
			{#if searchSummary.withinUnmetered > 0 || searchSummary.withinMetered > 0}
			<p>
				Within 0.2 miles there {searchSummary.withinUnmetered == 1 ? 'is' : 'are'} 
				<strong>{searchSummary.withinUnmetered} unmetered</strong> 
				and <strong class="color-orange">{searchSummary.withinMetered} metered</strong> 
				{searchSummary.withinMetered == 1 ? 'space' : 'spaces'}.
			</p>
			{/if}
		</section>
	{/if}

	<p class="attribution">
		Map tiles © <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>. Parking data: <a href="https://data.sfgov.org/browse?category=Transportation" target="_blank">City of San Francisco open data</a> as of April 23, 2026. Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.
	</p>
</div>

<style>
	.page {
		max-width: 960px;
		margin: 0 auto;
		padding: 2rem 1.25rem 3rem;
		box-sizing: border-box;
	}

	h1 {
		margin-top: 0;
	}

	.search-form {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
		align-items: center;
	}

	.search-form input {
		flex: 1 1 16rem;
		min-width: 0;
		padding: 0.5rem 0.75rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--card);
		color: var(--foreground);
	}

	.search-form button {
		padding: 0.5rem 1rem;
		border-radius: var(--radius);
		border: 1px solid var(--olivetti-charcoal);
		background: var(--olivetti-charcoal);
		color: var(--white);
		cursor: pointer;
	}

	.search-form button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.map-wrap {
		width: 100%;
		height: min(50vh, 520px);
		border-radius: var(--radius);
		border: 1px solid var(--border);
		overflow: hidden;
		background: var(--muted);
	}

	.error {
		color: var(--destructive);
		margin: 0.75rem 0;
	}

	.results {
		margin-top: 1.5rem;
		padding: 1rem 1.25rem;
		background: var(--card);
		border: 1px solid var(--border);
		border-radius: var(--radius);
	}

	.results p {
		margin: 0.5rem 0;
		font-size: var(--text-lg);
	}

	.kind {
		text-transform: lowercase;
	}

	.attribution {
		margin-top: 2rem;
		font-size: var(--text-sm);
		color: var(--muted-foreground);
	}

	.attribution code {
		font-size: 0.85em;
	}

	.color-black {
		color: var(--olivetti-charcoal);
	}

	.color-orange {
		color: var(--olivetti-orange);
	}
</style>
