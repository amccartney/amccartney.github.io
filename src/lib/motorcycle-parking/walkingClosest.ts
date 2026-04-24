/**
 * Walking-time "closest" via the public OSRM demo foot routing table
 * (OpenStreetMap network). Falls back to straight-line (Haversine) if the
 * request fails or all legs are unroutable.
 *
 * Demo server: https://router.project-osrm.org — fair-use; not for heavy traffic.
 */

const OSRM_TABLE_FOOT = 'https://router.project-osrm.org/table/v1/foot';

/**
 * @param {number} lat1
 * @param {number} lon1
 * @param {number} lat2
 * @param {number} lon2
 */
export function haversineMiles(lat1, lon1, lat2, lon2) {
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
 * @param {object} spot
 * @param {string} [spot.kind]
 * @param {number} spot.lat
 * @param {number} spot.lon
 * @param {string} [spot.label]
 * @param {number} birdMiles
 * @param {number} [walkingSec]
 * @param {number} [walkingM]
 * @param {boolean} usedWalkingRouting
 */
function buildClosest(spot, birdMiles, walkingSec, walkingM, usedWalkingRouting) {
	const walkMi =
		usedWalkingRouting && walkingM != null && Number.isFinite(walkingM)
			? walkingM / 1609.344
			: birdMiles;
	return {
		...spot,
		birdMiles,
		distanceMiles: walkMi,
		walkingDurationSec: walkingSec,
		walkingDistanceM: walkingM,
		usedWalkingRouting
	};
}

/**
 * @param {number} originLon
 * @param {number} originLat
 * @param {object[]} spots Parking spots with lon, lat, and other fields
 * @param {{ maxCandidates?: number }} [opts]
 */
export async function findWalkingClosestSpot(originLon, originLat, spots, opts) {
	const maxC = Math.min(opts?.maxCandidates ?? 120, spots.length);
	if (!spots.length || maxC < 1) return null;

	/** @type {{ s: object; bird: number }[]} */
	const scored = spots.map((s) => ({
		s,
		bird: haversineMiles(originLat, originLon, /** @type {number} */ (s.lat), /** @type {number} */ (s.lon))
	}));
	scored.sort((a, b) => a.bird - b.bird);
	const candidates = scored.slice(0, maxC);
	const birdWinner = scored[0];

	const parts = [
		`${originLon},${originLat}`,
		...candidates.map((c) => `${/** @type {{ lon: number }} */ (c.s).lon},${/** @type {{ lat: number }} */ (c.s).lat}`)
	];
	const coordStr = parts.join(';');
	const destIdx = candidates.map((_, i) => String(i + 1)).join(';');
	const url = `${OSRM_TABLE_FOOT}/${coordStr}?sources=0&destinations=${destIdx}&annotations=duration,distance`;

	try {
		const res = await fetch(url);
		if (!res.ok) throw new Error(`OSRM ${res.status}`);
		const data = await res.json();
		if (data.code !== 'Ok') throw new Error(String(data.code));

		const durations = data.durations?.[0];
		const distances = data.distances?.[0];
		if (!Array.isArray(durations) || durations.length !== candidates.length) throw new Error('durations');

		let bestI = -1;
		let bestDur = Infinity;
		for (let i = 0; i < durations.length; i++) {
			const dur = durations[i];
			if (dur == null || !Number.isFinite(dur)) continue;
			if (dur < bestDur) {
				bestDur = dur;
				bestI = i;
			}
		}

		if (bestI >= 0) {
			const pick = candidates[bestI];
			const wM = Array.isArray(distances) ? distances[bestI] : undefined;
			const wSec = durations[bestI];
			return buildClosest(
				pick.s,
				pick.bird,
				typeof wSec === 'number' ? wSec : undefined,
				typeof wM === 'number' ? wM : undefined,
				true
			);
		}
	} catch {
		/* fall through to bird */
	}

	return buildClosest(birdWinner.s, birdWinner.bird, undefined, undefined, false);
}
