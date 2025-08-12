<script setup>
import { ref } from 'vue';
import PhaserGame from './Phaser.vue';

const phaserRef = ref();
</script>

<template>
    <PhaserGame ref="phaserRef"/>
</template>
