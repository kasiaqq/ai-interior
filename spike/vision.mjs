// Spike: compare vision LLMs on Workers AI for photo-check and change description.
// Usage: node --env-file=.env spike/vision.mjs <run-name>
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const MODELS = ['@cf/meta/llama-4-scout-17b-16e-instruct', '@cf/mistralai/mistral-small-3.1-24b-instruct'];
const CHECK_PHOTOS = ['salon_1', 'sypialnia_1', 'lazienka_3', 'kuchnia_3', 'salon_5'];
const DESCRIBE_PHOTOS = ['salon_3', 'kuchnia_4', 'sypialnia_2'];

const RUN_DIR = join(new URL('.', import.meta.url).pathname, 'results', process.argv[2] ?? 'run-5');

const PHOTO_CHECK_PROMPT = `You check a photo before an AI restyles the room in it. A good photo: shot from a corner so two walls and the floor are visible, daylight, the whole room in frame, held straight, no filters, no panorama, no people.
Reply with JSON only:
{"verdict":"ok"|"warning","warnings":[short user-facing sentences explaining each problem],"positives":[short phrases like "wide shot","daylight"]}`;

const DESCRIBE_PROMPT = `The first image is the original room, the second is the same room restyled in {STYLE}. Describe the restyled room for the user.
Reply with JSON only:
{"palette":[{"role":"short name like Paper walls or Oak floor","hex":"#RRGGBB"}] (4-5 entries),
"keyPieces":[3-4 short phrases about main furniture and lighting],
"changes":[3 short phrases about what changed versus the original],
"kept":[short phrases about what stayed exactly the same: windows, doors, radiators, room shape],
"summary":"one sentence for mobile"}`;

const toDataUrl = (path) => `data:image/jpeg;base64,${readFileSync(path).toString('base64')}`;

async function chat(model, text, imagePaths) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/v1/chat/completions`;
  const startedAt = performance.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CF_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      max_tokens: 700,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text }, ...imagePaths.map((p) => ({ type: 'image_url', image_url: { url: toDataUrl(p) } }))],
        },
      ],
    }),
  });
  const seconds = (performance.now() - startedAt) / 1000;
  const body = await response.json();
  if (!response.ok) return { error: `HTTP ${response.status}: ${JSON.stringify(body).slice(0, 300)}`, seconds };
  const raw = body.choices?.[0]?.message?.content ?? '';
  const json = raw.match(/\{[\s\S]*\}/)?.[0];
  let parsed = null;
  try {
    parsed = JSON.parse(json);
  } catch {}
  return { seconds, usage: body.usage, parsed, raw: parsed ? undefined : raw };
}

const report = { photoCheck: [], describe: [] };

for (const model of MODELS) {
  for (const name of CHECK_PHOTOS) {
    const result = await chat(model, PHOTO_CHECK_PROMPT, [join(RUN_DIR, name, 'before.jpg')]);
    report.photoCheck.push({ model, name, ...result });
    console.log('check', model.split('/').pop(), name, result.seconds.toFixed(1) + 's', result.error ?? JSON.stringify(result.parsed ?? result.raw));
  }
  for (const name of DESCRIBE_PHOTOS) {
    const dir = join(RUN_DIR, name);
    const after = readdirSync(dir).find((f) => f.startsWith('after-'));
    const style = after.slice('after-'.length, -'.jpg'.length);
    const result = await chat(model, DESCRIBE_PROMPT.replace('{STYLE}', style), [join(dir, 'before.jpg'), join(dir, after)]);
    report.describe.push({ model, name, style, ...result });
    console.log('describe', model.split('/').pop(), name, result.seconds.toFixed(1) + 's', result.error ?? JSON.stringify(result.parsed ?? result.raw));
  }
}

writeFileSync(join(RUN_DIR, 'vision-report.json'), JSON.stringify(report, null, 2));
