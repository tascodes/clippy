<script lang="ts">
	import {
		parseClaudeSession,
		toolMeta,
		type SessionEntry,
		type SessionBlock,
		type ToolCategory
	} from '$lib/parseClaudeSession';

	const TOOL_STYLES: Record<ToolCategory, { box: string; bar: string; text: string }> = {
		execute: { box: 'border-slate-300 bg-slate-50', bar: 'border-slate-200', text: 'text-slate-700' },
		read: { box: 'border-blue-200 bg-blue-50', bar: 'border-blue-200', text: 'text-blue-700' },
		edit: { box: 'border-amber-300 bg-amber-50', bar: 'border-amber-200', text: 'text-amber-700' },
		write: {
			box: 'border-green-300 bg-green-50',
			bar: 'border-green-200',
			text: 'text-green-700'
		},
		search: { box: 'border-cyan-200 bg-cyan-50', bar: 'border-cyan-200', text: 'text-cyan-700' },
		web: { box: 'border-sky-200 bg-sky-50', bar: 'border-sky-200', text: 'text-sky-700' },
		task: { box: 'border-purple-300 bg-purple-50', bar: 'border-purple-200', text: 'text-purple-700' },
		todo: { box: 'border-green-300 bg-green-50', bar: 'border-green-200', text: 'text-green-700' },
		mcp: {
			box: 'border-fuchsia-300 bg-fuchsia-50',
			bar: 'border-fuchsia-200',
			text: 'text-fuchsia-700'
		},
		other: { box: 'border-purple-200 bg-purple-50', bar: 'border-purple-200', text: 'text-purple-600' }
	};

	function inputField(input: unknown, key: string): unknown {
		return input && typeof input === 'object' ? (input as Record<string, unknown>)[key] : undefined;
	}

	function asString(v: unknown): string {
		return typeof v === 'string' ? v : v === undefined || v === null ? '' : String(v);
	}

	interface TodoItem {
		content: string;
		status: string;
	}

	function todoItems(input: unknown): TodoItem[] | null {
		const todos = inputField(input, 'todos');
		if (!Array.isArray(todos)) return null;
		return todos.map((t) => ({
			content: asString(inputField(t, 'content') ?? inputField(t, 'activeForm')),
			status: asString(inputField(t, 'status'))
		}));
	}

	interface EditPair {
		oldStr: string;
		newStr: string;
	}

	function editPairs(input: unknown): EditPair[] | null {
		const edits = inputField(input, 'edits');
		if (Array.isArray(edits)) {
			return edits.map((e) => ({
				oldStr: asString(inputField(e, 'old_string')),
				newStr: asString(inputField(e, 'new_string'))
			}));
		}
		const oldStr = inputField(input, 'old_string');
		const newStr = inputField(input, 'new_string');
		if (typeof oldStr === 'string' || typeof newStr === 'string') {
			return [{ oldStr: asString(oldStr), newStr: asString(newStr) }];
		}
		return null;
	}

	interface Props {
		content: string;
		fullscreen?: boolean;
	}

	let { content, fullscreen = false }: Props = $props();

	const entries = $derived(parseClaudeSession(content));

	function formatTime(ts?: string): string {
		if (!ts) return '';
		const d = new Date(ts);
		if (isNaN(d.getTime())) return '';
		return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
	}

	function shortModel(model?: string): string {
		if (!model) return '';
		return model.replace(/^claude-/, '').replace(/-\d{8}$/, '');
	}

	function totalTokens(u: SessionEntry['usage']): number {
		if (!u) return 0;
		return (u.inputTokens ?? 0) + (u.outputTokens ?? 0);
	}

	function formatInput(input: unknown): string {
		if (input === null || input === undefined) return '';
		if (typeof input === 'string') return input;
		try {
			return JSON.stringify(input, null, 2);
		} catch {
			return String(input);
		}
	}

	function isToolResultTurn(entry: SessionEntry): boolean {
		return (
			entry.role === 'user' &&
			entry.blocks.length > 0 &&
			entry.blocks.every((b) => b.kind === 'tool_result')
		);
	}

	function roleLabel(entry: SessionEntry): string {
		if (entry.type === 'summary') return 'Summary';
		if (entry.type === 'system') return 'System';
		if (entry.role === 'assistant') return 'Assistant';
		if (isToolResultTurn(entry)) return 'Tool Result';
		return 'User';
	}

	const CLAMP = 4000;
</script>

<div
	class="space-y-3 overflow-auto bg-purple-50 p-3 {fullscreen ? 'h-full' : 'max-h-[36rem]'}"
>
	<div class="flex items-center justify-between text-xs font-semibold text-purple-700">
		<span>Claude session · {entries.length} steps</span>
	</div>

	{#each entries as entry (entry.index)}
		{#if entry.type === 'summary'}
			<div class="border-2 border-purple-300 bg-white px-3 py-2 text-sm">
				<span class="font-bold text-purple-600">Summary:</span>
				{entry.summary}
			</div>
		{:else}
			<div
				class="border-2 border-black bg-white"
				style="box-shadow: 0.15em 0.15em currentColor;"
				class:opacity-80={entry.isSidechain}
			>
				<div
					class="flex flex-wrap items-center gap-2 border-b-2 border-black px-3 py-1.5 text-xs {entry.role ===
					'assistant'
						? 'bg-purple-100'
						: entry.type === 'system'
							? 'bg-yellow-100'
							: isToolResultTurn(entry)
								? 'bg-gray-50 text-gray-600'
								: 'bg-emerald-100 text-emerald-800'}"
				>
					<span class="font-bold text-black">{roleLabel(entry)}</span>
					{#if entry.isSidechain}
						<span class="border border-purple-400 px-1 text-purple-600">sidechain</span>
					{/if}
					{#if entry.model}
						<span class="font-mono text-purple-600">{shortModel(entry.model)}</span>
					{/if}
					<span class="ml-auto flex items-center gap-2 text-gray-500">
						{#if totalTokens(entry.usage) > 0}
							<span title="input / output tokens">
								{entry.usage?.inputTokens ?? 0}↑ {entry.usage?.outputTokens ?? 0}↓
							</span>
						{/if}
						{#if formatTime(entry.timestamp)}
							<span>{formatTime(entry.timestamp)}</span>
						{/if}
					</span>
				</div>

				<div class="space-y-2 px-3 py-2">
					{#each entry.blocks as block}
						{#if block.kind === 'text'}
							<div class="text-sm whitespace-pre-wrap text-black">{block.text}</div>
						{:else if block.kind === 'thinking'}
							<details class="border-l-2 border-purple-300 pl-2">
								<summary class="cursor-pointer text-xs font-semibold text-purple-500">
									💭 Thinking
								</summary>
								<div class="mt-1 text-sm whitespace-pre-wrap text-gray-500 italic">
									{block.text.slice(0, CLAMP)}{block.text.length > CLAMP ? '…' : ''}
								</div>
							</details>
						{:else if block.kind === 'tool_use'}
							{@const meta = toolMeta(block.name)}
							{@const style = TOOL_STYLES[meta.category]}
							{@const path = asString(inputField(block.input, 'file_path'))}
							<div class="border-2 {style.box}">
								<div class="flex items-center gap-2 border-b-2 {style.bar} px-2 py-1 text-xs">
									<span class="font-semibold {style.text}">{meta.icon} {meta.label}</span>
									{#if path}
										<span class="truncate font-mono text-gray-500">{path}</span>
									{/if}
								</div>

								{#if meta.category === 'todo'}
									{@const todos = todoItems(block.input)}
									{#if todos}
										<ul class="space-y-1 px-2 py-1.5 text-xs">
											{#each todos as todo}
												<li class="flex items-start gap-2">
													<span
														class="flex-shrink-0 {todo.status === 'completed'
															? 'text-green-600'
															: todo.status === 'in_progress'
																? 'text-amber-600'
																: 'text-gray-400'}"
													>
														{todo.status === 'completed'
															? '☑'
															: todo.status === 'in_progress'
																? '◐'
																: '☐'}
													</span>
													<span
														class="{todo.status === 'completed'
															? 'text-gray-400 line-through'
															: 'text-black'}">{todo.content}</span
													>
												</li>
											{/each}
										</ul>
									{/if}
								{:else if meta.category === 'edit'}
									{@const pairs = editPairs(block.input)}
									{#if pairs}
										<div class="space-y-2 px-2 py-1.5">
											{#each pairs as pair}
												<div class="overflow-hidden border border-gray-200 text-xs">
													<pre
														class="max-h-48 overflow-auto bg-red-50 px-2 py-1 whitespace-pre-wrap text-red-800"><code
															>{pair.oldStr.slice(0, CLAMP)}{pair.oldStr.length > CLAMP
																? '\n…'
																: ''}</code
														></pre>
													<pre
														class="max-h-48 overflow-auto border-t border-gray-200 bg-green-50 px-2 py-1 whitespace-pre-wrap text-green-800"><code
															>{pair.newStr.slice(0, CLAMP)}{pair.newStr.length > CLAMP
																? '\n…'
																: ''}</code
														></pre>
												</div>
											{/each}
										</div>
									{/if}
								{:else if meta.category === 'write'}
									{@const fileContent = asString(inputField(block.input, 'content'))}
									{#if fileContent}
										<pre
											class="max-h-64 overflow-auto px-2 py-1 text-xs whitespace-pre-wrap text-green-900"><code
												>{fileContent.slice(0, CLAMP)}{fileContent.length > CLAMP
													? '\n…'
													: ''}</code
											></pre>
									{/if}
								{:else if meta.category === 'execute'}
									{@const cmd = asString(inputField(block.input, 'command'))}
									{@const desc = asString(inputField(block.input, 'description'))}
									{#if desc}
										<div class="px-2 pt-1 text-xs text-gray-500 italic">{desc}</div>
									{/if}
									{#if cmd}
										<pre
											class="max-h-64 overflow-auto px-2 py-1 font-mono text-xs whitespace-pre-wrap text-slate-800"><code
												>$ {cmd.slice(0, CLAMP)}{cmd.length > CLAMP ? '\n…' : ''}</code
											></pre>
									{/if}
								{:else if formatInput(block.input).trim()}
									<pre
										class="max-h-64 overflow-auto px-2 py-1 text-xs whitespace-pre-wrap text-black"><code
											>{formatInput(block.input).slice(0, CLAMP)}{formatInput(block.input).length >
										CLAMP
											? '\n…'
											: ''}</code
										></pre>
								{/if}
							</div>
						{:else if block.kind === 'tool_result'}
							<details
								class="border-2 {block.isError
									? 'border-red-300 bg-red-50'
									: 'border-emerald-200 bg-emerald-50'}"
							>
								<summary
									class="cursor-pointer px-2 py-1 text-xs font-semibold {block.isError
										? 'text-red-600'
										: 'text-emerald-700'}"
								>
									{block.isError ? '⚠️ Error' : '↳ Result'}{block.toolName ? ` · ${block.toolName}` : ''}
								</summary>
								<pre
									class="max-h-64 overflow-auto border-t-2 {block.isError
										? 'border-red-200'
										: 'border-emerald-200'} bg-white px-2 py-1 text-xs whitespace-pre-wrap text-black"><code
										>{block.text.slice(0, CLAMP)}{block.text.length > CLAMP ? '\n…' : ''}</code
									></pre>
							</details>
						{:else if block.kind === 'image'}
							<div class="text-xs text-gray-400 italic">🖼️ image</div>
						{/if}
					{/each}
				</div>
			</div>
		{/if}
	{/each}
</div>
