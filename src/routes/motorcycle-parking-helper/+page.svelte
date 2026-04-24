<script>
	import { onDestroy, onMount } from 'svelte';
	import {
		parkingSpotPopupHtml,
		rateAreaDescription,
		motorcycleDictionaryRateSummary,
		DICTIONARY_AUTOMOBILE_AND_SFPARK,
		DICTIONARY_PORT_AUTOMOBILE,
		DICTIONARY_TOUR_BUS
	} from '$lib/motorcycle-parking/spotDetails';
	import { findWalkingClosestSpot } from '$lib/motorcycle-parking/walkingClosest';
	import { meteredSpotsToClusteredFeatureCollection } from '$lib/motorcycle-parking/meteredClusters';
	import { formatTitleCase } from '$lib/formatTitleCase';

	const RADIUS_MILES = 0.2;
	const SF_BBOX = { minLon: -122.52, minLat: 37.70, maxLon: -122.35, maxLat: 37.84 };
	const UNMETERED_CSV = '/data/Motorcycle_Parking_-_Unmetered_20260423.csv';
	const METERED_CSV = '/data/Metered_motorcycle_spaces_20260423.csv';
	const GARAGES_CSV = '/data/sfmta_garages_motorcycle_rate_20260424.csv';

	/**
	 * @typedef {{
	 *   lon: number;
	 *   lat: number;
	 *   label: string;
	 *   kind: 'metered' | 'unmetered';
	 *   rateArea?: string;
	 *   meterType?: string;
	 *   smartMeter?: string;
	 *   sfparkArea?: string;
	 *   streetAddress?: string;
	 * }} ParkingSpot
	 */

	/** @typedef {{ rateArea: string; count: number; ms: number; ss: number; smartY: number; smartN: number }} MeterDistrictRow */

	/** @type {HTMLDivElement | undefined} */
	let mapContainer = $state();
	/** @type {import('maplibre-gl').Map | null} */
	let map = $state(null);
	/** @type {import('maplibre-gl').Marker | null} */
	let searchMarker = $state(null);
	/** @type {import('maplibregl').Marker | null} */
	let closestSpotMarker = null;

	let searchQuery = $state('');
	let loading = $state(false);
	let mapReady = $state(false);
	let geocodeError = $state('');
	/** @type {ParkingSpot[]} */
	let allSpots = $state([]);
	let dataError = $state('');

	/**
	 * @typedef {ParkingSpot & {
	 *   distanceMiles: number;
	 *   birdMiles: number;
	 *   usedWalkingRouting: boolean;
	 *   walkingDurationSec?: number;
	 *   walkingDistanceM?: number;
	 * }} ClosestSpotResult
	 */

	/** @type {null | { address: string; lon: number; lat: number; closest: ClosestSpotResult; withinUnmetered: number; withinMetered: number; meterDistricts: MeterDistrictRow[] }} */
	let searchSummary = $state(null);

	/** @type {import('maplibre-gl').Popup | null} */
	let hoverPopup = null;

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
		const iRate = header.indexOf('RATEAREA');
		const iMeterType = header.indexOf('METER_TYPE');
		const iSmart = header.indexOf('SMART_METE');
		const iPark = header.indexOf('SFPARKAREA');
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
			let streetAddress = '';
			if (iNum >= 0 && iName >= 0) {
				const street = `${row[iNum] ?? ''} ${row[iName] ?? ''}`.trim();
				if (street) {
					label = street;
					streetAddress = street;
				}
			}
			out.push({
				lon,
				lat,
				label,
				kind: 'metered',
				rateArea: iRate >= 0 ? (row[iRate] ?? '').trim() : '',
				meterType: iMeterType >= 0 ? (row[iMeterType] ?? '').trim() : '',
				smartMeter: iSmart >= 0 ? (row[iSmart] ?? '').trim() : '',
				sfparkArea: iPark >= 0 ? (row[iPark] ?? '').trim() : '',
				streetAddress
			});
		}
		return out;
	}

	/**
	 * @typedef {{ name: string; address: string; phone: string; facility_type: string; lon: number; lat: number; url: string }} GarageRow
	 */

	/**
	 * @param {string} text
	 * @returns {GarageRow[]}
	 */
	function parseGaragesCsv(text) {
		const lines = text.trim().split(/\r?\n/);
		if (lines.length < 2) return [];
		const header = splitCsvLine(lines[0]);
		const iName = header.indexOf('name');
		const iAddr = header.indexOf('address_line');
		const iCity = header.indexOf('city');
		const iState = header.indexOf('state');
		const iZip = header.indexOf('zip');
		const iPhone = header.indexOf('phone');
		const iType = header.indexOf('facility_type');
		const iLon = header.indexOf('lon');
		const iLat = header.indexOf('lat');
		const iUrl = header.indexOf('source_url');
		if (iLon < 0 || iLat < 0) return [];
		/** @type {GarageRow[]} */
		const out = [];
		for (let li = 1; li < lines.length; li++) {
			const row = splitCsvLine(lines[li]);
			if (!row.length) continue;
			const lon = Number(row[iLon]);
			const lat = Number(row[iLat]);
			if (!Number.isFinite(lon) || !Number.isFinite(lat)) continue;
			const line = [row[iAddr], row[iCity], row[iState], row[iZip]].filter(Boolean).join(', ');
			out.push({
				name: row[iName] ?? '',
				address: line,
				phone: row[iPhone] ?? '',
				facility_type: row[iType] ?? '',
				lon,
				lat,
				url: row[iUrl] ?? ''
			});
		}
		return out;
	}

	/**
	 * @param {GarageRow[]} garages
	 */
	function garagesToFeatureCollection(garages) {
		return {
			type: 'FeatureCollection',
			features: garages.map((g) => ({
				type: 'Feature',
				properties: {
					kind: 'garage',
					name: g.name,
					address: g.address,
					phone: g.phone,
					facility_type: g.facility_type,
					url: g.url
				},
				geometry: { type: 'Point', coordinates: [g.lon, g.lat] }
			}))
		};
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
	 * @param {ParkingSpot} s
	 */
	function spotToGeoFeature(s) {
		if (s.kind === 'unmetered') {
			return {
				type: 'Feature',
				properties: { kind: 'unmetered', address: formatTitleCase(s.label) },
				geometry: { type: 'Point', coordinates: [s.lon, s.lat] }
			};
		}
		return {
			type: 'Feature',
			properties: {
				kind: 'metered',
				address: formatTitleCase(s.streetAddress || s.label),
				rateArea: s.rateArea ?? '',
				meterType: s.meterType ?? '',
				smartMeter: s.smartMeter ?? '',
				sfparkArea: s.sfparkArea ?? ''
			},
			geometry: { type: 'Point', coordinates: [s.lon, s.lat] }
		};
	}

	/**
	 * @param {ParkingSpot[]} spots
	 * @param {'metered' | 'unmetered'} kind
	 */
	function spotsToFeatureCollection(spots, kind) {
		return {
			type: 'FeatureCollection',
			features: spots.filter((s) => s.kind === kind).map(spotToGeoFeature)
		};
	}

	/**
	 * @param {number} lon
	 * @param {number} lat
	 * @param {ParkingSpot[]} spots
	 * @param {number} radiusMiles
	 * @returns {MeterDistrictRow[]}
	 */
	function meterDistrictsWithinRadius(lon, lat, spots, radiusMiles) {
		/** @type {Map<string, { count: number; ms: number; ss: number; smartY: number; smartN: number }>} */
		const acc = new Map();
		for (const s of spots) {
			if (s.kind !== 'metered') continue;
			const d = haversineMiles(lat, lon, s.lat, s.lon);
			if (d > radiusMiles) continue;
			const key = (s.rateArea || '').trim() || 'Unknown';
			if (!acc.has(key)) {
				acc.set(key, { count: 0, ms: 0, ss: 0, smartY: 0, smartN: 0 });
			}
			const row = acc.get(key);
			if (!row) continue;
			row.count++;
			if (s.meterType === 'MS') row.ms++;
			else if (s.meterType === 'SS') row.ss++;
			if (s.smartMeter === 'Y') row.smartY++;
			else row.smartN++;
		}
		return [...acc.entries()]
			.map(([rateArea, v]) => ({ rateArea, ...v }))
			.sort((a, b) => b.count - a.count);
	}

	/**
	 * @param {number} lon
	 * @param {number} lat
	 * @param {ParkingSpot[]} spots
	 * @param {number} radiusMiles
	 */
	function countWithinRadius(lon, lat, spots, radiusMiles) {
		let withinUnmetered = 0;
		let withinMetered = 0;
		for (const s of spots) {
			const d = haversineMiles(lat, lon, s.lat, s.lon);
			if (d <= radiusMiles) {
				if (s.kind === 'unmetered') withinUnmetered++;
				else withinMetered++;
			}
		}
		return { withinUnmetered, withinMetered };
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
			const raw = parts.length ? parts.join(', ') : q;
			const address = formatTitleCase(raw);
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
			/** @type {GarageRow[]} */
			let garages = [];
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

			try {
				const gRes = await fetch(GARAGES_CSV);
				if (gRes.ok) {
					const gText = await gRes.text();
					if (!cancelled) garages = parseGaragesCsv(gText);
				}
			} catch {
				/* optional layer */
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

			/** Two-finger pan on touch; keeps page scroll from hijacking the map (see cooperativeGestures). */
			const cooperativeGestures =
				typeof window !== 'undefined' &&
				window.matchMedia('(pointer: coarse)').matches;

			const m = new maplibregl.Map({
				container: mapContainer,
				style,
				center: [-122.44, 37.765],
				zoom: 11,
				maxBounds: [
					[SF_BBOX.minLon - 0.08, SF_BBOX.minLat - 0.08],
					[SF_BBOX.maxLon + 0.08, SF_BBOX.maxLat + 0.08]
				],
				attributionControl: false,
				...(cooperativeGestures ? { cooperativeGestures: true } : {})
			});
			map = m;
			m.addControl(new maplibregl.NavigationControl(), 'top-right');
			// m.fitBounds([
			// 	[SF_BBOX.minLon - 0.02, SF_BBOX.minLat - 0.02],
			// 	[SF_BBOX.maxLon + 0.02, SF_BBOX.maxLat + 0.02]
			// ]);
			// m.addControl(new maplibregl.AttributionControl({ compact: true }));

			m.on('load', () => {
				if (cancelled) return;
				m.addSource('metered', {
					type: 'geojson',
					data: /** @type {any} */ (meteredSpotsToClusteredFeatureCollection(combinedSpots))
				});
				m.addLayer({
					id: 'metered-circles',
					type: 'circle',
					source: 'metered',
					paint: {
						'circle-radius': 3,
						'circle-color': '#ff6b35',
						'circle-opacity': 0.5,
						'circle-stroke-width': 1,
						'circle-stroke-color': '#ff6b35'
					}
				});

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
						'circle-color': '#2c2c2c',
						'circle-opacity': 0.5,
						'circle-stroke-width': 1,
						'circle-stroke-color': '#2c2c2c'
					}
				});

				if (garages.length > 0) {
					m.addSource('garages', {
						type: 'geojson',
						data: /** @type {any} */ (garagesToFeatureCollection(garages))
					});
					m.addLayer({
						id: 'garages-circles',
						type: 'circle',
						source: 'garages',
						paint: {
							'circle-radius': 3,
							'circle-color': "#3a8d89",
							'circle-opacity': 0.5,
							'circle-stroke-width': 1,
							'circle-stroke-color': "#3a8d89"
						}
					});
				}

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

				hoverPopup = new maplibregl.Popup({
					closeButton: false,
					closeOnClick: false,
					maxWidth: '320px',
					offset: 12,
					className: 'mcl-hover-popup'
				});

				let lastTipKey = '';
				m.on('mousemove', (e) => {
					const layers = /** @type {string[]} */ (
						garages.length > 0
							? ['garages-circles', 'unmetered-circles', 'metered-circles']
							: ['unmetered-circles', 'metered-circles']
					);
					const feats = m.queryRenderedFeatures(e.point, { layers });
					if (!feats.length) {
						lastTipKey = '';
						hoverPopup?.remove();
						m.getCanvas().style.cursor = '';
						return;
					}
					const f = feats[0];
					if (!f?.geometry) return;
					const geom = f.geometry;
					const props = f.properties || {};
					m.getCanvas().style.cursor = 'pointer';

					if (geom.type === 'Point') {
						const coords = /** @type {[number, number]} */ (geom.coordinates);
						const tipKey = `${coords[0]},${coords[1]},${props.kind},${String(props.clusterKey ?? '')}`;
						if (tipKey === lastTipKey) return;
						lastTipKey = tipKey;
						hoverPopup
							?.setLngLat(coords)
							.setHTML(parkingSpotPopupHtml(/** @type {Record<string, unknown>} */ (props)))
							.addTo(m);
					}
				});

				mapReady = true;
			});
		})();

		return () => {
			cancelled = true;
		};
	});

	onDestroy(() => {
		hoverPopup?.remove();
		hoverPopup = null;
		closestSpotMarker?.remove();
		closestSpotMarker = null;
		searchMarker?.remove();
		searchMarker = null;
		map?.remove();
		map = null;
	});

	/**
	 * @param {ClosestSpotResult} c
	 */
	function closestDistanceCaption(c) {
		if (c.usedWalkingRouting && c.walkingDurationSec != null) {
			const min = Math.max(1, Math.round(c.walkingDurationSec / 60));
			const walkMi = c.distanceMiles.toFixed(2);
			const bird = c.birdMiles.toFixed(2);
			return `about a ${min} min walk (${walkMi})`;
		}
		return `about ${c.birdMiles.toFixed(2)} mi straight-line (walking route unavailable)`;
	}

	async function handleSearch() {
		geocodeError = '';
		searchSummary = null;
		closestSpotMarker?.remove();
		closestSpotMarker = null;
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
			const { withinUnmetered, withinMetered } = countWithinRadius(
				lon,
				lat,
				allSpots,
				RADIUS_MILES
			);
			const meterDistricts = meterDistrictsWithinRadius(lon, lat, allSpots, RADIUS_MILES);
			/** @type {ClosestSpotResult | null} */
			const closest = await findWalkingClosestSpot(lon, lat, allSpots, { maxCandidates: 120 });

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
				const caretEl = document.createElement('div');
				caretEl.className = 'closest-parking-caret';
				caretEl.textContent = '▼';
				caretEl.title = closest.usedWalkingRouting
					? 'Shortest walk from your search'
					: 'Closest by straight-line distance';
				caretEl.setAttribute(
					'aria-label',
					closest.usedWalkingRouting
						? 'Shortest walking-time motorcycle parking spot'
						: 'Closest motorcycle parking spot by straight-line distance'
				);
				closestSpotMarker = new maplibregl.Marker({
					element: caretEl,
					anchor: 'bottom',
					offset: [0, -5]
				})
					.setLngLat([closest.lon, closest.lat])
					.addTo(map);

				searchSummary = {
					address,
					lon,
					lat,
					closest: { ...closest, label: formatTitleCase(closest.label) },
					withinUnmetered,
					withinMetered,
					meterDistricts
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
		Search a location to find the dedicated motorcycle parking areas with the shortest walking time from your pin. Unmetered areas are
		<strong class="color-black">black</strong>, metered areas are <strong class="color-orange">orange</strong>, and
		<strong class="color-teal">teal</strong> marks SFMTA garages and lots that list a motorcycle rate.
	</p>

	<form class="search-form" onsubmit={(e) => { e.preventDefault(); handleSearch(); }}>
		<label class="visually-hidden" for="address-search">Address in San Francisco</label>
		<input
			id="address-search"
			type="search"
			autocomplete="street-address"
			placeholder="e.g. The Ferry Building"
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
				The closest dedicated parking is a {searchSummary.closest.kind === 'metered' ? 'metered' : 'unmetered'} space at <strong>{searchSummary.closest.label}</strong>, {closestDistanceCaption(searchSummary.closest)} away.
				
				{#if searchSummary.closest.kind === 'metered' && searchSummary.closest.rateArea}
					It {searchSummary.closest.rateArea == "MC5" ? 'has' : 'has a rate of'} <strong>{motorcycleDictionaryRateSummary(searchSummary.closest.rateArea)}</strong>
				{/if}
			
				{#if searchSummary.withinUnmetered > 0 || searchSummary.withinMetered > 0}
					Within 0.2 miles there {searchSummary.withinUnmetered == 1 ? 'is' : 'are'} 
					<strong>{searchSummary.withinUnmetered} unmetered</strong> 
					and <strong class="color-orange">{searchSummary.withinMetered} metered</strong> 
					{searchSummary.withinMetered == 1 ? 'space' : 'spaces'}.
				
				{/if}
		    </p>

			{#if searchSummary.meterDistricts.length > 0}
				<h2 class="results-sub border-top">Nearby meter pricing districts</h2>
				
				<ul class="results-rate-list">
					{#each searchSummary.meterDistricts as d}
						<div class="info-card">	
							<strong><code>{d.rateArea}</code></strong>
							&mdash; {d.count} metered space{d.count === 1 ? '' : 's'}
							<ul>
								<li>Rate: {motorcycleDictionaryRateSummary(d.rateArea)}</li>
								<li>Smart meter: {d.smartY} yes / {d.smartN} no</li>
							</ul>
							<!-- <span class="results-rate-desc">{rateAreaDescription(d.rateArea)}</span> -->
						</div>
					{/each}
				</ul>
			{/if}
		</section>
	{/if}

	<p class="attribution">
		Map tiles © <a href="https://stadiamaps.com/" target="_blank">Stadia Maps</a>. Street parking: <a href="https://data.sfgov.org/browse?category=Transportation" target="_blank">City of San Francisco open data</a> (Apr 2026). Garages/lots with motorcycle rates: <a href="https://www.sfmta.com/garages-lots-list?field_garage_services_value=Motorcycle+Rate&amp;field_neighborhoods_target_id_verf=All&amp;field_parking_type_value=All" target="_blank" rel="noopener noreferrer">SFMTA</a> list (Apr 2026); map points geocoded with <a href="https://nominatim.openstreetmap.org/" target="_blank" rel="noopener noreferrer">Nominatim</a>. Map data © <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors.
	<span class="routing-note">Walking time uses OpenStreetMap paths via a public OSRM demo router (dead ends and one-way rules included where mapped).</span>
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

	.attribution {
		margin-top: 2rem;
		font-size: var(--text-sm);
		color: var(--muted-foreground);
	}

	.color-black {
		color: var(--olivetti-charcoal);
	}

	.color-orange {
		color: var(--olivetti-orange);
	}

	.color-teal {
		color: var(--olivetti-teal);
	}

	.info-card {
		padding: 0.75rem 1rem;
		border: 1px solid var(--border);
		border-radius: var(--radius);
		background: var(--muted);
		font-size: var(--text-sm);
		width: 33%;
	}

	.info-card ul {
		margin: 0.5rem 0 0;
		padding-left: 1.25rem;
		font-size: var(--text-sm);
		line-height: 1.45;
		list-style-type: disc;
	}
	.info-card li {
		margin: 0.25rem 0;
	}

	@media (max-width: 768px) {
		.info-card {
			width: 100%;
		}
	}

	.results-sub {
		margin: 1.25rem 0 0.5rem;
		font-size: var(--text-base);
		font-weight: var(--font-weight-medium);
	}

	.results-rate-list {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		padding: 0;
	}

	.border-top {
		border-top: 1px solid var(--border);
		padding-top: 1rem;
		margin-top: 1rem;
	}

	.routing-note {
		display: block;
		margin-top: 0.5rem;
		font-size: var(--text-sm);
		color: var(--muted-foreground);
		line-height: 1.45;
	}


	:global(.mcl-hover-popup .maplibregl-popup-content) {
		padding: 10px 12px;
		border-radius: 6px;
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
	}

	:global(.map-tip-addr) {
		font-weight: var(--font-weight-black);
		margin-bottom: 0.35rem;
		font-size: var(--text-sm);
	}

	:global(.map-tip-line) {
		margin: 0.35rem 0;
		font-size: var(--text-sm);
		line-height: 1.45;
	}

	:global(.map-tip-meta) {
		margin: 0.35rem 0 0;
		font-size: var(--text-sm);
		color: var(--muted-foreground);
		line-height: 1.4;
	}

	:global(.map-tip-list) {
		margin: 0.35rem 0 0;
		padding-left: 1.1rem;
		font-size: var(--text-sm);
		line-height: 1.45;
	}

	:global(.map-tip-dict-rate) {
		margin: 0 0 0.35rem;
		font-size: var(--text-sm);
		line-height: 1.45;
	}

	:global(.map-tip-dict-note) {
		margin: 0 0 0.5rem;
		font-size: var(--text-sm);
		color: var(--muted-foreground);
		line-height: 1.45;
	}

	:global(.map-tip-unknown) {
		font-size: var(--text-sm);
		color: var(--destructive);
	}

	:global(.closest-parking-caret) {
		color: var(--olivetti-charcoal);
		font-size: 1.5rem;
		font-weight: var(--font-weight-black);
		line-height: 0.75;
		font-family: var(--font-body), sans-serif;
		pointer-events: none;
		text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
		user-select: none;
	}

</style>
