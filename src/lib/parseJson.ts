/**
 * Strips trailing commas before closing brackets/braces and at end of string.
 * Allows parsing "partial" or slightly-invalid JSON.
 */
function stripTrailingCommas(str: string): string {
	// Remove commas immediately before } or ]
	let result = str.replace(/,(\s*[}\]])/g, '$1');
	// Remove trailing comma at end of string
	result = result.replace(/,\s*$/, '');
	return result;
}

export type ParseSuccess = { data: unknown; error: null };
export type ParseFailure = { data: null; error: string };
export type ParseResult = ParseSuccess | ParseFailure;

/**
 * Attempts to parse a string as JSON, with fallbacks for partial/trailing-comma JSON.
 * Tries (in order):
 *   1. As-is (after stripping trailing commas)
 *   2. Wrapped in { … }
 *   3. Wrapped in [ … ]
 */
export function parsePartialJson(input: string): ParseResult {
	const cleaned = stripTrailingCommas(input.trim());

	// Try 1: as-is
	try {
		return { data: JSON.parse(cleaned), error: null };
	} catch {}

	// Try 2: wrap in {}
	try {
		const wrapped = stripTrailingCommas(`{${cleaned}}`);
		return { data: JSON.parse(wrapped), error: null };
	} catch {}

	// Try 3: wrap in []
	try {
		const wrapped = stripTrailingCommas(`[${cleaned}]`);
		return { data: JSON.parse(wrapped), error: null };
	} catch (e) {
		return { data: null, error: (e as Error).message };
	}
}

/**
 * Returns true if the content parses as a JSON object or array (not a bare primitive).
 */
export function looksLikeJson(content: string | null): boolean {
	if (!content) return false;
	const { data, error } = parsePartialJson(content);
	if (error !== null) return false;
	return data !== null && typeof data === 'object';
}
