import { formatTitleCase } from '$lib/formatTitleCase';

const EARTH_RADIUS_MI = 3959;
const METERS_PER_MILE = 1609.344;

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number) {
	const dLat = ((lat2 - lat1) * Math.PI) / 180;
	const dLon = ((lon2 - lon1) * Math.PI) / 180;
	const a =
		Math.sin(dLat / 2) ** 2 +
		Math.cos((lat1 * Math.PI) / 180) *
			Math.cos((lat2 * Math.PI) / 180) *
			Math.sin(dLon / 2) ** 2;
	return EARTH_RADIUS_MI * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export type MeteredSpotLike = {
	kind: string;
	lon: number;
	lat: number;
	label: string;
	rateArea?: string;
	meterType?: string;
	smartMeter?: string;
	sfparkArea?: string;
	streetAddress?: string;
};

export type MeteredClusterOptions = {
	/** Max distance between two spots in the same cluster (meters). Default 75. */
	clusterDistanceM?: number;
};

/**
 * Builds a GeoJSON FeatureCollection for metered spots: isolated spaces stay as Points;
 * groups whose members are within `clusterDistanceM` of one another (transitively) become
 * a single Point at the group centroid (same map circle size as other metered dots).
 */
export function meteredSpotsToClusteredFeatureCollection(
	spots: MeteredSpotLike[],
	opts: MeteredClusterOptions = {}
): GeoJSON.FeatureCollection {
	const clusterDistanceM = opts.clusterDistanceM ?? 75;
	const thresholdMiles = clusterDistanceM / METERS_PER_MILE;

	const metered = spots.filter((s): s is MeteredSpotLike => s.kind === 'metered');
	const n = metered.length;
	const parent = Array.from({ length: n }, (_, i) => i);

	function find(i: number): number {
		let x = i;
		while (parent[x] !== x) x = parent[x];
		let a = i;
		while (parent[a] !== a) {
			const nxt = parent[a];
			parent[a] = x;
			a = nxt;
		}
		return x;
	}

	function union(a: number, b: number) {
		const ra = find(a);
		const rb = find(b);
		if (ra !== rb) parent[rb] = ra;
	}

	for (let i = 0; i < n; i++) {
		for (let j = i + 1; j < n; j++) {
			if (haversineMiles(metered[i].lat, metered[i].lon, metered[j].lat, metered[j].lon) <= thresholdMiles) {
				union(i, j);
			}
		}
	}

	const groups = new Map<number, MeteredSpotLike[]>();
	for (let i = 0; i < n; i++) {
		const r = find(i);
		if (!groups.has(r)) groups.set(r, []);
		groups.get(r)!.push(metered[i]);
	}

	const features: GeoJSON.Feature[] = [];
	let clusterSeq = 0;

	for (const group of groups.values()) {
		if (group.length === 1) {
			const s = group[0];
			features.push({
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
			});
			continue;
		}

		let sumLon = 0;
		let sumLat = 0;
		for (const s of group) {
			sumLon += s.lon;
			sumLat += s.lat;
		}
		const cLon = sumLon / group.length;
		const cLat = sumLat / group.length;

		const rateCounts: Record<string, number> = {};
		for (const s of group) {
			const key = (s.rateArea || '').trim() || 'Unknown';
			rateCounts[key] = (rateCounts[key] ?? 0) + 1;
		}

		/** Spot nearest centroid — use its street/label as the one tooltip address. */
		let rep = group[0];
		let bestD = Infinity;
		for (const s of group) {
			const d = haversineMiles(cLat, cLon, s.lat, s.lon);
			if (d < bestD) {
				bestD = d;
				rep = s;
			}
		}
		/** Raw street/label; `parkingSpotPopupHtml` applies title case + escaping. */
		const address = String(rep.streetAddress || rep.label || '').trim();

		clusterSeq += 1;
		features.push({
			type: 'Feature',
			properties: {
				kind: 'metered',
				isCluster: true,
				clusterKey: `mcl-${clusterSeq}-${cLon.toFixed(5)}-${cLat.toFixed(5)}`,
				spotCount: group.length,
				rateAreasJson: JSON.stringify(rateCounts),
				...(address ? { address } : {})
			},
			geometry: { type: 'Point', coordinates: [cLon, cLat] }
		});
	}

	return { type: 'FeatureCollection', features };
}
