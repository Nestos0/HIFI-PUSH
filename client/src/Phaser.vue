<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'
import StartGame from './game/main';

const game = ref();
const scene = ref();
const parent = "game-container";

onMounted(() => {
  game.value = StartGame(parent);
})

onUnmounted(() => {
  if (game.value) {
    game.value.destroy();
    game.value = null;
  }
})

defineExpose({ scene, game })
</script>

<template>
  <div id="game-container"></div>
</template>
