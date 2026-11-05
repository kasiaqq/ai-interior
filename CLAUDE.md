# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

AI Interior: an English-language web app. The user uploads a photo of a room, picks a room type and a style, and gets the same room restyled by an image model, plus a short text description of what changed. It is for inspiration only: no accounts, no storage, no products or prices. The UX requirements are in `ustalenia-ux.md` (in Polish). The MVP implementation plan is in `docs/superpowers/plans/`.

## Commands

Node 24 (`.nvmrc`).

| Command | What it does |
|---|---|
| `npm run dev` | Dev server at http://localhost:3000 (needs `.env`, see README) |
| `npm test` | All three Vitest projects: `unit`, `nuxt`, `routes` |
| `npx vitest run --project unit` | Run one project only (`unit` / `nuxt` / `routes`) |
| `npx vitest run test/server/prompt.test.ts` | Run a single test file |
| `npx vitest run -t "name"` | Run tests whose name matches |
| `npm run test:e2e` | Playwright: builds, previews on port 3100, uses the installed Chrome (`channel: 'chrome'`, no browser download) |
| `npm run typecheck` | `nuxt typecheck`, which includes `.vue` files |
| `npm run build` | Production build (Vercel preset) |

No lint script is configured. No test calls Cloudflare, so tests never use up the free daily quota. Keep it that way.

## Architecture

**Client-only Nuxt 4** (`ssr: false`). There are three source roots:
- `app/`: Vue/Pinia frontend, alias `~`.
- `server/`: Nitro API routes.
- `shared/`: code used by both sides, alias `#shared`. It holds types, `catalog.ts` (styles, room types and "report a problem" options, including their prompt fragments) and `errors.ts`.

Components are registered without a path prefix (`pathPrefix: false`), so `components/upload/PhotoDropzone.vue` is used as `<PhotoDropzone>`.

### Flow and state
- Steps: `/` (upload and photo check) → `/room` → `/style` → `/generate` → `/result/[id]`, plus `/results` (history and comparing two results).
- All state is in memory in `app/stores/session.ts` (Pinia): photo and result blobs, held as object URLs. `reset()` revokes those URLs. A refresh ends the session. `useLeaveWarning` warns before the user loses results.
- `app/middleware/steps.global.ts` calls `requiredRedirect` in `app/utils/steps.ts`. When the user opens a step whose prerequisites are missing (for example after a refresh), it redirects to `/`.
- `app/utils/normalize-photo.ts` converts every upload in the browser to a JPEG. The longest edge is at most 1024 px and each side is floored to a multiple of 16, because FLUX requires multiples of 16. The output then has the same size as the input, so the before/after slider needs no resizing.
- `useGeneration` cannot get real progress from the model, so it estimates progress from elapsed time (`ESTIMATED_SECONDS = 20`). It also handles aborting a request and ignores responses from superseded runs.

### Server
- There are two routes: `POST /api/photo-check` and `POST /api/generations`. Both are wrapped in `defineGuardedHandler` (`server/utils/request-guard.ts`), which does the following:
  - accepts same-origin requests only;
  - requires `Content-Length` of at most 4 MB and reads the body as multipart form data;
  - verifies the Cloudflare Turnstile token (`turnstileToken` field);
  - converts any error into `{ statusCode, data: { code } }`.
- `server/utils/workers-ai.ts` is the only Cloudflare client. Its two calls:
  - `runImageEdit`: FLUX.2 klein 4B. The multipart API is undocumented and was found experimentally (see `spike/REPORT.md`).
  - `runVisionChat`: Mistral Small 3.1 through the OpenAI-compatible chat endpoint.
  - HTTP 429 or Cloudflare error code 4006 maps to `QUOTA_REACHED`.
- `generateRestyle` produces the image first, then asks the vision LLM to describe it. If the description fails, the result has `description: null`. The image is still returned.
- `parseLlmJson` takes the first `{…}` in the LLM's free-form text and validates it with Zod (`server/utils/schemas.ts`).

### Errors
`shared/errors.ts` holds the `ErrorCode` union, the user-facing message for each code, and `AppError`. The server maps each code to an HTTP status (`statusFor` in `server/utils/generate.ts`). The client (`app/utils/api.ts`) maps the response back to an `AppError`. A bare 429 without a code comes from Vercel's rate-limit rule and becomes `RATE_LIMITED`. To add a code, update all three places: `errors.ts`, the `STATUS` map and `KNOWN_CODES`.

### The image prompt
`server/utils/prompt.ts` was validated in the model spike (`spike/`, run-6). Change the wording only together with a new spike run. The rules it encodes are product requirements and must stay:
- windows, doors and fixed fittings stay in place;
- the space in front of any door, including balcony doors, stays free of furniture and decor;
- mirrors never reflect windows that are not in the photo.

`spike/*.mjs` are standalone scripts that call the real API, so they use quota. Their photos and results are git-ignored.

## Tests

`vitest.config.ts` defines three projects:
- `unit` (`test/{app,server,shared}`): happy-dom, plain Vue plugin, aliases set by hand.
- `nuxt` (`test/nuxt`): pages and components mounted inside a real Nuxt app (router, Pinia, auto-imports).
- `routes` (`test/routes`): builds the app and calls the real routes over HTTP. A local `node:http` server stands in for Cloudflare and Turnstile; the code is pointed at it through the test-only env vars `CF_API_BASE` and `TURNSTILE_VERIFY_URL`. It is slow, with a hook timeout of 180 s.

E2E (`e2e/`) stubs every `/api` call in the browser. `CF_API_BASE` points to a dead port, so nothing can reach Cloudflare. `e2e/fixtures.ts` builds a test PNG in code, so the repo has no binary fixtures.

## Environment

`.env` (git-ignored) holds `CF_ACCOUNT_ID`, `CF_API_TOKEN`, `NUXT_PUBLIC_TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY`. README lists Cloudflare's test keys for Turnstile. Vercel functions are allowed `maxDuration: 60`, because one generation takes about 20–30 s (image plus description).
