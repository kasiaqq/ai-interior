<script setup lang="ts">
useLeaveWarning()
useFocusOnNavigation()
useHead({ titleTemplate: (title) => (title ? `${title} · AI Interior` : 'AI Interior') })
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
