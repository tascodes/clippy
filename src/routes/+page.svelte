<script lang="ts">
	interface ClipboardData {
		type: string;
		content: string | null;
		html?: string;
		imageUrl?: string;
		size?: number;
		fileName?: string;
	}

	let clipboardData = $state<ClipboardData[]>([]);
	let isPasting = $state(false);

	async function copyAsPlaintext(content: string | null) {
		if (!content) return;
		try {
			await navigator.clipboard.writeText(content);
		} catch (err) {
			console.error('Failed to copy:', err);
			alert('Failed to copy to clipboard');
		}
	}

	async function pasteFromClipboardAPI() {
		try {
			const clipboardItems = await navigator.clipboard.read();
			isPasting = true;
			clipboardData = [];

			const newData: ClipboardData[] = [];

			for (const item of clipboardItems) {
				for (const type of item.types) {
					if (type.startsWith('image/')) {
						const blob = await item.getType(type);
						const imageUrl = URL.createObjectURL(blob);
						newData.push({
							type: type,
							content: `Image (${blob.size} bytes)`,
							imageUrl,
							size: blob.size
						});
					} else {
						const blob = await item.getType(type);
						const text = await blob.text();
						const dataItem: ClipboardData = {
							type: type,
							content: text || '(empty)',
							size: blob.size
						};

						if (type === 'text/html') {
							dataItem.html = text;
						}

						newData.push(dataItem);
					}
				}
			}

			clipboardData = newData;
			isPasting = false;
		} catch (err) {
			console.error('Failed to read clipboard:', err);
			alert('Failed to read clipboard. Make sure you granted clipboard permissions.');
			isPasting = false;
		}
	}

	async function handlePaste(e: ClipboardEvent) {
		e.preventDefault();
		isPasting = true;
		clipboardData = []; // Clear previous contents
		const clipData = e.clipboardData;

		if (!clipData) {
			isPasting = false;
			return;
		}

		const newData: ClipboardData[] = [];

		// Get all available types
		const types = clipData.types;

		// Process items using DataTransferItemList
		const items = clipData.items;
		const promises: Promise<void>[] = [];

		for (let i = 0; i < items.length; i++) {
			const item = items[i];
			const itemType = item.type; // Capture type before async operation
			const itemKind = item.kind;

			if (itemKind === 'file') {
				const file = item.getAsFile();
				if (file) {
					if (file.type.startsWith('image/')) {
						const imageUrl = URL.createObjectURL(file);
						newData.push({
							type: file.type,
							content: `Image (${file.size} bytes, ${file.name || 'unnamed'})`,
							imageUrl,
							size: file.size,
							fileName: file.name || 'unnamed'
						});
					} else {
						newData.push({
							type: file.type || 'application/octet-stream',
							content: `File: ${file.name || 'unnamed'} (${file.size} bytes)`,
							size: file.size,
							fileName: file.name || 'unnamed'
						});
					}
				}
			} else if (itemKind === 'string') {
				const promise = new Promise<void>((resolve) => {
					item.getAsString((str) => {
						const dataItem: ClipboardData = {
							type: itemType, // Use captured type
							content: str || '(empty)',
							size: new Blob([str]).size
						};

						// If it's HTML, also store it for rendering
						if (itemType === 'text/html') {
							dataItem.html = str;
						}

						newData.push(dataItem);
						resolve();
					});
				});
				promises.push(promise);
			}
		}

		// Wait for all string items to be processed
		await Promise.all(promises);

		// Also try getData for common types to ensure we get everything
		for (const type of types) {
			// Skip if we already have this type from items
			if (newData.some(d => d.type === type)) continue;

			try {
				const data = clipData.getData(type);
				if (data) {
					const dataItem: ClipboardData = {
						type: type,
						content: data,
						size: new Blob([data]).size
					};

					if (type === 'text/html') {
						dataItem.html = data;
					}

					newData.push(dataItem);
				}
			} catch (e) {
			}
		}

		clipboardData = newData;
		isPasting = false;
	}

</script>

<div class="min-h-screen bg-white" onpaste={handlePaste}>
	<div class="container mx-auto px-4 py-8 max-w-4xl">
		<header class="mb-12">
			<h1 class="text-5xl font-bold text-purple-600 mb-6">📋 Clippy</h1>
			<p class="text-xl text-black mb-4">
				See what's actually in your clipboard.
			</p>

			<div class="bg-purple-50 border-4 border-purple-600 p-6">
				<p class="font-bold text-lg mb-4">To get started, either:</p>
				<ul class="space-y-4 text-black">
					<li class="flex items-start gap-3">
						<span class="flex-shrink-0">•</span>
						<div class="flex items-center gap-2 flex-wrap">
							<button
								onclick={pasteFromClipboardAPI}
								class="appearance-none border-2 border-black px-2 py-1 bg-white text-black whitespace-nowrap hover:bg-purple-100 transition-colors"
								style="box-shadow: 0.1em 0.1em currentColor;"
							>
								Paste using the Clipboard API
							</button>
							<span>if your browser supports the Asynchronous Clipboard API</span>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="flex-shrink-0">•</span>
						<div class="flex items-center gap-2 flex-wrap">
							<span>Paste with the</span>
							<kbd class="px-2 py-1 bg-white border-2 border-black font-mono text-sm">Ctrl+V</kbd>
							<span>/</span>
							<kbd class="px-2 py-1 bg-white border-2 border-black font-mono text-sm">⌘V</kbd>
							<span>keyboard shortcut</span>
						</div>
					</li>
					<li class="flex items-start gap-3">
						<span class="flex-shrink-0">•</span>
						<div class="flex items-center gap-2 flex-wrap">
							<input
								type="text"
								placeholder="paste in here"
								onpaste={handlePaste}
								class="px-3 py-1 bg-white border-2 border-black focus:outline-none focus:border-purple-600"
							/>
							<span>if you don't have a keyboard</span>
						</div>
					</li>
				</ul>
			</div>
		</header>

		{#if isPasting}
			<div class="text-center text-purple-500 my-12">
				<div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4"></div>
				<p class="text-lg">Processing clipboard...</p>
			</div>
		{/if}

		{#if clipboardData.length > 0}
			<div>
				<div class="flex items-center justify-between mb-4">
					<h2 class="text-2xl font-bold text-purple-600">Clipboard Contents</h2>
					<span class="bg-purple-100 text-purple-700 px-4 py-2 font-semibold">
						{clipboardData.length} {clipboardData.length === 1 ? 'item' : 'items'}
					</span>
				</div>

				<table class="w-full table-fixed">
					<thead>
						<tr class="bg-purple-100">
							<th class="border-b-2 border-r-2 border-black px-4 py-3 text-left font-bold text-black w-1/4">Type</th>
							<th class="border-b-2 border-black px-4 py-3 text-left font-bold text-black w-3/4">Contents</th>
						</tr>
					</thead>
					<tbody>
						{#each clipboardData as data}
							<tr class="bg-white">
								<td class="border-b-2 border-r-2 border-black px-4 py-3 align-top break-words">
									<div class="flex flex-col gap-2">
										<code class="text-sm text-purple-600 font-semibold break-all">{data.type}</code>
										{#if !data.imageUrl}
											<button
												onclick={() => copyAsPlaintext(data.content)}
												class="appearance-none border-2 border-black px-2 py-1 bg-white text-black text-xs hover:bg-purple-100 transition-colors w-fit"
												style="box-shadow: 0.1em 0.1em currentColor;"
											>
												Copy as plaintext
											</button>
										{/if}
									</div>
								</td>
								<td class="border-b-2 border-black px-4 py-3 break-words">
									{#if data.imageUrl}
										<div class="mb-2">
											<img
												src={data.imageUrl}
												alt="Clipboard content"
												class="max-w-full border-2 border-purple-200"
											/>
										</div>
										<p class="text-sm text-black">{data.content}</p>
									{:else if data.html && data.type === 'text/html'}
										<div class="space-y-4">
											<div>
												<h4 class="font-semibold text-purple-600 mb-2">Rendered HTML:</h4>
												<div class="bg-purple-50 p-4 border-2 border-purple-200 overflow-auto max-h-96">
													{@html data.html}
												</div>
											</div>
											<div>
												<h4 class="font-semibold text-purple-600 mb-2">Raw HTML:</h4>
												<pre class="bg-white p-4 text-sm border-2 border-black whitespace-pre-wrap break-words overflow-auto max-h-96"><code>{data.content}</code></pre>
											</div>
										</div>
									{:else}
										<pre class="bg-white p-4 text-sm whitespace-pre-wrap break-words border-2 border-black"><code>{data.content}</code></pre>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>

				<div class="mt-8">
					<h3 class="text-xl font-bold text-purple-600 mb-4">Items and Files Metadata</h3>
					<table class="w-full table-fixed">
						<thead>
							<tr class="bg-purple-100">
								<th class="border-b-2 border-r-2 border-black px-4 py-3 text-left font-bold text-black w-1/4">Type</th>
								<th class="border-b-2 border-r-2 border-black px-4 py-3 text-left font-bold text-black w-1/4">Size</th>
								<th class="border-b-2 border-black px-4 py-3 text-left font-bold text-black w-1/2">File Name</th>
							</tr>
						</thead>
						<tbody>
							{#each clipboardData as data}
								<tr class="bg-white">
									<td class="border-b-2 border-r-2 border-black px-4 py-3 align-top break-words">
										<code class="text-sm text-purple-600 font-semibold break-all">{data.type}</code>
									</td>
									<td class="border-b-2 border-r-2 border-black px-4 py-3 text-sm text-black">
										{#if data.size !== undefined}
											{data.size.toLocaleString()} bytes
										{:else}
											-
										{/if}
									</td>
									<td class="border-b-2 border-black px-4 py-3 text-sm text-black break-words">
										{data.fileName || '-'}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

		<footer class="mt-12 text-center text-sm text-black pb-8">
			Built by Tas Hasting and mostly Claude tbh
		</footer>
	</div>
</div>

