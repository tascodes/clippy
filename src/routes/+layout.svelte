<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>Clippy - Clipboard Inspector</title>
	<meta name="description" content="Debug your clipboard contents with ease" />
</svelte:head>

<div class="antialiased">
	{@render children?.()}
</div>
