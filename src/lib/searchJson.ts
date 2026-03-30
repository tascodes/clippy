/** Context key for passing search state from JsonViewer down to every JsonNode. */
export const SEARCH_CTX = Symbol('json-search');

export interface SearchMatch {
	/** Dot-notation path to the node, e.g. "fill.linear-gradient[0]" */
	path: string;
	/** Paths of ancestor nodes that must be expanded to reveal this match */
	ancestorPaths: string[];
	/** Whether the match is in the key name or the value */
	matchIn: 'key' | 'value';
	/** The full display text that was searched (key name or formatted value) */
	text: string;
	/** Start index of the match within `text` */
	matchStart: number;
}

/** Shape of the reactive context object read by JsonNode. */
export interface SearchCtx {
	readonly term: string;
	/** Per-path match flags; undefined means no match at that path. */
	readonly matchMap: Map<string, { key: boolean; value: boolean }>;
	readonly currentMatch: SearchMatch | null;
	/** Set of ancestor paths that should be auto-expanded to show the current match. */
	readonly expandPaths: Set<string>;
}

// ---------------------------------------------------------------------------
// Text highlight helper
// ---------------------------------------------------------------------------

/**
 * Splits `text` into alternating non-match / match segments for rendering.
 * Returns a single no-match segment when term is shorter than 3 chars.
 */
export function splitHighlight(
	text: string,
	term: string
): Array<{ text: string; match: boolean }> {
	if (!term || term.length < 3) return [{ text, match: false }];
	const parts: Array<{ text: string; match: boolean }> = [];
	const lo = text.toLowerCase();
	const lt = term.toLowerCase();
	let i = 0;
	while (i <= text.length) {
		const idx = lo.indexOf(lt, i);
		if (idx === -1) {
			if (i < text.length) parts.push({ text: text.slice(i), match: false });
			break;
		}
		if (idx > i) parts.push({ text: text.slice(i, idx), match: false });
		parts.push({ text: text.slice(idx, idx + term.length), match: true });
		i = idx + term.length;
	}
	return parts;
}

// ---------------------------------------------------------------------------
// Match computation
// ---------------------------------------------------------------------------

function collectMatches(
	data: unknown,
	keyName: string | number | null,
	path: string,
	ancestors: string[],
	lowerTerm: string,
	out: SearchMatch[]
): void {
	// Check key match
	if (keyName !== null) {
		const keyText = typeof keyName === 'number' ? `[${keyName}]` : String(keyName);
		const idx = keyText.toLowerCase().indexOf(lowerTerm);
		if (idx >= 0) {
			out.push({ path, ancestorPaths: ancestors, matchIn: 'key', text: keyText, matchStart: idx });
		}
	}

	const isNull = data === null;
	const isObject = !isNull && typeof data === 'object' && !Array.isArray(data);
	const isArray = Array.isArray(data);

	if (!isObject && !isArray) {
		// Primitive — check value match
		const valText = typeof data === 'string' ? `"${data}"` : String(data ?? 'null');
		const idx = valText.toLowerCase().indexOf(lowerTerm);
		if (idx >= 0) {
			out.push({
				path,
				ancestorPaths: ancestors,
				matchIn: 'value',
				text: valText,
				matchStart: idx
			});
		}
	} else if (isObject) {
		// Always push current path so children can list it as an ancestor to expand
		const childAncestors = [...ancestors, path];
		for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
			const childPath = path ? `${path}.${k}` : k;
			collectMatches(v, k, childPath, childAncestors, lowerTerm, out);
		}
	} else if (isArray) {
		const childAncestors = [...ancestors, path];
		for (let i = 0; i < (data as unknown[]).length; i++) {
			const childPath = path ? `${path}[${i}]` : `[${i}]`;
			collectMatches((data as unknown[])[i], i, childPath, childAncestors, lowerTerm, out);
		}
	}
}

/**
 * Returns all matches for `term` within `data` in document (depth-first) order.
 * Mirrors the same root-unwrapping logic that JsonViewer uses when rendering.
 */
export function computeMatches(data: unknown, term: string): SearchMatch[] {
	if (!term || term.length < 3) return [];
	const lowerTerm = term.toLowerCase();
	const out: SearchMatch[] = [];

	// If root is an object, its entries are rendered as top-level nodes (no root wrapper)
	if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
		for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
			collectMatches(v, k, k, [], lowerTerm, out);
		}
	} else {
		// Array or primitive rendered as a single root node
		collectMatches(data, null, '', [], lowerTerm, out);
	}

	return out;
}
