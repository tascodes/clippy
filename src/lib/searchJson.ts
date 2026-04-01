/** Context key for passing search state from JsonViewer down to every JsonNode. */
export const SEARCH_CTX = Symbol('json-search');

export interface SearchOptions {
	/** Treat the term as a regular expression. */
	regex: boolean;
	/** Match exact case (default false = case-insensitive). */
	caseSensitive: boolean;
}

export interface SearchMatch {
	/** Dot-notation path to the node, e.g. "fill.linear-gradient[0]" */
	path: string;
	/** Paths of ancestor nodes that must be expanded to reveal this match */
	ancestorPaths: string[];
	/** Whether the match is in the key name or the value */
	matchIn: 'key' | 'value';
	/** The full display text that was searched (key name or formatted value) */
	text: string;
	/** Start index of the first match within `text` */
	matchStart: number;
}

/** Shape of the reactive context object read by JsonNode. */
export interface SearchCtx {
	readonly term: string;
	readonly options: SearchOptions;
	/** Per-path match flags; undefined means no match at that path. */
	readonly matchMap: Map<string, { key: boolean; value: boolean }>;
	readonly currentMatch: SearchMatch | null;
	/** Set of ancestor paths that should be auto-expanded to show the current match. */
	readonly expandPaths: Set<string>;
	/**
	 * True only when the user has actively pressed next/prev — gates auto-expand and
	 * scroll-into-view so that merely typing never collapses/expands the tree.
	 */
	readonly userNavigated: boolean;
}

// ---------------------------------------------------------------------------
// Core match-finding helper
// ---------------------------------------------------------------------------

interface Occurrence {
	start: number;
	end: number;
}

function findOccurrences(text: string, term: string, options: SearchOptions): Occurrence[] {
	if (!term) return [];

	if (options.regex) {
		try {
			const flags = options.caseSensitive ? 'g' : 'gi';
			const re = new RegExp(term, flags);
			const results: Occurrence[] = [];
			let m: RegExpExecArray | null;
			while ((m = re.exec(text)) !== null) {
				results.push({ start: m.index, end: m.index + m[0].length });
				// Prevent infinite loop on zero-length match
				if (m[0].length === 0) re.lastIndex++;
			}
			return results;
		} catch {
			return [];
		}
	} else {
		const hay = options.caseSensitive ? text : text.toLowerCase();
		const needle = options.caseSensitive ? term : term.toLowerCase();
		const results: Occurrence[] = [];
		let i = 0;
		while (i < hay.length) {
			const idx = hay.indexOf(needle, i);
			if (idx === -1) break;
			results.push({ start: idx, end: idx + needle.length });
			i = idx + needle.length || i + 1;
		}
		return results;
	}
}

/** Returns true if `term` is a valid regex pattern (always true when regex mode is off). */
export function isValidRegex(term: string): boolean {
	try {
		new RegExp(term);
		return true;
	} catch {
		return false;
	}
}

// ---------------------------------------------------------------------------
// Text highlight helper
// ---------------------------------------------------------------------------

/**
 * Splits `text` into alternating non-match / match segments for rendering.
 */
export function splitHighlight(
	text: string,
	term: string,
	options: SearchOptions
): Array<{ text: string; match: boolean }> {
	const occurrences = findOccurrences(text, term, options);
	if (occurrences.length === 0) return [{ text, match: false }];

	const parts: Array<{ text: string; match: boolean }> = [];
	let i = 0;
	for (const { start, end } of occurrences) {
		if (start > i) parts.push({ text: text.slice(i, start), match: false });
		parts.push({ text: text.slice(start, end), match: true });
		i = end;
	}
	if (i < text.length) parts.push({ text: text.slice(i), match: false });
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
	term: string,
	options: SearchOptions,
	out: SearchMatch[]
): void {
	// Check key match
	if (keyName !== null) {
		const keyText = typeof keyName === 'number' ? `[${keyName}]` : String(keyName);
		const occ = findOccurrences(keyText, term, options);
		if (occ.length > 0) {
			out.push({
				path,
				ancestorPaths: ancestors,
				matchIn: 'key',
				text: keyText,
				matchStart: occ[0].start
			});
		}
	}

	const isNull = data === null;
	const isObject = !isNull && typeof data === 'object' && !Array.isArray(data);
	const isArray = Array.isArray(data);

	if (!isObject && !isArray) {
		// Primitive — check value match
		const valText = typeof data === 'string' ? `"${data}"` : String(data ?? 'null');
		const occ = findOccurrences(valText, term, options);
		if (occ.length > 0) {
			out.push({
				path,
				ancestorPaths: ancestors,
				matchIn: 'value',
				text: valText,
				matchStart: occ[0].start
			});
		}
	} else if (isObject) {
		const childAncestors = [...ancestors, path];
		for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
			const childPath = path ? `${path}.${k}` : k;
			collectMatches(v, k, childPath, childAncestors, term, options, out);
		}
	} else if (isArray) {
		const childAncestors = [...ancestors, path];
		for (let i = 0; i < (data as unknown[]).length; i++) {
			const childPath = path ? `${path}[${i}]` : `[${i}]`;
			collectMatches((data as unknown[])[i], i, childPath, childAncestors, term, options, out);
		}
	}
}

/**
 * Returns all matches for `term` within `data` in document (depth-first) order.
 * Mirrors the same root-unwrapping logic that JsonViewer uses when rendering.
 */
export function computeMatches(
	data: unknown,
	term: string,
	options: SearchOptions
): SearchMatch[] {
	if (!term) return [];

	const out: SearchMatch[] = [];

	if (data !== null && typeof data === 'object' && !Array.isArray(data)) {
		for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
			collectMatches(v, k, k, [], term, options, out);
		}
	} else {
		collectMatches(data, null, '', [], term, options, out);
	}

	return out;
}
