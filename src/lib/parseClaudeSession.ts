export type SessionBlock =
	| { kind: 'text'; text: string }
	| { kind: 'thinking'; text: string }
	| { kind: 'tool_use'; id: string; name: string; input: unknown }
	| { kind: 'tool_result'; toolUseId: string; toolName?: string; text: string; isError: boolean }
	| { kind: 'image'; text: string };

export interface SessionUsage {
	inputTokens?: number;
	outputTokens?: number;
	cacheReadTokens?: number;
	cacheCreationTokens?: number;
}

export interface SessionEntry {
	index: number;
	type: string;
	role?: string;
	timestamp?: string;
	model?: string;
	isSidechain?: boolean;
	isMeta?: boolean;
	blocks: SessionBlock[];
	usage?: SessionUsage;
	summary?: string;
}

const KNOWN_TYPES = new Set(['user', 'assistant', 'system', 'summary']);

export type ToolCategory =
	| 'execute'
	| 'read'
	| 'edit'
	| 'write'
	| 'search'
	| 'web'
	| 'task'
	| 'todo'
	| 'mcp'
	| 'other';

export function toolMeta(name: string): { icon: string; category: ToolCategory; label: string } {
	switch (name) {
		case 'Bash':
		case 'BashOutput':
		case 'KillShell':
			return { icon: '$', category: 'execute', label: name };
		case 'Read':
		case 'NotebookRead':
			return { icon: '📖', category: 'read', label: name };
		case 'Edit':
		case 'MultiEdit':
		case 'NotebookEdit':
			return { icon: '✏️', category: 'edit', label: name };
		case 'Write':
			return { icon: '📝', category: 'write', label: name };
		case 'Glob':
		case 'Grep':
		case 'LS':
			return { icon: '🔍', category: 'search', label: name };
		case 'WebSearch':
		case 'WebFetch':
			return { icon: '🌐', category: 'web', label: name };
		case 'Task':
		case 'Agent':
			return { icon: '🤖', category: 'task', label: name };
		case 'TodoWrite':
			return { icon: '☑', category: 'todo', label: name };
	}
	if (name.startsWith('mcp__')) {
		const parts = name.split('__').slice(1);
		return { icon: '🔌', category: 'mcp', label: parts.join(' · ') || name };
	}
	return { icon: '🔧', category: 'other', label: name };
}

function parseLines(content: string): {
	objects: Record<string, unknown>[];
	parsed: number;
	total: number;
} {
	const lines = content
		.split('\n')
		.map((l) => l.trim())
		.filter((l) => l.length > 0);
	const objects: Record<string, unknown>[] = [];
	let parsed = 0;
	for (const line of lines) {
		try {
			const obj = JSON.parse(line);
			if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
				objects.push(obj as Record<string, unknown>);
				parsed++;
			}
		} catch {}
	}
	return { objects, parsed, total: lines.length };
}

/**
 * Returns true if the content looks like a Claude Code session log (JSONL where
 * lines carry a `type` of user/assistant/system/summary and message/session shape).
 */
export function looksLikeClaudeSession(content: string | null): boolean {
	if (!content) return false;
	const { objects, parsed, total } = parseLines(content);
	if (total < 2 || parsed < 2) return false;
	if (parsed / total < 0.6) return false;

	let signalCount = 0;
	let hasConversation = false;
	for (const obj of objects) {
		const type = obj.type;
		if (typeof type === 'string' && KNOWN_TYPES.has(type)) {
			signalCount++;
			const msg = obj.message;
			if ((type === 'user' || type === 'assistant') && msg && typeof msg === 'object') {
				if ('role' in (msg as object) || 'content' in (msg as object)) hasConversation = true;
			}
		} else if ('sessionId' in obj || 'uuid' in obj) {
			signalCount++;
		}
	}
	return hasConversation && signalCount / objects.length >= 0.5;
}

function extractUsage(usage: unknown): SessionUsage | undefined {
	if (!usage || typeof usage !== 'object') return undefined;
	const u = usage as Record<string, unknown>;
	const num = (v: unknown) => (typeof v === 'number' ? v : undefined);
	const out: SessionUsage = {
		inputTokens: num(u.input_tokens),
		outputTokens: num(u.output_tokens),
		cacheReadTokens: num(u.cache_read_input_tokens),
		cacheCreationTokens: num(u.cache_creation_input_tokens)
	};
	if (
		out.inputTokens === undefined &&
		out.outputTokens === undefined &&
		out.cacheReadTokens === undefined &&
		out.cacheCreationTokens === undefined
	)
		return undefined;
	return out;
}

function textFromContent(content: unknown): string {
	if (typeof content === 'string') return content;
	if (Array.isArray(content)) {
		return content
			.map((b) => {
				if (typeof b === 'string') return b;
				if (b && typeof b === 'object' && typeof (b as Record<string, unknown>).text === 'string')
					return (b as Record<string, unknown>).text as string;
				return '';
			})
			.join('\n');
	}
	return '';
}

function normalizeBlocks(content: unknown, toolNames: Map<string, string>): SessionBlock[] {
	if (typeof content === 'string') {
		return content.trim().length > 0 ? [{ kind: 'text', text: content }] : [];
	}
	if (!Array.isArray(content)) return [];

	const blocks: SessionBlock[] = [];
	for (const b of content) {
		if (!b || typeof b !== 'object') continue;
		const block = b as Record<string, unknown>;
		switch (block.type) {
			case 'text':
				if (typeof block.text === 'string' && block.text.trim().length > 0)
					blocks.push({ kind: 'text', text: block.text });
				break;
			case 'thinking':
				if (typeof block.thinking === 'string')
					blocks.push({ kind: 'thinking', text: block.thinking });
				break;
			case 'tool_use':
				blocks.push({
					kind: 'tool_use',
					id: typeof block.id === 'string' ? block.id : '',
					name: typeof block.name === 'string' ? block.name : 'tool',
					input: block.input
				});
				break;
			case 'tool_result': {
				const id = typeof block.tool_use_id === 'string' ? block.tool_use_id : '';
				blocks.push({
					kind: 'tool_result',
					toolUseId: id,
					toolName: toolNames.get(id),
					text: textFromContent(block.content),
					isError: block.is_error === true
				});
				break;
			}
			case 'image':
				blocks.push({ kind: 'image', text: '[image]' });
				break;
		}
	}
	return blocks;
}

/**
 * Parses a Claude session JSONL string into a flat list of renderable entries.
 * Metadata-only lines (mode, attachment, file snapshots, etc.) are dropped.
 */
export function parseClaudeSession(content: string): SessionEntry[] {
	const { objects } = parseLines(content);

	const toolNames = new Map<string, string>();
	for (const obj of objects) {
		const msg = obj.message;
		if (msg && typeof msg === 'object') {
			const c = (msg as Record<string, unknown>).content;
			if (Array.isArray(c)) {
				for (const b of c) {
					if (b && typeof b === 'object' && (b as Record<string, unknown>).type === 'tool_use') {
						const blk = b as Record<string, unknown>;
						if (typeof blk.id === 'string' && typeof blk.name === 'string')
							toolNames.set(blk.id, blk.name);
					}
				}
			}
		}
	}

	const entries: SessionEntry[] = [];
	let index = 0;
	for (const obj of objects) {
		const type = typeof obj.type === 'string' ? obj.type : '';

		if (type === 'summary') {
			const summary =
				typeof obj.summary === 'string'
					? obj.summary
					: typeof obj.title === 'string'
						? (obj.title as string)
						: '';
			if (summary) entries.push({ index: index++, type, blocks: [], summary });
			continue;
		}

		if (!KNOWN_TYPES.has(type)) continue;

		const msg = obj.message as Record<string, unknown> | undefined;
		const blocks = msg ? normalizeBlocks(msg.content, toolNames) : [];

		if (type === 'system') {
			const text =
				typeof obj.content === 'string' ? obj.content : msg ? textFromContent(msg.content) : '';
			if (!text.trim() && blocks.length === 0) continue;
			entries.push({
				index: index++,
				type,
				timestamp: typeof obj.timestamp === 'string' ? obj.timestamp : undefined,
				blocks: text.trim() ? [{ kind: 'text', text }] : blocks
			});
			continue;
		}

		if (blocks.length === 0) continue;

		entries.push({
			index: index++,
			type,
			role: msg && typeof msg.role === 'string' ? msg.role : type,
			timestamp: typeof obj.timestamp === 'string' ? obj.timestamp : undefined,
			model: msg && typeof msg.model === 'string' ? (msg.model as string) : undefined,
			isSidechain: obj.isSidechain === true,
			isMeta: obj.isMeta === true,
			usage: msg ? extractUsage(msg.usage) : undefined,
			blocks
		});
	}

	return entries;
}
