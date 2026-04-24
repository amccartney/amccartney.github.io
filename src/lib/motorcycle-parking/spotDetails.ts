import { formatTitleCase } from '$lib/formatTitleCase';

/**
 * Motorcycle and related rate text is taken from the City’s open-data dictionary for
 * “Metered motorcycle spaces” (DataSF `uf55-k7py`), PDF asset
 * 68D1C811-72EF-4F29-8869-855FDEEC7F74, as provided in project requirements.
 *
 * Posted prices on meters may have changed since that document; treat as reference.
 */

/** @param {string} s */
export function escapeHtml(s) {
	return String(s)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

/**
 * @param {string | undefined} code
 */
export function meterTypeLabel(code) {
	if (code === 'MS') return 'Multi-space meter (MS)';
	if (code === 'SS') return 'Single-space meter (SS)';
	return code ? `Meter type ${code}` : 'Meter type unknown';
}

/** Motorcycle rows: RATEAREA in CSV → dictionary line (HTML snippet). */
const MOTORCYCLE_RATE_LINES = /** @type {Record<string, string>} */ ({
	MC1: '$0.70/hr',
	MC2: '$0.60/hr',
	MC3: '$0.40/hr',
	MC5:
		'variable rates ranging from $0.25–$6.00/hr',
	PortMC1: '$0.25/hr',
	PortMC2: '$0.50/hr'
});

/** Automobile / SFpark reference zones from the same document (context). */
export const DICTIONARY_AUTOMOBILE_AND_SFPARK = [
	'Area 1 Downtown — $3.50/hr',
	'Area 2 Surrounding downtown — $3.00/hr',
	'Area 3 Residential neighborhood — $2.00/hr',
	'Area 5 SFpark area — variable rates ranging from $0.25–$6.00/hr'
];

/** Port automobile zones from the same document (not motorcycle RATEAREA codes). */
export const DICTIONARY_PORT_AUTOMOBILE = [
	"Port 1 — Port-owned at Fisherman's Wharf — $2.50/hr",
	"Port 2 — Port-owned at Fisherman's Wharf — $2.50/hr",
	'Port 3 — Port-owned at North Embarcadero — $2.00/hr',
	'Port 4 — Port-owned at North Embarcadero — $2.00/hr',
	'Port 5 — Port-owned at Downtown — $3.00/hr',
	'Port 6 — Port-owned at Downtown — $3.00/hr',
	'Port 7 — Port-owned at Downtown — $3.00/hr',
	'Port 8 — Port-owned at Downtown — $3.00/hr',
	'Port 9 — Port-owned at South Embarcadero — $1.00/hr',
	'Port 10 — Port-owned at South Embarcadero — $1.00/hr',
	'Port 11 — Port-owned at South Embarcadero — $1.00/hr',
	'Port 12 — Port-owned at South Embarcadero — $1.00/hr'
];

export const DICTIONARY_TOUR_BUS = 'Tour bus — $9.00 for two hours';

/**
 * @param {string | undefined} rateArea
 * @returns {string} HTML fragment (already safe except inner <strong> we control)
 */
export function motorcycleDictionaryRateHtml(rateArea) {
	const ra = (rateArea || '').trim();
	const line = MOTORCYCLE_RATE_LINES[ra] ?? null;
	if (!line) {
		return `<p class="map-tip-dict-rate"><span class="map-tip-unknown">No dictionary line for <code>${escapeHtml(ra || '—')}</code>.</span></p>`;
	}
	return `${line}`;
}

/**
 * Plain summary for results lists (no inner HTML tags).
 * @param {string | undefined} rateArea
 */
export function motorcycleDictionaryRateSummary(rateArea) {
	const ra = (rateArea || '').trim();
	switch (ra) {
		case 'MC1':
			return '$0.70 per hour.';
		case 'MC2':
			return '$0.60 per hour.';
		case 'MC3':
			return '$0.40 per hour.';
		case 'MC5':
			return 'variable rates ranging from $0.25–$6.00 per hour.';
		case 'PortMC1':
			return '$0.25 per hour.';
		case 'PortMC2':
			return '$0.50 per hour.';
		default:
			return ra ? `No known rate line for “${ra}”.` : 'Unknown rate district.';
	}
}

/**
 * Longer context sentence (escaped) for tooltips / secondary copy.
 * @param {string | undefined} rateArea
 */
export function rateAreaDescription(rateArea) {
	const ra = (rateArea || '').trim();
	const map = {
		MC1: 'Motorcycle spaces in Area 1 (Downtown automobile zone $3.50/hr in same document).',
		MC2: 'Motorcycle spaces in Area 2 (surrounding downtown automobile $3.00/hr).',
		MC3: 'Motorcycle spaces in Area 3 (residential neighborhood automobile $2.00/hr).',
		MC5: 'Motorcycle spaces in the SFpark pricing area (variable automobile and motorcycle rates in same document).',
		PortMC1: 'Port-owned motorcycle rate tier PortMC1.',
		PortMC2: 'Port-owned motorcycle rate at Ferry Building (PortMC2).'
	};
	return map[/** @type {keyof typeof map} */ (ra)] || `Rate district ${ra || 'unknown'} (see data dictionary for current codes).`;
}

/**
 * @param {Record<string, unknown>} p GeoJSON feature.properties from our layers
 */
export function parkingSpotPopupHtml(p) {
	const kind = p.kind;

	if (kind === 'garage') {
		const name = escapeHtml(formatTitleCase(String(p.name || 'SFMTA facility')));
		const address = escapeHtml(formatTitleCase(String(p.address || '')));
		const phone = escapeHtml(String(p.phone || ''));
		const ft = escapeHtml(String(p.facility_type || ''));
		const rawUrl = String(p.url || 'https://www.sfmta.com/garages-lots-list');
		const href = escapeHtml(rawUrl);
		return `<div class="map-tip"><div class="map-tip-addr">${name}</div>
			<p class="map-tip-line"><strong>SFMTA ${ft}</strong> with motorcycle rates.</p>
			<ul class="map-tip-list">
				<li><strong>Address:</strong> ${address}</li>
				${phone ? `<li><strong>Phone:</strong> ${phone}</li>` : ''}
			</ul></div>`;
	}

	const address = escapeHtml(formatTitleCase(String(p.address || 'Address unknown')));

	if (kind === 'unmetered') {
		return `<div class="map-tip"><div class="map-tip-addr">${address}</div><p class="map-tip-line"><strong>Unmetered</strong> motorcycle parking.</p></div>`;
	}

	const isCluster = p.isCluster === true || p.isCluster === 'true';
	if (kind === 'metered' && isCluster) {
		const n = Math.max(0, Math.floor(Number(p.spotCount) || 0));
		/** @type {Record<string, number>} */
		let rateCounts = {};
		try {
			rateCounts = /** @type {Record<string, number>} */ (
				JSON.parse(String(p.rateAreasJson || '{}'))
			);
		} catch {
			rateCounts = {};
		}
		const rates = Object.entries(rateCounts)
			.sort((a, b) => Number(b[1]) - Number(a[1]))
			.slice(0, 10)
			.map(
				([code, cnt]) =>
					`${motorcycleDictionaryRateHtml(code)}`
			)
			.join('');
		const list =
			rates || 'Rate district breakdown unavailable for this cluster.';
		return `<div class="map-tip"><div class="map-tip-addr">${address}</div>
			<p class="map-tip-line"><strong>${n} metered spaces</strong> at ${rates}</p>`;
	}

	const rateArea = String(p.rateArea || '').trim();
	const mt = meterTypeLabel(/** @type {string | undefined} */ (p.meterType));
	const smart = p.smartMeter === 'Y' ? 'Yes' : p.smartMeter === 'N' ? 'No' : String(p.smartMeter || '');
	const park = String(p.sfparkArea || '').trim();

	const hourly = `${motorcycleDictionaryRateHtml(rateArea)}`
		// <p class="map-tip-dict-note">From the City’s <a href="https://data.sfgov.org/api/assets/68D1C811-72EF-4F29-8869-855FDEEC7F74?download=true" target="_blank" rel="noopener noreferrer">metered motorcycle data dictionary</a>. <strong>Check the meter</strong> for the price in effect today.</p>`;

	const meta = `
	
		<ul class="map-tip-list">
			<li><strong>Hourly rate:</strong> ${hourly}</li>
			<li><strong>Smart meter:</strong> ${escapeHtml(smart)}</li>
			${park ? `<li><strong>SFpark area label:</strong> ${escapeHtml(formatTitleCase(park))}</li>` : ''}
		</ul>`;
		// <p class="map-tip-meta">${escapeHtml(rateAreaDescription(rateArea))}</p>

	return `<div class="map-tip"><div class="map-tip-addr">${address}</div>${meta}</div>`;
}
