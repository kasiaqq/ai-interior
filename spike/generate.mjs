// Spike: restyle every photo in spike/photos with FLUX.2 klein 4B on Workers AI.
// Usage: RUN=<run-name> [MODEL=flux-2-klein-9b] [NO_WINDOWS=1] node --env-file=.env spike/generate.mjs [photo-names,comma,separated]
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

const MODEL = `@cf/black-forest-labs/${process.env.MODEL ?? 'flux-2-klein-4b'}`;
const MAX_EDGE = 1024;
const SPIKE_DIR = new URL('.', import.meta.url).pathname;
const PHOTOS_DIR = join(SPIKE_DIR, 'photos');
const RESULTS_DIR = join(SPIKE_DIR, 'results', process.env.RUN ?? 'run-1');

const ROOM_TYPES = {
  salon: 'living room',
  sypialnia: 'bedroom',
  kuchnia: 'kitchen',
  lazienka: 'bathroom',
  przedpokoj: 'hallway',
};

const STYLES = {
  japandi:
    'Japandi as it looks in 2026: Japanese restraint on Scandinavian bones, low light-oak furniture, warm paper-toned walls, linen and wool textiles, one sculptural plant, clear uncluttered surfaces, warm rather than grey',
  scandinavian:
    'Scandinavian as it looks in 2026: pale wood, wool and soft textures, daylight as the main light source, muted blues and warm whites, cosy but not clinical',
  industrial:
    'Industrial as it looks in 2026: calm and soft, concrete and microcement surfaces, matte black metal, worn leather, warm wood against cool surfaces, few exposed pipes',
  midcentury:
    'Mid-century modern as it looks in 2026: walnut, tapered legs, burnt orange and teal used sparingly, a few signature pieces rather than a full period set',
};
const STYLE_ORDER = Object.keys(STYLES);

const buildPrompt = (roomType, style) =>
  [
    `Redesign this ${roomType} in ${STYLES[style]}.`,
    'Keep the exact same camera angle, framing and perspective.',
    'Keep the room shell identical: walls, wall positions, room size, ceiling height.',
    'Keep every window identical in position, shape, size and frame colour; curtains, blinds and other window decor may be added.',
    'Keep doors in the same position and shape; the door leaf, handle and colour may change.',
    'Keep the space in front of every door, including balcony doors, clear of furniture, plants and decor.',
    'Mirrors reflect only this room as it is: no windows appear in a mirror unless that window is in the photo.',
    'Keep radiators, water heaters and boilers, pipes and vents, sockets, beams, fireplace, stairs and niches in place; their colour or cover may match the style.',
    'Do not add any new windows, doors or openings, and do not remove existing ones.',
    'Replace everything else to fit the style: furniture, flooring, wall colour and finish, lighting, textiles, decor, built-in cabinetry.',
    'Photorealistic interior photograph with the same light sources as the original.',
    ...(process.env.NO_WINDOWS ? ['This room has no windows; light comes only from the lamps; mirrors show only walls and furniture.'] : []),
  ].join(' ');

function prepareInput(photoPath, outDir) {
  const inputPath = join(outDir, 'before.jpg');
  execFileSync('sips', ['-s', 'format', 'jpeg', '-Z', String(MAX_EDGE), photoPath, '--out', inputPath], { stdio: 'ignore' });
  const info = execFileSync('sips', ['-g', 'pixelWidth', '-g', 'pixelHeight', inputPath]).toString();
  const width = Math.floor(Number(info.match(/pixelWidth: (\d+)/)[1]) / 16) * 16;
  const height = Math.floor(Number(info.match(/pixelHeight: (\d+)/)[1]) / 16) * 16;
  execFileSync('sips', ['-c', String(height), String(width), inputPath], { stdio: 'ignore' });
  return { inputPath, width, height };
}

async function generate({ inputPath, prompt, width, height, seed }) {
  const form = new FormData();
  form.append('prompt', prompt);
  form.append('input_image_0', new Blob([readFileSync(inputPath)], { type: 'image/jpeg' }), 'before.jpg');
  form.append('width', String(width));
  form.append('height', String(height));
  form.append('seed', String(seed));

  const url = `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/ai/run/${MODEL}`;
  const startedAt = performance.now();
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.CF_API_TOKEN}` },
    body: form,
  });
  const seconds = (performance.now() - startedAt) / 1000;
  const body = await response.json();
  if (!response.ok || !body.success) throw new Error(`HTTP ${response.status}: ${JSON.stringify(body.errors)}`);
  return { image: Buffer.from(body.result.image, 'base64'), seconds };
}

const only = process.argv[2]?.split(',');
const photos = readdirSync(PHOTOS_DIR).filter((f) => /\.(webp|jpe?g|png|heic)$/i.test(f)).sort();

for (const [index, file] of photos.entries()) {
  const name = basename(file, extname(file));
  if (only && !only.includes(name)) continue;
  const roomType = ROOM_TYPES[name.split('_')[0]];
  const style = STYLE_ORDER[index % STYLE_ORDER.length];
  const outDir = join(RESULTS_DIR, name);
  mkdirSync(outDir, { recursive: true });

  const { inputPath, width, height } = prepareInput(join(PHOTOS_DIR, file), outDir);
  const prompt = buildPrompt(roomType, style);
  try {
    const { image, seconds } = await generate({ inputPath, prompt, width, height, seed: 42 });
    writeFileSync(join(outDir, `after-${style}.jpg`), image);
    writeFileSync(join(outDir, 'meta.json'), JSON.stringify({ file, roomType, style, width, height, seconds, prompt }, null, 2));
    console.log(`${name}\t${roomType}\t${style}\t${width}x${height}\t${seconds.toFixed(1)}s`);
  } catch (error) {
    console.log(`${name}\tFAILED\t${error.message}`);
  }
}
