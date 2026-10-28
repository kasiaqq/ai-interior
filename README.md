# AI Interior

A web app concept for finding a fresh look for your home: upload a photo of a room, pick one of four styles — Japandi, Scandinavian, Industrial or Mid-century modern — and get a visualization of that same room restyled.

The room's structure is never touched. Walls, windows, ceiling height and room size stay exactly as they are; doors stay in place; radiators, sockets, beams, fireplaces, stairs and niches stay where they are. Everything else — furniture, floor, wall colours, lighting, textiles — is redesigned in the chosen style, in its current (2026) interpretation.

**Status:** MVP built, not deployed yet. All screens from the UI design work on desktop and phone. Image generation has been tested against the real model in a spike ([`spike/REPORT.md`](spike/REPORT.md)); the full app flow has so far been tested with stubbed API responses.

## Problem

People who want to refresh their flat often can't picture how their own room would look in a different style. Inspiration photos show other people's rooms, with other layouts and other light, so they don't help with the actual decision. Designing a room yourself takes skills most people don't have, and hiring a designer just to explore options is expensive.

AI Interior shows the user *their own* room in a new style, so they can compare options before spending money on anything.

## User

Someone furnishing or refreshing their home who:

- is not an architect or interior designer,
- wants to experiment,
- doesn't know yet which style suits them,
- wants to see the possibilities before making a decision.

## How it works

- **No accounts, no storage.** The photo and every result live only in the browser's memory. Closing or refreshing the tab ends the session; the browser warns first once there are results.
- **Two server routes** proxy the models and keep the API token off the client:
  - `POST /api/photo-check` — a vision LLM checks the photo (framing, light) and returns warnings the user can ignore.
  - `POST /api/generations` — the image model restyles the photo, then the vision LLM describes the changes (palette, key pieces, what changed, what was kept).
- **Models** run on the [Cloudflare Workers AI](https://developers.cloudflare.com/workers-ai/) free tier:
  - image: FLUX.2 klein 4B (`@cf/black-forest-labs/flux-2-klein-4b`),
  - photo check and description: Mistral Small 3.1 (`@cf/mistralai/mistral-small-3.1-24b-instruct`).
- **Free daily limit:** the free tier allows about 35–40 generations a day for the whole app. Once it is used up, the app says so and asks the user to come back tomorrow (the limit resets at 00:00 UTC).

## Stack

| Area | Tools |
|---|---|
| UX requirements | Markdown — [`ustalenia-ux.md`](ustalenia-ux.md) (in Polish) |
| Wireframes | Figma — desktop and mobile |
| UI design | Figma, imported from HTML/CSS mockups with html.to.design |
| Typography | Instrument Serif, Schibsted Grotesk |
| App | Nuxt 4 (client-only), Vue 3, Pinia, Zod, TypeScript |
| AI models | Cloudflare Workers AI — FLUX.2 klein 4B, Mistral Small 3.1 |
| Tests | Vitest, Vue Test Utils, happy-dom |
| Hosting | Vercel |
| AI assistance | Claude Code — UX analysis, wireframes, architecture, implementation |

## Screenshots

**Upload a photo**

![Upload screen](docs/screenshots/01-upload.png)

**Pick the room type**

![Room type screen](docs/screenshots/03-room-type.png)

## Running locally

Requirements: Node.js 24 and a free [Cloudflare](https://dash.cloudflare.com/) account.

1. Create a Cloudflare API token from the **Workers AI** template (permission: Workers AI — Edit).
2. Create `.env` in the project root (it is git-ignored):

   ```
   CF_ACCOUNT_ID=your-account-id
   CF_API_TOKEN=your-api-token
   ```

   The account ID is the 32-character part of the dashboard URL: `https://dash.cloudflare.com/<account-id>/home`.
3. Install and start:

   ```
   npm install
   npm run dev
   ```

   The app runs at http://localhost:3000.

Other commands:

| Command | What it does |
|---|---|
| `npm test` | Runs unit tests, page tests in a Nuxt environment, and API route tests against a local stand-in for Cloudflare |
| `npm run test:e2e` | Runs end-to-end tests in the installed Google Chrome, with the API stubbed |
| `npm run typecheck` | Checks types, including `.vue` files |
| `npm run build` | Builds for production |

No test calls Cloudflare, so tests never use up the daily limit.

## Deployment

The app is set up for Vercel (Hobby plan is enough):

1. Import the repository into Vercel — it detects Nuxt on its own.
2. Add the environment variables `CF_ACCOUNT_ID` and `CF_API_TOKEN` in the project settings.
3. Deploy.

Server functions may run for up to 60 seconds (`nuxt.config.ts`), because generating an image and describing it takes about 20 seconds.

## Project structure

```
app/          pages, components, Pinia store, browser utilities
server/       API routes and the Workers AI client
shared/       types, styles, room types and error codes used on both sides
test/         Vitest tests, mirroring the source folders
spike/        model experiments and their report
docs/         implementation plan and screenshots
```

## Design

- [AI Interior — UI designs](https://www.figma.com/design/2EZY7aWeKK9UJ8xMG1KQJy)
- [AI Interior — Wireframes](https://www.figma.com/design/JxUND3pEO9zgD67eCD3CKC)
