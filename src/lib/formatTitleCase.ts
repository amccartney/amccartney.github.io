/**
 * Format a free-form address (or place) string for display: title case
 * on each word, preserving pure numbers and handling hyphenated tokens.
 *
 * @param {string | null | undefined} input
 * @returns {string}
 */
export function formatTitleCase(input) {
	if (input == null || input === '') return '';
	const str = String(input).trim();
	if (!str) return '';

	return str
		.split(',')
		.map((chunk) =>
			chunk
				.trim()
				.split(/\s+/)
				.filter(Boolean)
				.map(formatWord)
				.join(' ')
		)
		.filter(Boolean)
		.join(', ');
}

/**
 * @param {string} word
 */
function formatWord(word) {
	if (!word) return word;
	if (/^\d+$/.test(word)) return word;
	return word.split('-').map(formatHyphenPart).join('-');
}

/**
 * @param {string} part
 */
function formatHyphenPart(part) {
	if (!part) return part;
	if (/^\d+$/.test(part)) return part;
	const lower = part.toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}
