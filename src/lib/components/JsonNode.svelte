<script lang="ts">
	import { getContext } from 'svelte';
	import JsonNode from './JsonNode.svelte';
	import JsonContextMenu from './JsonContextMenu.svelte';
	import { SEARCH_CTX, splitHighlight, type SearchCtx } from '$lib/searchJson';

	interface Props {
		data: unknown;
		keyName?: string | number | null;
		depth?: number;
		/** Dot-notation path to this node, e.g. "fill.linear-gradient[0]" */
		path?: string;
	}

	let { data, keyName = null, depth = 0, path = '' }: Props = $props();

	// All groups start collapsed; the user can expand freely after mount.
	let collapsed = $state(true);

	// Context menu state
	let menu = $state<{ x: number; y: number } | null>(null);

	// Row element ref (for scroll-into-view)
	let rowEl = $state<HTMLElement | null>(null);

	// Search context provided by JsonViewer
	const search = getContext<SearchCtx | undefined>(SEARCH_CTX);

	const isNull = $derived(data === null);
	const isObject = $derived(!isNull && typeof data === 'object' && !Array.isArray(data));
	const isArray = $derived(Array.isArray(data));
	const isExpandable = $derived(isObject || isArray);

	const entries = $derived.by((): [string | number, unknown][] => {
		if (isObject) return Object.entries(data as Record<string, unknown>);
		if (isArray) return (data as unknown[]).map((v, i) => [i, v] as [number, unknown]);
		return [];
	});

	const openBracket = $derived(isArray ? '[' : '{');
	const closeBracket = $derived(isArray ? ']' : '}');

	// The full display string for the key (used for both search matching and highlighting)
	const keyStr = $derived(keyName === null ? '' : typeof keyName === 'number' ? `[${keyName}]` : String(keyName));

	// Highlight segments for key and value
	const keySegs = $derived(search ? splitHighlight(keyStr, search.term) : [{ text: keyStr, match: false }]);
	const valSegs = $derived.by(() => {
		const raw = formatValue();
		return search ? splitHighlight(raw, search.term) : [{ text: raw, match: false }];
	});

	// Is this the currently selected match?
	const isCurrentKeyMatch = $derived(
		search?.currentMatch?.path === path && search?.currentMatch?.matchIn === 'key'
	);
	const isCurrentValMatch = $derived(
		search?.currentMatch?.path === path && search?.currentMatch?.matchIn === 'value'
	);

	// Does any match exist at this path (for non-current highlight)?
	const pathMatchInfo = $derived(search?.matchMap.get(path));

	// Auto-expand when this node is an ancestor of the current match
	$effect(() => {
		if (isExpandable && search?.expandPaths.has(path)) {
			collapsed = false;
		}
	});

	// Scroll into view when the user actively navigates to this match (not on bare typing)
	$effect(() => {
		const cm = search?.currentMatch;
		if (cm?.path === path && rowEl && search?.userNavigated) {
			// Small delay so expand effects can settle before scrolling
			setTimeout(() => rowEl?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }), 60);
		}
	});

	function valueColor(): string {
		if (typeof data === 'string') return 'text-blue-600';
		if (typeof data === 'number') return 'text-emerald-600';
		if (typeof data === 'boolean') return 'text-violet-600';
		if (data === null) return 'text-gray-400';
		return 'text-gray-700';
	}

	function formatValue(): string {
		if (typeof data === 'string') return `"${data}"`;
		if (data === null) return 'null';
		return String(data);
	}

	function handleContextMenu(e: MouseEvent) {
		e.preventDefault();
		e.stopPropagation();
		menu = { x: e.clientX, y: e.clientY };
	}

	/** Build the path for a child key relative to this node's path. */
	function childPath(k: string | number): string {
		if (typeof k === 'number') return path ? `${path}[${k}]` : `[${k}]`;
		return path ? `${path}.${k}` : k;
	}
</script>

<div class="font-mono text-sm">
	<!-- Header row -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		bind:this={rowEl}
		class="flex cursor-default items-start gap-1.5 rounded py-[3px] pl-1 pr-2 hover:bg-gray-50
			{isCurrentKeyMatch || isCurrentValMatch ? 'bg-orange-50' : ''}"
		oncontextmenu={handleContextMenu}
	>
		<!-- Expand/collapse toggle -->
		{#if isExpandable}
			<button
				onclick={() => (collapsed = !collapsed)}
				class="mt-[2px] flex h-[14px] w-[14px] flex-shrink-0 cursor-pointer items-center justify-center border border-gray-400 text-[9px] leading-none text-gray-500 transition-colors hover:border-gray-700 hover:bg-gray-100"
				aria-label={collapsed ? 'Expand' : 'Collapse'}
			>
				{collapsed ? '+' : '−'}
			</button>
		{:else}
			<span class="mt-[2px] h-[14px] w-[14px] flex-shrink-0"></span>
		{/if}

		<!-- Key -->
		{#if keyName !== null}
			<span class="shrink-0 {typeof keyName === 'number' ? 'text-gray-500' : 'text-gray-800'}">
				{#each keySegs as seg}
					{#if seg.match && (pathMatchInfo?.key || isCurrentKeyMatch)}
						<mark
							class="rounded-sm not-italic
								{isCurrentKeyMatch ? 'bg-orange-400 text-white' : 'bg-yellow-200 text-gray-900'}"
						>{seg.text}</mark>
					{:else}
						{seg.text}
					{/if}
				{/each}
			</span>
			<span class="mx-0.5 shrink-0 select-none text-gray-400">:</span>
		{/if}

		<!-- Value -->
		{#if isExpandable}
			{#if collapsed}
				<button
					onclick={() => (collapsed = false)}
					class="cursor-pointer font-mono text-cyan-600 hover:text-cyan-800 hover:underline"
				>
					{isArray ? '[...]' : '{...}'}
				</button>
			{:else}
				<span class="text-gray-500">{openBracket}</span>
			{/if}
		{:else}
			<span class={valueColor()}>
				{#each valSegs as seg}
					{#if seg.match && (pathMatchInfo?.value || isCurrentValMatch)}
						<mark
							class="rounded-sm not-italic
								{isCurrentValMatch ? 'bg-orange-400 text-white' : 'bg-yellow-200 text-gray-900'}"
						>{seg.text}</mark>
					{:else}
						{seg.text}
					{/if}
				{/each}
			</span>
		{/if}
	</div>

	{#if isExpandable && !collapsed}
		<!-- Children: indented with tree guide line -->
		<div class="ml-5 border-l-2 border-gray-200 pl-1">
			{#each entries as [k, v]}
				<JsonNode data={v} keyName={k} depth={depth + 1} path={childPath(k)} />
			{/each}
		</div>
		<!-- Closing bracket aligned with the key text above (spacer = toggle width) -->
		<div class="flex items-start gap-1.5 py-[3px] pl-1">
			<span class="h-[14px] w-[14px] flex-shrink-0"></span>
			<span class="text-gray-500">{closeBracket}</span>
		</div>
	{/if}
</div>

{#if menu}
	<JsonContextMenu
		x={menu.x}
		y={menu.y}
		{keyName}
		{data}
		{path}
		onclose={() => (menu = null)}
	/>
{/if}
