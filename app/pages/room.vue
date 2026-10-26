<script setup lang="ts">
import type { RoomTypeId } from '#shared/types'
import { useSessionStore } from '~/stores/session'

const session = useSessionStore()
const roomType = ref<RoomTypeId | null>(session.roomType)

const goodPhotoNote = computed(() => {
  const analysis = session.analysis
  if (analysis?.verdict !== 'ok') return null
  return analysis.positives.length ? `Photo looks good — ${analysis.positives.join(', ').toLowerCase()}` : 'Photo looks good'
})

function next() {
  if (!roomType.value) return
  session.setRoomType(roomType.value)
  navigateTo('/style')
}
</script>

<template>
  <div v-if="session.photo" class="container room">
    <PhotoPreview :photo="session.photo" @replace="navigateTo('/')">
      <p v-if="goodPhotoNote" class="room__ok"><AppIcon name="check" :size="14" /> {{ goodPhotoNote }}</p>
    </PhotoPreview>

    <div class="room__side">
      <h1 class="title">What room is this?</h1>
      <p class="lead room__lead">It tells us what furniture belongs in the frame.</p>
      <RoomTypeGrid v-model="roomType" />
    </div>

    <StepFooter back-to="/" primary-label="Continue to styles" :primary-disabled="!roomType" @primary="next" />
  </div>
</template>

<style scoped>
.room {
  display: grid;
  gap: var(--space-8);
}

.room__ok {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  font-size: var(--text-xs);
  color: var(--color-accent-text);
}

.room__lead {
  margin: var(--space-2) 0 var(--space-5);
  font-size: var(--text-sm);
}

@media (min-width: 768px) {
  .room {
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}
</style>
