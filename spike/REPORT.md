# Spike: FLUX.2 klein 4B + vision LLMs on Workers AI (free tier)

Date: 2026-10-26. Scripts: `generate.mjs`, `vision.mjs`. Photos and results are git-ignored (`photos/`, `results/`).

## Image generation — `@cf/black-forest-labs/flux-2-klein-4b`

**API (undocumented, established experimentally):** multipart form with `prompt`, `input_image_0` (JPEG file), `width`, `height`, `seed`. Response `{ result: { image: <base64 JPEG> } }`.

**Dimensions:** output is exactly `width × height` when both are multiples of 16 (otherwise rounded). Cropping the input to multiples of 16 gives identical before/after sizes — 19/19 matched. Slider needs no resize step.

**Time:** 5–21 s per image, median ~10 s.

**Quota:** 43 generations + 16 LLM calls in one day did not hit the free limit. Exact neuron use not measured (the API token has no Analytics permission).

**Quality (final prompt, run-5, 19 photos, seed 42):** styles are recognisable and attractive; camera angle and framing are kept in every image. Geometry is the weak point:

| Defect | Photos |
|---|---|
| Window added | kuchnia_3 (in the middle), lazienka_1, sypialnia_1 (two windows + a door, partition walls removed) |
| Window implied by a light reflection | kuchnia_1 (right side) |
| Mirror reflects a window that doesn't exist | lazienka_2, lazienka_3, lazienka_4, przedpokoj_2 |
| Door added | sypialnia_3 |
| Door blocked by decor | przedpokoj_2 (plant in front of the bathroom door) |
| Window shape changed | salon_4 |

User review (2026-10-26) found defects in **10 of 19** results. My first pass missed most of them (incl. kuchnia_3), so results must be checked against these categories explicitly.

**Rules added after review** (now in the prompt, not yet re-tested):
- mirrors reflect only the room as it is — no windows that aren't in the photo,
- the space in front of every door, balcony doors included, stays clear of furniture, plants and decor.

**Prompt findings:**
- "Natural daylight" made the model invent windows in rooms without visible ones → replaced with "same light sources as the original".
- Explicitly listing water heaters / boilers / pipes kept them in bathrooms and kitchens.
- "Do not add new windows/doors" did **not** help reliably — sypialnia_1 was correct in run-2 without it and broke in run-5 with it. Negative instructions seem to prime the model.

## Vision LLMs — photo check and change description

| | Llama 4 Scout | Mistral Small 3.1 |
|---|---|---|
| Photo check time | 1–2 s | 2–3 s |
| Photo check quality | Lenient; flags only obvious problems | Stricter, more specific warnings (tilted, room not in frame) |
| Description time | 4–5 s | 7–12 s |
| Palette roles | Generic ("Walls") | Matches design ("Paper walls", "Oak floor") |
| Palette hex accuracy | Swapped/wrong colours (dark brown labelled "Walls" for beige walls) | Plausible |
| `kept` list | Sometimes wrong ("windows and curtains remain the same") | Correct |
| Valid JSON | 8/8 | 8/8 |

**Recommendation:** Mistral Small 3.1 for both calls. ~3 s slower, noticeably more accurate.

## Conclusions

1. klein 4B is fast, free, keeps framing and produces good-looking styles — but with half of results defective it is not yet good enough for MVP as is.
2. About half of the results break a hard rule (10 of 19). The existing "Something's off" → retry with a new seed flow covers this, but the rate is high.
3. ~~Try `flux-2-klein-9b`~~ — tested in run 6, no better.

**Decision (2026-10-26): FLUX.2 klein 4B** for image generation, Mistral Small 3.1 for photo check and description.

## Run 6 — new prompt (mirrors, clear doors) on 4B vs 9B, the 10 defective photos

Side by side: `results/compare-run-6.html` (before · run-5 · run-6 4B · run-6 9B).

| Photo | 4B, new prompt | 9B, new prompt |
|---|---|---|
| kuchnia_1 | ✗ window added on the right | ✗ window added on the right |
| kuchnia_3 | ✓ | ✓ |
| lazienka_1 | ✗ window added behind the toilet | ✗ lit blind above the toilet implies a window |
| lazienka_2 | ✗ mirror reflects a window | — HTTP 500, 3 tries |
| lazienka_3 | ✓ | ✓ |
| lazienka_4 | ✓ | ✗ window with curtains added on the right |
| przedpokoj_2 | ✗ mirror reflects a window | ✗ mirror reflects a window |
| salon_4 | ✓ | ✗ window frames white → wood |
| sypialnia_1 | ✓ | ? wardrobe mirror reflects a window (may be the real balcony) |
| sypialnia_3 | ✓ | ✗ window frame white → wood |

- **4B + new prompt: 6/10 fixed.** Remaining defects are all invented windows (directly or in a mirror) in rooms with **no window in the photo**.
- **9B is not better here:** 2–3/9 ok, changes frame colours, and returned HTTP 500 on 7 of 16 calls. Faster (~2 s) but unreliable.
- Door-clearing rule: no blocked doors in any run-6 result.
- My assessment — verify against the comparison page; my first review of run-5 missed most defects.

## Run 7 — "no windows" sentence (pending)

`NO_WINDOWS=1` adds: "This room has no windows; light comes only from the lamps; mirrors show only walls and furniture." Target: kuchnia_1, lazienka_1, lazienka_2, przedpokoj_2.

Not run yet — the daily free allocation ran out on 2026-10-26 after run-6 (9B is ~12× the cost of 4B). Quota error as returned by the API: **HTTP 429, code 4006** ("you have used up your daily free allocation of 10,000 neurons") — this is what the app maps to `QUOTA_REACHED`.
