<script setup lang="ts">
import type { SessionPhoto } from '~/stores/session'

defineProps<{ photo: SessionPhoto; dimmed?: boolean }>()
const emit = defineEmits<{ replace: [] }>()

const formatSize = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
</script>

<template>
  <div class="preview">
    <div class="preview__frame">
      <img :src="photo.url" :width="photo.width" :height="photo.height" alt="Your photo" class="preview__image" />
      <span class="preview__label">{{ photo.fileName }} · {{ formatSize(photo.fileSize) }}</span>
    </div>
    <slot />
    <button type="button" class="btn" @click="emit('replace')">Replace photo</button>
  </div>
</template>

<style scoped>
.preview {
  display: grid;
  justify-items: start;
  gap: var(--space-3);
}

.preview__frame {
  position: relative;
  width: 100%;
}

.preview__image {
  width: 100%;
  height: auto;
  border-radius: var(--radius-lg);
}

.preview__label {
  position: absolute;
  left: var(--space-2);
  bottom: var(--space-2);
  max-width: calc(100% - 2 * var(--space-2));
  overflow: hidden;
  padding: 2px var(--space-2);
  border-radius: var(--radius-sm);
  background: rgb(20 22 21 / 0.85);
  font-size: var(--text-xs);
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
