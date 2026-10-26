<template>
  <AppHeader />
  <main class="main">
    <slot />
  </main>
</template>

<style scoped>
.main {
  padding-block: var(--space-8);
}
</style>
