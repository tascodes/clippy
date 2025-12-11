<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';

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
	<div class="christmas-lights">
		<svg class="lights-string" viewBox="0 0 100 10" preserveAspectRatio="none">
			<path
				d="M 0,1 Q 6,5 12.5,5 Q 19,5 25,1 Q 31,5 37.5,5 Q 44,5 50,1 Q 56,5 62.5,5 Q 69,5 75,1 Q 81,5 87.5,5 Q 94,5 100,1"
				stroke="#333"
				stroke-width="0.3"
				fill="none"
			/>
		</svg>
		<!-- Pin markers -->
		<div class="pin" style="left: 0%;"></div>
		<div class="pin" style="left: 25%;"></div>
		<div class="pin" style="left: 50%;"></div>
		<div class="pin" style="left: 75%;"></div>
		<div class="pin" style="left: 100%;"></div>

		<!-- Lights hanging from the sagging sections -->
		<!-- Segment 1: 0-25% -->
		<div class="light red" style="left: 3%; top: 14px; animation-delay: 0s;"></div>
		<div class="light green" style="left: 6%; top: 14px; animation-delay: 0.3s;"></div>
		<div class="light blue" style="left: 9%; top: 14px; animation-delay: 0.6s;"></div>
		<div class="light yellow" style="left: 12%; top: 14px; animation-delay: 0.9s;"></div>
		<div class="light red" style="left: 15%; top: 14px; animation-delay: 1.2s;"></div>
		<div class="light green" style="left: 18%; top: 14px; animation-delay: 1.5s;"></div>
		<div class="light blue" style="left: 21%; top: 14px; animation-delay: 1.8s;"></div>
		<div class="light yellow" style="left: 24%; top: 14px; animation-delay: 0.2s;"></div>

		<!-- Segment 2: 25-50% -->
		<div class="light red" style="left: 28%; top: 14px; animation-delay: 0.4s;"></div>
		<div class="light green" style="left: 31%; top: 14px; animation-delay: 0.7s;"></div>
		<div class="light blue" style="left: 34%; top: 14px; animation-delay: 1.0s;"></div>
		<div class="light yellow" style="left: 37%; top: 14px; animation-delay: 1.3s;"></div>
		<div class="light red" style="left: 40%; top: 14px; animation-delay: 1.6s;"></div>
		<div class="light green" style="left: 43%; top: 14px; animation-delay: 1.9s;"></div>
		<div class="light blue" style="left: 46%; top: 14px; animation-delay: 0.1s;"></div>
		<div class="light yellow" style="left: 49%; top: 14px; animation-delay: 0.5s;"></div>

		<!-- Segment 3: 50-75% -->
		<div class="light red" style="left: 53%; top: 14px; animation-delay: 0.8s;"></div>
		<div class="light green" style="left: 56%; top: 14px; animation-delay: 1.1s;"></div>
		<div class="light blue" style="left: 59%; top: 14px; animation-delay: 1.4s;"></div>
		<div class="light yellow" style="left: 62%; top: 14px; animation-delay: 1.7s;"></div>
		<div class="light red" style="left: 65%; top: 14px; animation-delay: 0.15s;"></div>
		<div class="light green" style="left: 68%; top: 14px; animation-delay: 0.45s;"></div>
		<div class="light blue" style="left: 71%; top: 14px; animation-delay: 0.75s;"></div>
		<div class="light yellow" style="left: 74%; top: 14px; animation-delay: 1.05s;"></div>

		<!-- Segment 4: 75-100% -->
		<div class="light red" style="left: 78%; top: 14px; animation-delay: 1.35s;"></div>
		<div class="light green" style="left: 81%; top: 14px; animation-delay: 1.65s;"></div>
		<div class="light blue" style="left: 84%; top: 14px; animation-delay: 1.95s;"></div>
		<div class="light yellow" style="left: 87%; top: 14px; animation-delay: 0.25s;"></div>
		<div class="light red" style="left: 90%; top: 14px; animation-delay: 0.55s;"></div>
		<div class="light green" style="left: 93%; top: 14px; animation-delay: 0.85s;"></div>
		<div class="light blue" style="left: 96%; top: 14px; animation-delay: 1.15s;"></div>
		<div class="light yellow" style="left: 99%; top: 14px; animation-delay: 1.45s;"></div>
	</div>
{/if}

<div class="antialiased">
	{@render children?.()}
</div>

<style>
	.christmas-lights {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 60px;
		pointer-events: none;
	}

	.lights-string {
		position: absolute;
		top: 0;
		left: 0;
		width: 100%;
		height: 30px;
	}

	.pin {
		position: absolute;
		top: 2px;
		width: 8px;
		height: 8px;
		background: #666;
		border-radius: 50%;
		transform: translateX(-50%);
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
	}

	.light {
		position: absolute;
		width: 12px;
		height: 18px;
		border-radius: 0 0 50% 50%;
		animation: glow 2s ease-in-out infinite, swing 3s ease-in-out infinite;
		transform-origin: top center;
	}

	.light::before {
		content: '';
		position: absolute;
		top: -3px;
		left: 50%;
		transform: translateX(-50%);
		width: 4px;
		height: 5px;
		background: #444;
		border-radius: 1px;
	}

	.light::after {
		content: '';
		position: absolute;
		top: 3px;
		left: 50%;
		transform: translateX(-50%);
		width: 8px;
		height: 8px;
		border-radius: 50%;
		filter: blur(6px);
		opacity: 0.8;
	}

	.light.red {
		background: linear-gradient(180deg, #ff0000 0%, #cc0000 100%);
		box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
	}

	.light.red::after {
		background: #ff0000;
	}

	.light.green {
		background: linear-gradient(180deg, #00ff00 0%, #00cc00 100%);
		box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
	}

	.light.green::after {
		background: #00ff00;
	}

	.light.blue {
		background: linear-gradient(180deg, #0080ff 0%, #0066cc 100%);
		box-shadow: 0 0 10px rgba(0, 128, 255, 0.8);
	}

	.light.blue::after {
		background: #0080ff;
	}

	.light.yellow {
		background: linear-gradient(180deg, #ffff00 0%, #cccc00 100%);
		box-shadow: 0 0 10px rgba(255, 255, 0, 0.8);
	}

	.light.yellow::after {
		background: #ffff00;
	}

	@keyframes glow {
		0%, 100% {
			opacity: 1;
			filter: brightness(1);
		}
		50% {
			opacity: 0.4;
			filter: brightness(0.6);
		}
	}

	@keyframes swing {
		0%, 100% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(2deg);
		}
		75% {
			transform: rotate(-2deg);
		}
	}
</style>
