<script setup lang="ts">
defineProps<{ warnings: string[] }>()
const emit = defineEmits<{ chooseAnother: []; continue: [] }>()
</script>

<template>
  <div class="panel">
    <div class="warning">
      <p class="panel__heading"><AppIcon name="alert" /> This one may be hard to work with</p>
      <ul class="bullets">
        <li v-for="warning in warnings" :key="warning">{{ warning }}</li>
      </ul>
      <p class="panel__advice">You can go on with this photo. A wider, brighter shot usually gives a cleaner result.</p>
    </div>
    <div class="panel__actions">
      <button type="button" class="btn btn--primary" @click="emit('chooseAnother')">Choose another photo</button>
      <button type="button" class="btn" @click="emit('continue')">Continue anyway</button>
    </div>
  </div>
</template>

<style scoped>
.panel {
  display: grid;
  gap: var(--space-4);
}

.panel__heading {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-bottom: var(--space-2);
  font-weight: 600;
  font-size: var(--text-md);
}

.panel__advice {
  margin-top: var(--space-3);
}

.panel__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
</style>
