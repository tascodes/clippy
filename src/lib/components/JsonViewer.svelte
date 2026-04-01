<script lang="ts">
	import { setContext } from 'svelte';
	import JsonNode from './JsonNode.svelte';
	import JsonSearch from './JsonSearch.svelte';
	import { parsePartialJson } from '$lib/parseJson';
	import {
		computeMatches,
		isValidRegex,
		SEARCH_CTX,
		type SearchCtx,
		type SearchOptions
	} from '$lib/searchJson';

	interface Props {
		content: string;
	}

	let { content }: Props = $props();

	const result = $derived(parsePartialJson(content));

	// Top-level entries when root is an object (no wrapper node shown)
	const topLevelEntries = $derived(
		result.error === null &&
			result.data !== null &&
			typeof result.data === 'object' &&
			!Array.isArray(result.data)
			? Object.entries(result.data as Record<string, unknown>)
			: null
	);

	// -------------------------------------------------------------------------
	// Search state
	// -------------------------------------------------------------------------

	let searchOpen = $state(false);
	let searchTerm = $state('');
	let currentMatchIdx = $state(-1);
	let regexEnabled = $state(false);
	let caseSensitive = $state(false);

	const searchOptions = $derived<SearchOptions>({ regex: regexEnabled, caseSensitive });

	const invalidRegex = $derived(regexEnabled && searchTerm.length > 0 && !isValidRegex(searchTerm));

	const matches = $derived(
		result.error === null && !invalidRegex
			? computeMatches(result.data, searchTerm, searchOptions)
			: []
	);

	// Map from path → which parts (key/value) have at least one match
	const matchMap = $derived.by(() => {
		const m = new Map<string, { key: boolean; value: boolean }>();
		for (const match of matches) {
			const entry = m.get(match.path) ?? { key: false, value: false };
			if (match.matchIn === 'key') entry.key = true;
			else entry.value = true;
			m.set(match.path, entry);
		}
		return m;
	});

	const currentMatch = $derived(currentMatchIdx >= 0 ? (matches[currentMatchIdx] ?? null) : null);

	// True only when the user has pressed next/prev — typing alone never expands or scrolls.
	let userNavigated = $state(false);

	// Auto-expand when term is 3+ chars, or when user actively navigates with shorter terms.
	const expandPaths = $derived(
		(userNavigated || searchTerm.length >= 3) && currentMatch
			? new Set(currentMatch.ancestorPaths)
			: new Set<string>()
	);

	// When the match list changes (term changed), reset index and clear navigation flag.
	$effect(() => {
		currentMatchIdx = matches.length > 0 ? 0 : -1;
		userNavigated = false;
	});

	function nextMatch() {
		if (matches.length === 0) return;
		currentMatchIdx = (currentMatchIdx + 1) % matches.length;
		userNavigated = true;
	}

	function prevMatch() {
		if (matches.length === 0) return;
		currentMatchIdx = (currentMatchIdx - 1 + matches.length) % matches.length;
		userNavigated = true;
	}

	function openSearch() {
		searchOpen = true;
	}

	function closeSearch() {
		searchOpen = false;
		searchTerm = '';
	}

	// Ctrl/Cmd+F anywhere on the page opens this viewer's search bar
	$effect(() => {
		function handler(e: KeyboardEvent) {
			if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
				e.preventDefault();
				openSearch();
			}
		}
		window.addEventListener('keydown', handler);
		return () => window.removeEventListener('keydown', handler);
	});

	// Provide reactive search context to all JsonNode descendants
	const searchCtx: SearchCtx = {
		get term() {
			return searchTerm;
		},
		get options() {
			return searchOptions;
		},
		get matchMap() {
			return matchMap;
		},
		get currentMatch() {
			return currentMatch;
		},
		get expandPaths() {
			return expandPaths;
		},
		get userNavigated() {
			return userNavigated;
		}
	};
	setContext(SEARCH_CTX, searchCtx);
</script>

{#if result.error !== null}
	<div class="p-2 font-mono text-sm text-red-500">
		<span class="font-semibold">Parse error:</span>
		{result.error}
	</div>
{:else}
	<div>
		{#if searchOpen}
			<JsonSearch
				term={searchTerm}
				matchCount={matches.length}
				currentIdx={currentMatchIdx}
				{regexEnabled}
				{caseSensitive}
				{invalidRegex}
				onnext={nextMatch}
				onprev={prevMatch}
				onclose={closeSearch}
				oninput={(t) => (searchTerm = t)}
				onToggleRegex={() => (regexEnabled = !regexEnabled)}
				onToggleCase={() => (caseSensitive = !caseSensitive)}
			/>
		{/if}

		<div class="max-h-[32rem] overflow-auto p-3">
			{#if topLevelEntries !== null}
				{#each topLevelEntries as [key, value]}
					<JsonNode data={value} keyName={key} path={key} />
				{/each}
			{:else}
				<JsonNode data={result.data} path="" />
			{/if}
		</div>
	</div>
{/if}
