<script lang="ts">
	interface Props {
		term: string;
		matchCount: number;
		currentIdx: number;
		onnext: () => void;
		onprev: () => void;
		onclose: () => void;
		oninput: (term: string) => void;
	}

	let { term, matchCount, currentIdx, onnext, onprev, onclose, oninput }: Props = $props();

	let inputEl = $state<HTMLInputElement | null>(null);

	// Auto-focus when the bar mounts
	$effect(() => {
		inputEl?.focus();
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Enter') {
			e.preventDefault();
			if (e.shiftKey) onprev();
			else onnext();
		} else if (e.key === 'Escape') {
			onclose();
		}
	}

	const noMatches = $derived(term.length >= 3 && matchCount === 0);
</script>

<div class="flex items-center gap-1.5 border-b-2 border-black bg-white px-3 py-2">
	<!-- Search input -->
	<div
		class="flex flex-1 items-center gap-2 border-2 px-2 py-1 transition-colors
			{noMatches ? 'border-red-400 bg-red-50' : 'border-gray-300 bg-white'}"
	>
		<svg
			class="h-3.5 w-3.5 flex-shrink-0 text-gray-400"
			fill="none"
			viewBox="0 0 24 24"
			stroke="currentColor"
			stroke-width="2.5"
		>
			<path
				stroke-linecap="round"
				stroke-linejoin="round"
				d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
			/>
		</svg>
		<input
			bind:this={inputEl}
			type="text"
			value={term}
			oninput={(e) => oninput(e.currentTarget.value)}
			onkeydown={handleKeydown}
			placeholder="Find in JSON…"
			class="flex-1 bg-transparent font-mono text-sm outline-none"
		/>
		{#if term.length > 0}
			<button
				onclick={() => oninput('')}
				class="text-gray-400 hover:text-gray-600"
				aria-label="Clear"
			>
				<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		{/if}
	</div>

	<!-- Match counter -->
	<span class="min-w-[72px] text-center font-mono text-xs tabular-nums text-gray-500">
		{#if term.length < 3}
			3+ chars
		{:else if noMatches}
			<span class="text-red-500 font-semibold">No matches</span>
		{:else}
			{currentIdx + 1} / {matchCount}
		{/if}
	</span>

	<!-- Prev (‹) -->
	<button
		onclick={onprev}
		disabled={matchCount === 0}
		title="Previous match (Shift+Enter)"
		class="flex h-7 w-7 items-center justify-center border-2 border-black text-base font-bold
			transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
		style="box-shadow: 0.1em 0.1em currentColor;"
	>‹</button>

	<!-- Next (›) -->
	<button
		onclick={onnext}
		disabled={matchCount === 0}
		title="Next match (Enter)"
		class="flex h-7 w-7 items-center justify-center border-2 border-black text-base font-bold
			transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30"
		style="box-shadow: 0.1em 0.1em currentColor;"
	>›</button>

	<!-- Close (✕) -->
	<button
		onclick={onclose}
		title="Close (Escape)"
		class="flex h-7 w-7 items-center justify-center border-2 border-black text-xs font-bold
			transition-colors hover:bg-gray-100"
		style="box-shadow: 0.1em 0.1em currentColor;"
	>✕</button>
</div>
