<script setup lang="ts">
import { ref } from 'vue'

defineProps<{ beforeUrl: string; afterUrl: string; afterLabel: string; width: number; height: number }>()

const KEY_STEP = 5
const position = ref(50)
const frame = ref<HTMLElement>()

const clamp = (value: number) => Math.min(100, Math.max(0, value))

function moveTo(clientX: number) {
  const box = frame.value?.getBoundingClientRect()
  if (box?.width) position.value = clamp(((clientX - box.left) / box.width) * 100)
}

function onPointerDown(event: PointerEvent) {
  ;(event.currentTarget as HTMLElement).setPointerCapture?.(event.pointerId)
  moveTo(event.clientX)
}

function onPointerMove(event: PointerEvent) {
  if ((event.currentTarget as HTMLElement).hasPointerCapture?.(event.pointerId)) moveTo(event.clientX)
}

function onKeydown(event: KeyboardEvent) {
  const next = {
    ArrowLeft: position.value - KEY_STEP,
    ArrowRight: position.value + KEY_STEP,
    Home: 0,
    End: 100,
  }[event.key]
  if (next === undefined) return
  event.preventDefault()
  position.value = clamp(next)
}
</script>

<template>
  <div
    ref="frame"
    class="slider"
    :style="{ aspectRatio: `${width} / ${height}` }"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
  >
    <img :src="beforeUrl" :width="width" :height="height" alt="Your room before" class="slider__image" draggable="false" />
    <img
      :src="afterUrl"
      :width="width"
      :height="height"
      alt="Your room restyled"
      class="slider__image"
      :style="{ clipPath: `inset(0 0 0 ${position}%)` }"
      draggable="false"
    />
    <span class="slider__label">Before</span>
    <span class="slider__label slider__label--after">{{ afterLabel }}</span>
    <span class="slider__line" :style="{ left: `${position}%` }" />
    <span
      class="slider__handle"
      :style="{ left: `${position}%` }"
      role="slider"
      tabindex="0"
      aria-label="Compare before and after"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="Math.round(position)"
      @keydown="onKeydown"
    >
      <AppIcon name="handle" :size="16" />
    </span>
  </div>
</template>

<style scoped>
.slider {
  position: relative;
  width: 100%;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-surface-raised);
  touch-action: pan-y;
  user-select: none;
  cursor: ew-resize;
}

.slider__image {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.slider__label {
  position: absolute;
  top: var(--space-3);
  left: var(--space-3);
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  background: rgb(20 22 21 / 0.85);
  font-size: var(--text-xs);
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.slider__label--after {
  left: auto;
  right: var(--space-3);
  background: var(--color-accent);
  color: var(--color-accent-ink);
}

.slider__line {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  margin-left: -1px;
  background: var(--color-accent);
}

.slider__handle {
  position: absolute;
  top: 50%;
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  margin-left: -18px;
  border-radius: 50%;
  background: var(--color-accent);
  color: var(--color-accent-ink);
  transform: translateY(-50%);
}
</style>
