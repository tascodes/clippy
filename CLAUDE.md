# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a SvelteKit application deployed to Cloudflare Workers, configured with Tailwind CSS v4 for styling. The project uses Bun as the package manager and Wrangler for Cloudflare Workers deployment.

## Development Commands

- **Start dev server**: `bun run dev` or `vite dev`
- **Build for production**: `bun run build` (builds via Vite)
- **Preview production build**: `bun run preview` (builds and runs with Wrangler dev)
- **Deploy to Cloudflare**: `bun run deploy` (builds and deploys via Wrangler)
- **Type checking**: `bun run check` (SvelteKit sync + svelte-check)
- **Watch type checking**: `bun run check:watch`
- **Format code**: `bun run format` (runs Prettier with write)
- **Lint code**: `bun run lint` (runs Prettier check)
- **Generate Cloudflare types**: `bun run cf-typegen` (generates worker-configuration.d.ts)

## Architecture

### Deployment Target
- Configured for Cloudflare Workers via `@sveltejs/adapter-cloudflare`
- Wrangler configuration in `wrangler.jsonc`
- Worker entry point: `.svelte-kit/cloudflare/_worker.js` (generated)
- Static assets binding: `ASSETS` (configured in wrangler.jsonc)
- Node.js compatibility flag: `nodejs_als` enabled

### Project Structure
- **src/routes/**: SvelteKit routes (file-based routing)
- **src/lib/**: Reusable components and utilities (accessible via `$lib` alias)
- **src/app.d.ts**: TypeScript types for App namespace, includes Platform interface for Cloudflare env
- **src/worker-configuration.d.ts**: Auto-generated Cloudflare Worker runtime types (319KB, do not edit manually)
- **static/**: Static assets served from root
- **.svelte-kit/**: Generated SvelteKit build artifacts (gitignored)

### Technology Stack
- **Framework**: SvelteKit v2 with Svelte v5
- **Styling**: Tailwind CSS v4 (via `@tailwindcss/vite` plugin)
- **Build tool**: Vite v7
- **Runtime**: Cloudflare Workers
- **TypeScript**: Strict mode enabled
- **Formatting**: Prettier with Svelte and Tailwind plugins

## Key Configuration Notes

### TypeScript
- Extends `.svelte-kit/tsconfig.json` (auto-generated)
- Strict mode enabled
- Path aliases handled by SvelteKit configuration (except `$lib`)
- Worker runtime types imported via `worker-configuration.d.ts`

### Cloudflare Platform Access
Access Cloudflare platform features via `event.platform` in SvelteKit endpoints:
- `event.platform.env`: Environment variables and bindings (Env type)
- `event.platform.cf`: Request metadata (CfProperties type)
- `event.platform.ctx`: Execution context

### Styling
Tailwind v4 is integrated via Vite plugin (not PostCSS). Global styles in `src/app.css`.

## Wrangler Configuration

The `wrangler.jsonc` file contains commented examples for:
- Smart Placement
- Bindings (KV, D1, R2, etc.)
- Environment variables
- Service bindings

Uncomment and configure these as needed for additional Cloudflare features.
