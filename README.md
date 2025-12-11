# Clippy

A clipboard inspection tool that shows you exactly what's in your clipboard across all data formats.

## What it does

Clippy reveals the hidden complexity of clipboard data. When you copy something, it's often stored in multiple formats (plain text, HTML, images, RTF, etc.). This tool displays all of them so you can:

- See rendered HTML alongside raw markup
- View images and their metadata
- Inspect MIME types and file sizes
- Copy content back as plaintext

Built with SvelteKit and deployed to Cloudflare Workers.

## Local development

Install dependencies:

```sh
bun install
```

Start the dev server:

```sh
bun run dev
```

The app will be available at `http://localhost:5173`.

## Deploying

This app is configured for Cloudflare Workers. To deploy:

```sh
bun run deploy
```

This builds the app and deploys it via Wrangler. Make sure you're authenticated with Cloudflare CLI first (`wrangler login`).
