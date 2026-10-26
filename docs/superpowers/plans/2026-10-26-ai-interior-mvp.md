# AI Interior MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A web app where a user uploads a room photo, picks a room type and one of four styles, and gets the same room restyled — with before/after slider, change description, variants, other styles and a session gallery.

**Architecture:** Nuxt client-only SPA (`ssr: false`) with two stateless server routes that proxy Cloudflare Workers AI. All session data (photo, results) lives in a Pinia store in browser memory and disappears on refresh/close. No database, no storage, no accounts.

**Tech Stack:** Nuxt 4.6, Vue 3.5, Pinia (`@pinia/nuxt`), Zod 4, `@nuxt/fonts`, Vitest + `@nuxt/test-utils` + happy-dom, TypeScript. Models on Workers AI free tier: `@cf/black-forest-labs/flux-2-klein-4b` (image), `@cf/mistralai/mistral-small-3.1-24b-instruct` (vision LLM). Deployed on Vercel Hobby.

**Spec:**
- `ustalenia-ux.md` — UX and functional requirements (Polish).
- `docs/screenshots/*.png` — UI design (desktop 01–08, `mobile-02-result.png`). Figma is not accessible via MCP (Starter plan limit); screenshots are the source of truth for layout and copy.
- `spike/REPORT.md` — model API facts and prompt findings.
- `spike/generate.mjs`, `spike/vision.mjs` — working reference calls to both models (multipart fields, chat payload, prompt text).

## Global Constraints

- UI language: English. Copy is taken verbatim from the screenshots, except: remove "HEIC" from the upload format line, and the style page's "Takes about 30 seconds" uses `ESTIMATED_SECONDS` (20) from Task 9 — the spike measured ~10 s image + ~8 s description.
- Styles: exactly 4 — Japandi, Scandinavian, Industrial, Mid-century modern — each in its 2026 interpretation (descriptions in `spike/generate.mjs` `STYLES`).
- Room types: the 9 options on `03-room-type.png`, including kitchen, bathroom and "Something else".
- No accounts, no generation limit in the UI, no server-side persistence. Nothing about the photo or prompt is logged.
- Whole app `ssr: false`. One global route middleware for step guards.
- Exactly two API routes: `POST /api/photo-check`, `POST /api/generations`.
- Error codes (only these): `INVALID_FILE`, `QUOTA_REACHED`, `GENERATION_FAILED`, `NETWORK`. Workers AI quota exhaustion is HTTP 429 with error `code: 4006`.
- Photo normalization in the browser: decode → canvas → longest edge ≤ 1024 → crop both sides down to a multiple of 16 → JPEG quality 0.9. EXIF is dropped by the canvas. Accepted input: JPEG, PNG, WebP, and HEIC only where the browser decodes it; max 20 MB.
- The image model is called with `width`/`height` equal to the normalized photo, so before and after have identical dimensions — no resize step anywhere.
- Hard image rules (in the prompt): room shell identical; windows identical in position, shape, size and frame colour (curtains/blinds allowed); doors keep position and shape; space in front of every door incl. balcony doors stays clear; mirrors show no window that is not in the photo; radiators, water heaters, boilers, pipes, vents, sockets, beams, fireplace, stairs, niches stay in place. Wording: final prompt in `spike/generate.mjs` `buildPrompt` (without the `NO_WINDOWS` sentence).
- `beforeunload` warning active once at least one result exists. "Start over" and "Upload another photo" clear the session after a confirm dialog when results exist.
- "Something's off" retry keeps the flagged result and adds the new one as the next variant.
- Phone layout fully supported (slider, compare); desktop is primary.
- Secrets: `CF_ACCOUNT_ID`, `CF_API_TOKEN` via Nuxt `runtimeConfig` (server only).

## Review Focus

1. **Phone photo with EXIF rotation** — a portrait iPhone JPEG must appear upright in the preview, the slider and the model input. Test in Task 6 (`createImageBitmap(file, { imageOrientation: 'from-image' })` asserted via a mocked call).
2. **LLM returns prose or broken JSON** — photo check must pass the user through with no warnings; generation must still show the image with `description: null`. Tests in Tasks 4 and 5.
3. **Quota runs out mid-session** — `QUOTA_REACHED` message, existing results and the photo stay intact. Tests in Tasks 3 and 9.
4. **Cancel, then Generate again quickly** — the late response of the aborted request must never land as a result. Test in Task 9.
5. **Tiny or extreme-aspect photo** (e.g. 300×200, 4000×500 panorama) — crop to 16 must never produce 0; below 256 px on the short side is `INVALID_FILE`. Test in Task 6.

---

## File Structure

```
nuxt.config.ts                      ssr:false, modules, runtimeConfig
app/
  app.vue                           <NuxtLayout><NuxtPage/>
  assets/css/tokens.css             design tokens (colours, type, spacing, radii)
  assets/css/base.css               reset + body
  layouts/default.vue               AppHeader + slot
  middleware/steps.global.ts        step guards
  pages/index.vue                   01 upload + 02 photo check
  pages/room.vue                    03
  pages/style.vue                   04
  pages/generate.vue                05
  pages/result/[id].vue             06 + 08 dialog
  pages/results.vue                 07
  components/layout/AppHeader.vue, Stepper.vue, StepFooter.vue, ConfirmDialog.vue
  components/upload/PhotoDropzone.vue, PhotoCheckPanel.vue, PhotoPreview.vue
  components/room/RoomTypeGrid.vue
  components/style/StyleCard.vue
  components/generate/GenerationCard.vue
  components/result/BeforeAfterSlider.vue, ResultPanel.vue, ReportProblemDialog.vue
  components/results/ResultCard.vue, ComparePanel.vue
  composables/useGeneration.ts      generation state machine
  composables/useLeaveWarning.ts    beforeunload
  stores/session.ts                 Pinia session store
  utils/normalize-photo.ts          browser photo normalization
  utils/format-details.ts           "Copy details" text
  utils/api.ts                      fetch wrappers → AppError
shared/                             importable from app and server (Nuxt 4 `shared/`)
  types.ts                          domain types
  catalog.ts                        STYLES, ROOM_TYPES, PROBLEMS
  errors.ts                         ErrorCode, AppError, user messages
server/
  api/photo-check.post.ts
  api/generations.post.ts
  utils/workers-ai.ts               runImageEdit, runVisionChat, error mapping
  utils/prompt.ts                   buildImagePrompt
  utils/llm-json.ts                 extract + validate JSON from LLM text
  utils/schemas.ts                  Zod schemas for LLM outputs
test/                               mirrors source paths, *.test.ts
```

---

### Task 1: Scaffold and shared domain

**Files:**
- Create: Nuxt 4 project in repo root (`npm create nuxt@latest .`, minimal template), `nuxt.config.ts`, `vitest.config.ts`, `shared/types.ts`, `shared/catalog.ts`, `shared/errors.ts`
- Modify: `.gitignore` (add `.nuxt/`, `.output/`, `.vercel/`; keep existing lines)
- Test: `test/shared/catalog.test.ts`, `test/shared/errors.test.ts`

**Interfaces:**
- Produces:
  - `type StyleId = 'japandi' | 'scandinavian' | 'industrial' | 'midcentury'`
  - `type RoomTypeId = 'living-room' | 'bedroom' | 'kitchen' | 'bathroom' | 'dining-room' | 'kids-room' | 'home-office' | 'hallway' | 'other'` (labels from `03-room-type.png`; adjust ids to the 9 labels shown)
  - `type ProblemId = 'window' | 'door' | 'wall' | 'technical' | 'other'` (5 options on `08-something-off.png`)
  - `STYLES: Record<StyleId, { label: string; tagline: string; description: string; swatches: string[]; promptDescription: string }>` — `promptDescription` copied from `spike/generate.mjs`; other fields from `04-style.png`
  - `ROOM_TYPES: Record<RoomTypeId, { label: string; promptName: string }>`
  - `PROBLEMS: Record<ProblemId, { label: string; promptReinforcement: string }>`
  - `interface PhotoAnalysis { verdict: 'ok' | 'warning'; warnings: string[]; positives: string[] }`
  - `interface ChangeDescription { palette: { role: string; hex: string }[]; keyPieces: string[]; changes: string[]; kept: string[]; summary: string }`
  - `interface GenerationResponse { image: string /* base64 JPEG */; description: ChangeDescription | null }`
  - `type ErrorCode = 'INVALID_FILE' | 'QUOTA_REACHED' | 'GENERATION_FAILED' | 'NETWORK'`
  - `class AppError extends Error { code: ErrorCode }`, `errorMessage(code: ErrorCode): string`

- [ ] **Step 1:** Scaffold Nuxt 4, add `@pinia/nuxt`, `@nuxt/fonts`, `zod`, dev deps `vitest @nuxt/test-utils @vue/test-utils happy-dom`. In `nuxt.config.ts`: `ssr: false`, modules, `runtimeConfig: { cfAccountId: '', cfApiToken: '' }` (filled from `NUXT_CF_ACCOUNT_ID`/`NUXT_CF_API_TOKEN`). Rename keys in `.env` accordingly (tell the user; don't print values).
- [ ] **Step 2:** Write failing tests: `STYLES` has exactly the 4 ids and every `promptDescription` contains `2026`; `ROOM_TYPES` has 9 entries incl. `kitchen` and `bathroom`; `PROBLEMS` has 5; `errorMessage` returns a non-empty string for each of the 4 codes and `QUOTA_REACHED` mentions "tomorrow".
- [ ] **Step 3:** Run `npx vitest run test/shared` → FAIL (modules missing).
- [ ] **Step 4:** Implement the three `shared/` files.
- [ ] **Step 5:** Run `npx vitest run test/shared` → PASS; `npx nuxi typecheck` → no errors; `npm run dev` serves a blank page.
- [ ] **Step 6:** Commit `feat: scaffold Nuxt app and shared domain`.

### Task 2: Image prompt builder

**Files:**
- Create: `server/utils/prompt.ts`
- Test: `test/server/prompt.test.ts`

**Interfaces:**
- Consumes: `STYLES`, `ROOM_TYPES`, `PROBLEMS` (Task 1)
- Produces: `buildImagePrompt(input: { roomType: RoomTypeId; style: StyleId; problem?: ProblemId }): string`

- [ ] **Step 1:** Failing tests: prompt contains the room's `promptName` and the style's `promptDescription`; contains `curtains, blinds`; contains `balcony doors`; contains `Mirrors reflect only this room`; contains `water heaters`; does **not** contain `natural daylight`; with `problem: 'window'` it ends with `PROBLEMS.window.promptReinforcement`; without `problem` no reinforcement text appears.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement: same sentences and order as `buildPrompt` in `spike/generate.mjs`, sourced from the catalog, plus the optional reinforcement.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: add image prompt builder`.

### Task 3: Workers AI client

**Files:**
- Create: `server/utils/workers-ai.ts`
- Test: `test/server/workers-ai.test.ts` (mock global `fetch`)

**Interfaces:**
- Produces:
  - `runImageEdit(input: { image: Uint8Array; prompt: string; width: number; height: number; seed: number }): Promise<Uint8Array>` — POST multipart to `/accounts/{id}/ai/run/@cf/black-forest-labs/flux-2-klein-4b` with fields `prompt`, `input_image_0` (image/jpeg), `width`, `height`, `seed`; decodes `result.image` base64.
  - `runVisionChat(input: { prompt: string; images: Uint8Array[]; maxTokens: number }): Promise<string>` — POST JSON to `/accounts/{id}/ai/v1/chat/completions`, model `@cf/mistralai/mistral-small-3.1-24b-instruct`, images as `image_url` data URLs; returns `choices[0].message.content`.
  - Both throw `AppError('QUOTA_REACHED')` on HTTP 429 or any error with `code === 4006`, `AppError('GENERATION_FAILED')` on any other non-OK response or missing payload.

- [ ] **Step 1:** Failing tests: multipart body has the 5 fields with exact names; Authorization header is `Bearer <token>`; 429 → `QUOTA_REACHED`; 500 → `GENERATION_FAILED`; 200 with `success:false` → `GENERATION_FAILED`; chat returns message content; chat sends 2 data-URL images when given 2.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement using `useRuntimeConfig()` for credentials.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: add Workers AI client`.

### Task 4: Photo-check endpoint

**Files:**
- Create: `server/utils/llm-json.ts`, `server/utils/schemas.ts`, `server/api/photo-check.post.ts`
- Test: `test/server/llm-json.test.ts`, `test/server/photo-check.test.ts`

**Interfaces:**
- Consumes: `runVisionChat` (Task 3), `PhotoAnalysis` (Task 1)
- Produces:
  - `parseLlmJson<T>(text: string, schema: ZodType<T>): T | null` — takes the first `{…}` block, `JSON.parse`, validates; `null` on any failure.
  - `photoAnalysisSchema`, `changeDescriptionSchema` (Zod, matching Task 1 types; `palette` 3–6 items, `hex` matches `/^#[0-9a-f]{6}$/i`).
  - `POST /api/photo-check`: multipart field `photo` (JPEG) → `PhotoAnalysis`.

- [ ] **Step 1:** Failing tests for `parseLlmJson`: JSON wrapped in prose/```json fences parses; invalid JSON → null; wrong shape → null.
- [ ] **Step 2:** Failing tests for the handler (mock `runVisionChat`): valid reply → returned as is; `verdict: 'warning'` with empty `warnings` is normalized to `'ok'`; unparseable reply → `{ verdict: 'ok', warnings: [], positives: [] }`; `runVisionChat` throwing (any error incl. quota) → the same pass-through object, HTTP 200.
- [ ] **Step 3:** Run → FAIL.
- [ ] **Step 4:** Implement. Prompt text: `PHOTO_CHECK_PROMPT` from `spike/vision.mjs`; `maxTokens: 400`.
- [ ] **Step 5:** Run → PASS.
- [ ] **Step 6:** Commit `feat: add photo-check endpoint`.

### Task 5: Generations endpoint

**Files:**
- Create: `server/api/generations.post.ts`
- Test: `test/server/generations.test.ts`

**Interfaces:**
- Consumes: `buildImagePrompt` (Task 2), `runImageEdit`, `runVisionChat` (Task 3), `parseLlmJson`, `changeDescriptionSchema` (Task 4)
- Produces: `POST /api/generations`, multipart fields `photo` (JPEG), `width`, `height`, `roomType`, `style`, `seed`, optional `problem` → `GenerationResponse`. Errors: HTTP 429 `{ code: 'QUOTA_REACHED' }`, HTTP 400 `{ code: 'INVALID_FILE' }`, HTTP 502 `{ code: 'GENERATION_FAILED' }`.

- [ ] **Step 1:** Failing tests (mock both model calls): passes width/height/seed through unchanged; unknown `style`/`roomType`/`problem` → 400 `INVALID_FILE`; width or height not a multiple of 16 → 400; image OK + description OK → both returned; image OK + chat throws or returns junk → `description: null`, HTTP 200; image call throws quota → 429 `QUOTA_REACHED`; describe prompt contains the style label.
- [ ] **Step 2:** Run → FAIL.
- [ ] **Step 3:** Implement: validate input with Zod → image → describe (`DESCRIBE_PROMPT` from `spike/vision.mjs`, `maxTokens: 700`, images `[before, after]`) → respond. Set route `maxDuration` 60 s via Vercel config if needed.
- [ ] **Step 4:** Run → PASS.
- [ ] **Step 5:** Manual smoke (needs free quota): `curl -F photo=@spike/results/run-5/salon_3/before.jpg -F width=1024 -F height=672 -F roomType=living-room -F style=japandi -F seed=1 localhost:3000/api/generations | head -c 300` → JSON with `image`.
- [ ] **Step 6:** Commit `feat: add generations endpoint`.

### Task 6: Browser photo normalization

**Files:**
- Create: `app/utils/normalize-photo.ts`
- Test: `test/app/normalize-photo.test.ts`

**Interfaces:**
- Produces:
  - `targetSize(width: number, height: number): { width: number; height: number }` — scale longest edge to ≤ 1024 (never upscale), then floor each side to a multiple of 16.
  - `normalizePhoto(file: File): Promise<{ blob: Blob; width: number; height: number }>` — throws `AppError('INVALID_FILE')` for: type not image/*, size > 20 MB, decode failure (incl. HEIC in non-Safari), short side < 256 after scaling. Decodes with `createImageBitmap(file, { imageOrientation: 'from-image' })`, draws centre-cropped to `targetSize`, exports `image/jpeg` 0.9.

- [ ] **Step 1:** Failing tests for `targetSize`: 2048×1365 → 1024×672; 1000×667 → 992×656; 525×700 → 512×688; 300×200 → 288×192; results are always multiples of 16 and > 0.
- [ ] **Step 2:** Failing tests for `normalizePhoto` (mock `createImageBitmap` + canvas): 21 MB file → `INVALID_FILE`; `text/plain` → `INVALID_FILE`; decode rejection → `INVALID_FILE`; 4000×500 → `INVALID_FILE` (short side < 256); `createImageBitmap` called with `imageOrientation: 'from-image'`.
- [ ] **Step 3:** Run → FAIL. **Step 4:** Implement. **Step 5:** Run → PASS.
- [ ] **Step 6:** Commit `feat: add browser photo normalization`.

### Task 7: Session store and API wrappers

**Files:**
- Create: `app/stores/session.ts`, `app/utils/api.ts`
- Test: `test/app/session.test.ts`, `test/app/api.test.ts`

**Interfaces:**
- Consumes: Task 1 types, `normalizePhoto` output shape
- Produces:
  - `interface SessionPhoto { blob: Blob; url: string; fileName: string; fileSize: number; width: number; height: number }`
  - `interface SessionResult { id: string; style: StyleId; roomType: RoomTypeId; blob: Blob; url: string; description: ChangeDescription | null; createdAt: number }`
  - `useSessionStore()` with state `photo: SessionPhoto | null`, `analysis: PhotoAnalysis | null`, `roomType: RoomTypeId | null`, `style: StyleId | null`, `results: SessionResult[]`, `reportCount: number`, `compareIds: string[]`; getters `variantNumber(id): number` (1-based within its style, by creation order), `resultById(id)`; actions `setPhoto(photo)`, `setAnalysis(a)`, `setRoomType(r)`, `setStyle(s)`, `addResult(r)`, `registerReport()`, `toggleCompare(id)` (max 2 — a third is ignored), `reset()` (revokes all object URLs).
  - `checkPhoto(photo: Blob): Promise<PhotoAnalysis>`, `requestGeneration(input: { photo: Blob; width: number; height: number; roomType: RoomTypeId; style: StyleId; seed: number; problem?: ProblemId }, signal: AbortSignal): Promise<{ blob: Blob; description: ChangeDescription | null }>` — map responses to `AppError` by body `code`; `TypeError` from fetch → `NETWORK`; `AbortError` rethrown as is.

- [ ] **Step 1:** Failing store tests: `setPhoto` clears `analysis`, `roomType`, `style`, `results`, `reportCount`, `compareIds` and revokes old URLs (spy on `URL.revokeObjectURL`); `variantNumber` counts per style (japandi, scandi, japandi → 1, 1, 2); `toggleCompare` caps at 2 and toggles off; `reset` empties everything.
- [ ] **Step 2:** Failing api tests (mock fetch): 429 body → `QUOTA_REACHED`; fetch `TypeError` → `NETWORK`; success decodes base64 to a JPEG Blob.
- [ ] **Step 3:** Run → FAIL. **Step 4:** Implement. **Step 5:** Run → PASS.
- [ ] **Step 6:** Commit `feat: add session store and API wrappers`.

### Task 8: App shell — tokens, layout, step guards, leave warning

**Files:**
- Create: `app/assets/css/tokens.css`, `app/assets/css/base.css`, `app/app.vue`, `app/layouts/default.vue`, `app/components/layout/{AppHeader,Stepper,StepFooter,ConfirmDialog}.vue`, `app/middleware/steps.global.ts`, `app/composables/useLeaveWarning.ts`
- Test: `test/app/steps.test.ts`

**Interfaces:**
- Consumes: `useSessionStore` (Task 7)
- Produces:
  - `requiredRedirect(path: string, s: { hasPhoto: boolean; hasRoom: boolean; hasStyle: boolean; resultIds: string[] }): string | null` — `/room` needs photo, `/style` needs room, `/generate` needs style, `/result/:id` needs that id, `/results` needs ≥ 1 result; failing → `'/'`.
  - `<StepFooter>` props `{ backTo?: string; hint?: string; primaryLabel: string; primaryDisabled?: boolean }`, emits `primary`.
  - `<ConfirmDialog>` props `{ open: boolean; title: string; body: string; confirmLabel: string }`, emits `confirm`, `cancel`.
  - `<AppHeader>` two modes: stepper (steps 1–3 with dynamic labels "2 Living room", "3 Japandi") and results mode ("All results in this session (N)" / mobile "Results (N)" + "Start over").

- [ ] **Step 1:** Failing tests for `requiredRedirect` covering each route, and `/result/unknown` → `'/'`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement middleware with `requiredRedirect`.
- [ ] **Step 4:** Tokens: read colours, radii, spacing and type scale from `docs/screenshots/*` (dark theme); fonts Instrument Serif + Schibsted Grotesk via `@nuxt/fonts` with fallback metrics to avoid layout shift. All components use tokens only.
- [ ] **Step 5:** `useLeaveWarning()` registers `beforeunload` while `results.length > 0`. "Start over" opens `ConfirmDialog` when results exist, then `reset()` + navigate `/`.
- [ ] **Step 6:** Run tests → PASS. Manual: `npm run dev`, open `/style` directly → redirected to `/`; header matches `01-upload.png` at 1440 px and 390 px widths, no horizontal scroll.
- [ ] **Step 7:** Commit `feat: add app shell, step guards and leave warning`.

### Task 9: Generation flow composable

**Files:**
- Create: `app/composables/useGeneration.ts`
- Test: `test/app/use-generation.test.ts` (fake timers, mocked `requestGeneration`)

**Interfaces:**
- Consumes: `requestGeneration` (Task 7), `useSessionStore` (Task 7)
- Produces:
  - `type GenerationState = { status: 'idle' } | { status: 'running'; startedAt: number } | { status: 'done'; resultId: string } | { status: 'failed'; code: ErrorCode } | { status: 'cancelled' }`
  - `useGeneration(): { state: Readonly<Ref<GenerationState>>; progress: ComputedRef<{ ratio: number; stage: 0 | 1 | 2; secondsLeft: number }>; start(opts?: { problem?: ProblemId }): void; cancel(): void }`
  - `ESTIMATED_SECONDS = 20` (exported; also shown as "Takes about 20 seconds" on the style page). Progress: `ratio = min(0.9, elapsed / ESTIMATED_SECONDS)`, stage = third of the estimate (0 Reading the room, 1 Placing furniture, 2 Lighting and finish), jumps to 1 on done.
  - Each `start` uses a new random seed and stores the result with `addResult`.

- [ ] **Step 1:** Failing tests: `start` → `running` → on resolve `done` with a new result in the store; `start` while running is ignored (single request); `cancel` aborts the signal and sets `cancelled`; **a response that resolves after `cancel` and a new `start` is discarded** (only the second result is stored); `QUOTA_REACHED` → `failed` and store photo/results untouched; progress at 0 s, 10 s, 30 s → 0 / 0.5 / 0.9.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement (request id counter guards stale responses). **Step 4:** Run → PASS.
- [ ] **Step 5:** Commit `feat: add generation flow composable`.

### Task 10: Upload step (screens 01, 02)

**Files:**
- Create: `app/pages/index.vue`, `app/components/upload/{PhotoDropzone,PhotoCheckPanel,PhotoPreview}.vue`

**Interfaces:**
- Consumes: `normalizePhoto` (Task 6), `checkPhoto`, `useSessionStore` (Task 7), `StepFooter`, `ConfirmDialog` (Task 8)

- [ ] **Step 1:** Dropzone: drag & drop + "Browse files", tips list, one-line privacy note — copy from `01-upload.png` (without "HEIC"). `INVALID_FILE` shows inline in the dropzone.
- [ ] **Step 2:** After a file: normalize → preview with file name/size and "Replace photo" → "Checking your photo…" → on `ok` navigate `/room` (03 shows "Photo looks good — <positives>"); on `warning` show `PhotoCheckPanel` (02) with reasons, "Choose another photo" and "Continue anyway".
- [ ] **Step 3:** Replacing the photo when results exist opens `ConfirmDialog` first.
- [ ] **Step 4:** Manual verification at 1440 px and 390 px against `01-upload.png` / `02-photo-check.png`: drop `spike/photos/salon_3.webp` → room step; drop a `.txt` → inline error; no layout shift while checking.
- [ ] **Step 5:** Commit `feat: add upload step`.

### Task 11: Room and style steps (screens 03, 04)

**Files:**
- Create: `app/pages/room.vue`, `app/pages/style.vue`, `app/components/room/RoomTypeGrid.vue`, `app/components/style/StyleCard.vue`, style illustrations in `public/styles/`

**Interfaces:**
- Consumes: `ROOM_TYPES`, `STYLES` (Task 1), store (Task 7), `StepFooter` (Task 8), `ESTIMATED_SECONDS` (Task 9)

- [ ] **Step 1:** `RoomTypeGrid` as a keyboard-accessible radio group (9 options with icons). Continue disabled until chosen.
- [ ] **Step 2:** `StyleCard`: example image (fixed aspect ratio, `width`/`height` set), description, swatches, selected state; "As the style looks in 2026" badge. Primary button "Generate <Style>" → `/generate` and `start()`.
- [ ] **Step 3:** Style example images: ask the user for 4 images (or reuse spike outputs she approves) — do not invent.
- [ ] **Step 4:** Manual verification at 1440/390 px against `03-room-type.png`, `04-style.png`; keyboard-only selection works.
- [ ] **Step 5:** Commit `feat: add room and style steps`.

### Task 12: Generating screen (05)

**Files:**
- Create: `app/pages/generate.vue`, `app/components/generate/GenerationCard.vue`

**Interfaces:**
- Consumes: `useGeneration` (Task 9), store

- [ ] **Step 1:** Dimmed photo, title, seconds left, 3-stage progress, fixed note "Your walls, windows and doors stay where they are", Cancel → back to `/style` with photo and choices kept.
- [ ] **Step 2:** `done` → `/result/<id>`; `failed` → message from `errorMessage(code)` with "Try again" (except `QUOTA_REACHED`: no retry button, "Back to results" if any).
- [ ] **Step 3:** Manual: generate, cancel mid-way, generate again; compare with `05-generating.png`.
- [ ] **Step 4:** Commit `feat: add generating screen`.

### Task 13: Result screen and "Something's off" (06, 08, mobile)

**Files:**
- Create: `app/pages/result/[id].vue`, `app/components/result/{BeforeAfterSlider,ResultPanel,ReportProblemDialog}.vue`, `app/utils/format-details.ts`
- Test: `test/app/format-details.test.ts`, `test/app/before-after-slider.test.ts`

**Interfaces:**
- Consumes: store, `useGeneration` (Task 9), `PROBLEMS` (Task 1)
- Produces: `formatDetails(r: { styleLabel: string; variant: number; roomLabel: string; description: ChangeDescription }): string`

- [ ] **Step 1:** Failing tests: `formatDetails` output starts with `Japandi · variant 1 — Living room`, lists palette as `Paper walls #F5E9DC`, and has sections "Key pieces", "What changed", "Kept exactly as it was". Slider: ArrowLeft/ArrowRight move by 5 %, Home/End to 0/100, `role="slider"` with `aria-valuenow`.
- [ ] **Step 2:** Run → FAIL. **Step 3:** Implement `formatDetails` and `BeforeAfterSlider` (pointer + touch + keyboard; both images in one box with identical dimensions, after clipped with `clip-path`). **Step 4:** Run → PASS.
- [ ] **Step 5:** `ResultPanel`: title "<Style> · variant N", context line, palette with role labels (desktop) / swatches only (mobile), key pieces, changes, kept, "Copy details" (clipboard + "Copied" state), "Download" (`<a download="ai-interior-<style>-v<N>.jpg">`), other-style chips (the 3 other styles → set style + start), "Another variant". `description: null` → panel shows "Details unavailable" instead of lists; Copy details hidden.
- [ ] **Step 6:** Mobile per `mobile-02-result.png`: `summary` instead of lists, sticky bottom actions, "Another variant" and "Something's off" as links.
- [ ] **Step 7:** `ReportProblemDialog` per `08-something-off.png`: 5 radio options; "Try again" → `registerReport()` + `start({ problem })` (flagged result stays); when `reportCount >= 2` show inline hint "this photo may be hard to process — try another angle or lighting" with "Upload another photo".
- [ ] **Step 8:** Manual at 1440/390 px against `06-result.png`, `08-something-off.png`, `mobile-02-result.png`.
- [ ] **Step 9:** Commit `feat: add result screen and problem report`.

### Task 14: Session results and compare (07)

**Files:**
- Create: `app/pages/results.vue`, `app/components/results/{ResultCard,ComparePanel}.vue`

**Interfaces:**
- Consumes: store (`results`, `compareIds`, `toggleCompare`, `variantNumber`)

- [ ] **Step 1:** Grid of `ResultCard` (thumbnail, "<Style> · variant N", relative time, Open, Download, Compare checkbox — disabled for others when 2 selected), session warning line, "Generate another style", "New variant of <style>".
- [ ] **Step 2:** `ComparePanel`: two selected results side by side (stacked on mobile), "Clear selection".
- [ ] **Step 3:** Manual at 1440/390 px against `07-session.png`.
- [ ] **Step 4:** Commit `feat: add session results and compare`.

### Task 15: Deploy

**Files:**
- Create: `vercel.json` only if Task 5 needed `maxDuration`

- [ ] **Step 1:** `npm run build` succeeds; `npx vitest run` all green; `npx nuxi typecheck` clean.
- [ ] **Step 2:** **Ask the user before any outward action.** She creates/links the Vercel project and sets `NUXT_CF_ACCOUNT_ID`, `NUXT_CF_API_TOKEN`.
- [ ] **Step 3:** After her go-ahead: deploy, run the full flow once on the preview URL on desktop and phone.

---

## Open items (not in this plan)

- `NO_WINDOWS` prompt sentence (spike run-7) is untested — quota ran out. If it fixes the remaining invented windows, add a `hasWindows: boolean` field to the photo-check output and pass it to `buildImagePrompt`.
- Exact neuron cost per call is unmeasured (token lacks Account Analytics: Read).
