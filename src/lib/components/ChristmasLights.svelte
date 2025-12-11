<script lang="ts">
	// Define light positions and animation delays
	const lightPositions = [
		3, 6, 9, 12, 15, 18, 21, 24, // Segment 1
		28, 31, 34, 37, 40, 43, 46, 49, // Segment 2
		53, 56, 59, 62, 65, 68, 71, 74, // Segment 3
		78, 81, 84, 87, 90, 93, 96, 99 // Segment 4
	];

	const animationDelays = [
		0, 0.3, 0.6, 0.9, 1.2, 1.5, 1.8, 0.2, 0.4, 0.7, 1.0, 1.3, 1.6, 1.9, 0.1, 0.5, 0.8, 1.1,
		1.4, 1.7, 0.15, 0.45, 0.75, 1.05, 1.35, 1.65, 1.95, 0.25, 0.55, 0.85, 1.15, 1.45
	];

	// Color palette - simple sequential assignment for clean desktop cycle
	const colorPalette = ['red', 'green', 'blue', 'yellow'];

	// Assign all 32 colors sequentially for perfect desktop R→G→B→Y cycle
	const desktopColors = Array(32)
		.fill(null)
		.map((_, i) => colorPalette[i % 4]);

	// Manually map mobile colors (indices 0,4,8,12,16,20,24,28) to get R,G,B,Y,R,G,B,Y
	const mobileColorMap: Record<number, string> = {
		0: 'red', // mobile #0
		4: 'green', // mobile #1
		8: 'blue', // mobile #2
		12: 'yellow', // mobile #3
		16: 'red', // mobile #4
		20: 'green', // mobile #5
		24: 'blue', // mobile #6
		28: 'yellow' // mobile #7
	};

	// Manually map tablet colors (indices 0,2,4,6,8,10,12,14,16,18,20,22,24,26,28,30) to get R,G,B,Y cycle
	const tabletColorMap: Record<number, string> = {
		0: 'red', // tablet #0
		2: 'green', // tablet #1
		4: 'blue', // tablet #2
		6: 'yellow', // tablet #3
		8: 'red', // tablet #4
		10: 'green', // tablet #5
		12: 'blue', // tablet #6
		14: 'yellow', // tablet #7
		16: 'red', // tablet #8
		18: 'green', // tablet #9
		20: 'blue', // tablet #10
		22: 'yellow', // tablet #11
		24: 'red', // tablet #12
		26: 'green', // tablet #13
		28: 'blue', // tablet #14
		30: 'yellow' // tablet #15
	};

	// Assign visibility classes
	const visibilityClasses = Array(32)
		.fill(null)
		.map((_, i) => {
			if (i % 4 === 0) return 'show-mobile';
			if (i % 2 === 0) return 'show-tablet';
			return 'show-desktop';
		});

	const lights = lightPositions.map((pos, i) => ({
		position: pos,
		desktopColor: desktopColors[i],
		tabletColor: tabletColorMap[i] || desktopColors[i],
		mobileColor: mobileColorMap[i] || desktopColors[i],
		delay: animationDelays[i],
		visibility: visibilityClasses[i]
	}));
</script>

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
	{#each lights as light}
		<div
			class="light {light.visibility}"
			data-mobile-color={light.mobileColor}
			data-tablet-color={light.tabletColor}
			data-desktop-color={light.desktopColor}
			style="left: {light.position}%; top: 14px; animation-delay: {light.delay}s;"
		></div>
	{/each}
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
		animation:
			glow 2s ease-in-out infinite,
			swing 3s ease-in-out infinite;
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

	/* Mobile colors */
	.light[data-mobile-color='red'] {
		background: linear-gradient(180deg, #ff0000 0%, #cc0000 100%);
		box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
	}
	.light[data-mobile-color='red']::after {
		background: #ff0000;
	}

	.light[data-mobile-color='green'] {
		background: linear-gradient(180deg, #00ff00 0%, #00cc00 100%);
		box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
	}
	.light[data-mobile-color='green']::after {
		background: #00ff00;
	}

	.light[data-mobile-color='blue'] {
		background: linear-gradient(180deg, #0080ff 0%, #0066cc 100%);
		box-shadow: 0 0 10px rgba(0, 128, 255, 0.8);
	}
	.light[data-mobile-color='blue']::after {
		background: #0080ff;
	}

	.light[data-mobile-color='yellow'] {
		background: linear-gradient(180deg, #ffff00 0%, #cccc00 100%);
		box-shadow: 0 0 10px rgba(255, 255, 0, 0.8);
	}
	.light[data-mobile-color='yellow']::after {
		background: #ffff00;
	}

	/* Tablet colors */
	@media (min-width: 640px) {
		.light[data-tablet-color='red'] {
			background: linear-gradient(180deg, #ff0000 0%, #cc0000 100%);
			box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
		}
		.light[data-tablet-color='red']::after {
			background: #ff0000;
		}

		.light[data-tablet-color='green'] {
			background: linear-gradient(180deg, #00ff00 0%, #00cc00 100%);
			box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
		}
		.light[data-tablet-color='green']::after {
			background: #00ff00;
		}

		.light[data-tablet-color='blue'] {
			background: linear-gradient(180deg, #0080ff 0%, #0066cc 100%);
			box-shadow: 0 0 10px rgba(0, 128, 255, 0.8);
		}
		.light[data-tablet-color='blue']::after {
			background: #0080ff;
		}

		.light[data-tablet-color='yellow'] {
			background: linear-gradient(180deg, #ffff00 0%, #cccc00 100%);
			box-shadow: 0 0 10px rgba(255, 255, 0, 0.8);
		}
		.light[data-tablet-color='yellow']::after {
			background: #ffff00;
		}
	}

	/* Desktop colors */
	@media (min-width: 1024px) {
		.light[data-desktop-color='red'] {
			background: linear-gradient(180deg, #ff0000 0%, #cc0000 100%);
			box-shadow: 0 0 10px rgba(255, 0, 0, 0.8);
		}
		.light[data-desktop-color='red']::after {
			background: #ff0000;
		}

		.light[data-desktop-color='green'] {
			background: linear-gradient(180deg, #00ff00 0%, #00cc00 100%);
			box-shadow: 0 0 10px rgba(0, 255, 0, 0.8);
		}
		.light[data-desktop-color='green']::after {
			background: #00ff00;
		}

		.light[data-desktop-color='blue'] {
			background: linear-gradient(180deg, #0080ff 0%, #0066cc 100%);
			box-shadow: 0 0 10px rgba(0, 128, 255, 0.8);
		}
		.light[data-desktop-color='blue']::after {
			background: #0080ff;
		}

		.light[data-desktop-color='yellow'] {
			background: linear-gradient(180deg, #ffff00 0%, #cccc00 100%);
			box-shadow: 0 0 10px rgba(255, 255, 0, 0.8);
		}
		.light[data-desktop-color='yellow']::after {
			background: #ffff00;
		}
	}

	@keyframes glow {
		0%,
		100% {
			opacity: 1;
			filter: brightness(1);
		}
		50% {
			opacity: 0.4;
			filter: brightness(0.6);
		}
	}

	@keyframes swing {
		0%,
		100% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(5deg);
		}
		75% {
			transform: rotate(-5deg);
		}
	}

	/* Responsive breakpoints for light density */
	/* Mobile: Show only show-mobile (every 4th = 8 lights) */
	.light.show-tablet,
	.light.show-desktop {
		display: none;
	}

	/* Tablet: Show show-mobile + show-tablet (every 2nd = 16 lights) */
	@media (min-width: 640px) {
		.light.show-tablet {
			display: block;
		}
		.light.show-desktop {
			display: none;
		}
	}

	/* Desktop: Show all lights (32 lights) */
	@media (min-width: 1024px) {
		.light.show-desktop {
			display: block;
		}
	}
</style>
