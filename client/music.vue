<script setup lang="ts">
import { onMounted, ref, inject, provide } from 'vue'

const musicEl = ref<HTMLAudioElement>()

onMounted(() => {
  const val = inject('music.shed-a-light', false)
  provide('music.shed-a-light', true)
  if (!val) {
    musicEl.value.play()
    musicEl.value.currentTime += 10
    musicEl.value.addEventListener('ended', () => {
      musicEl.value.currentTime = 0
    })
  } else {
    musicEl.value.pause()
    musicEl.value.remove()
  }
})
</script>

<template>
  <audio ref="musicEl" src="https://content.cyans.me/static/musics/shed a light.mp3" crossorigin="anonymous"
         autoplay></audio>
</template>

<style scoped>

</style>
