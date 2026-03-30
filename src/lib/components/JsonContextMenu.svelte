<script lang="ts">
	import { untrack } from 'svelte';

	interface Props {
		x: number;
		y: number;
		keyName: string | number | null;
		data: unknown;
		path: string;
		onclose: () => void;
	}

	let { x, y, keyName, data, path, onclose }: Props = $props();

	let showValueAs = $state(false);
	let hideTimer: ReturnType<typeof setTimeout> | null = null;

	function showSubmenu() {
		if (hideTimer) { clearTimeout(hideTimer); hideTimer = null; }
		showValueAs = true;
	}

	function scheduleHide() {
		hideTimer = setTimeout(() => { showValueAs = false; }, 120);
	}
	let menuEl = $state<HTMLElement | null>(null);
	let submenuEl = $state<HTMLElement | null>(null);

	// Start at cursor position; $effect below adjusts once DOM is measured
	let left = $state(untrack(() => x));
	let top = $state(untrack(() => y));
	let submenuLeft = $state<'left' | 'right'>('right');

	$effect(() => {
		if (!menuEl) return;
		const vw = window.innerWidth;
		const vh = window.innerHeight;
		const rect = menuEl.getBoundingClientRect();
		left = rect.right > vw ? x - rect.width : x;
		top = rect.bottom > vh ? y - rect.height : y;
	});

	$effect(() => {
		if (!menuEl) return;
		const vw = window.innerWidth;
		const rect = menuEl.getBoundingClientRect();
		// If submenu (≈160px wide) would overflow right, flip it left
		submenuLeft = rect.right + 160 > vw ? 'left' : 'right';
	});

	$effect(() => {
		function onKeydown(e: KeyboardEvent) {
			if (e.key === 'Escape') onclose();
		}
		document.addEventListener('keydown', onKeydown);
		return () => document.removeEventListener('keydown', onKeydown);
	});

	async function copy(text: string) {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			/* ignore */
		}
		onclose();
	}

	function copyName() {
		if (keyName === null) return;
		copy(String(keyName));
	}

	function copyValue() {
		// For strings, copy the raw value without JSON quotes
		copy(typeof data === 'string' ? data : JSON.stringify(data));
	}

	function copyMinified() {
		copy(JSON.stringify(data));
	}

	function copyFormatted() {
		copy(JSON.stringify(data, null, 2));
	}

	function copyPath() {
		copy(path);
	}
</script>

<!-- Backdrop: captures clicks outside the menu -->
<div
	role="presentation"
	class="fixed inset-0 z-[9998]"
	onclick={onclose}
	oncontextmenu={(e) => { e.preventDefault(); onclose(); }}
></div>

<!-- Menu -->
<div
	bind:this={menuEl}
	class="fixed z-9999 min-w-[190px] select-none border-2 border-black bg-white py-1 text-sm"
	style="left: {left}px; top: {top}px; box-shadow: 4px 4px 0 black;"
	role="menu"
	tabindex="-1"
>
	{#if keyName !== null}
		<button
			class="w-full px-4 py-1.5 text-left text-gray-900 hover:bg-purple-400 hover:text-white"
			onclick={copyName}
			role="menuitem"
		>
			Copy Name
		</button>
	{/if}

	<button
		class="w-full px-4 py-1.5 text-left text-gray-900 hover:bg-purple-400 hover:text-white"
		onclick={copyValue}
		role="menuitem"
	>
		Copy Value
	</button>

	<!-- Copy Value As — submenu trigger -->
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="relative"
		onmouseenter={showSubmenu}
		onmouseleave={scheduleHide}
	>
		<button
			class="flex w-full items-center justify-between px-4 py-1.5 text-left transition-colors
				{showValueAs ? 'bg-purple-400 text-white' : 'text-gray-900 hover:bg-purple-400 hover:text-white'}"
			role="menuitem"
			aria-haspopup="true"
			aria-expanded={showValueAs}
		>
			<span>Copy Value As</span>
			<span class="ml-6 opacity-70">›</span>
		</button>

		{#if showValueAs}
			<div
				bind:this={submenuEl}
				class="absolute top-0 min-w-[160px] border-2 border-black bg-white py-1"
				class:right-full={submenuLeft === 'left'}
				class:left-full={submenuLeft === 'right'}
				class:mr-[-2px]={submenuLeft === 'left'}
				class:ml-[-2px]={submenuLeft === 'right'}
				style="box-shadow: 2px 2px 0 black;"
				role="menu"
				tabindex="-1"
				onmouseenter={showSubmenu}
				onmouseleave={scheduleHide}
			>
				<button
					class="w-full px-4 py-1.5 text-left text-gray-900 hover:bg-purple-400 hover:text-white"
					onclick={copyMinified}
					role="menuitem"
				>
					Minified Value
				</button>
				<button
					class="w-full px-4 py-1.5 text-left text-gray-900 hover:bg-purple-400 hover:text-white"
					onclick={copyFormatted}
					role="menuitem"
				>
					Formatted Value
				</button>
			</div>
		{/if}
	</div>

	<div class="my-1 border-t-2 border-black"></div>

	<button
		class="w-full px-4 py-1.5 text-left text-gray-900 hover:bg-purple-400 hover:text-white"
		onclick={copyPath}
		role="menuitem"
	>
		Copy Path
	</button>
</div>
