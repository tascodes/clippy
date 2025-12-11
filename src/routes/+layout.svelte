<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import ChristmasLights from '$lib/components/ChristmasLights.svelte';

	let { children } = $props();

	const now = new Date();
	const isChristmasTime = now.getMonth() === 11 && now.getDate() >= 10 && now.getDate() <= 31;
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Clippy - Clipboard Inspector</title>
	<meta name="description" content="Debug your clipboard contents with ease" />
</svelte:head>

{#if isChristmasTime}
	<ChristmasLights />
{/if}

<div class="antialiased">
	{@render children?.()}
</div>
