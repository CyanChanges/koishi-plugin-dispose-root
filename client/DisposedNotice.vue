<script setup lang="ts">
import { inject } from 'vue'
import { onMounted, watch, ref } from 'vue'

const val = ref<number>(60 * 60 * 60 * 24)

const timer = ref<string>('')

watch(val, (d) => {
  // Time calculations for days, hours, minutes and seconds
  const hours = Math.floor((val.value % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((val.value % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((val.value % (1000 * 60)) / 1000);
  timer.value =
    `${String.prototype.padStart.call(hours, 2, 0)}:
    ${String.prototype.padStart.call(minutes, 2, 0)}:
    ${String.prototype.padStart.call(seconds, 2, 0)}`
})

setInterval(() => {
  val.value -= 500
}, 999)
</script>

<template>
  <div class="backdrop"/>
  <div class="notice">
    <h1 class="title">Your Koishi has been disposed!</h1>
    <h3>What happened?</h3>
    <p>
      If you see this message,
      the root context of Koishi
      has been disposed by
      <a href="https://github.com/CyanChanges/koishi-plugin-dispose-root">koishi-plugin-dispose-root</a>
    </p>
    <p>
      All effects of Koishi should be cleaned.
      Which means your Koishi stopped working.
    </p>
    <p>
      If you have <code>keepApp</code> option enabled,
      Koishi would not trigger autoRestart.
      <br>
    </p>
    <h3>How to fix that?</h3>
    <div style="font-weight: bold; color: yellow;">
      Vivo 50 to fix your Koishi.
      Otherwise your all runtime data lost forever in memory.
    </div>
    <br>
    <div class="timer-box">
      <div class="timer">Please Vivo 50 in {{ timer }}</div>
    </div>
  </div>
</template>

<style scoped>
.notice {
  width: 50em;
  height: 28em;
  position: absolute;
  padding: 2em;
  top: 40%;
  left: 50%;
  margin: -12.5em auto auto -25em;
  border-radius: 2em;
  background: linear-gradient(24deg, #ff0000, green, #affcaf);
  background-size: 300% 200%;
  overflow: hidden;
  transition: scale 1s;
  color: black;
  z-index: 99999;
  font-family: "Open Sans", "Noto Sans", sans-serif;
  animation: gradientBG 5s ease infinite;
}

.timer-box {
  width: 100%;
}

.timer {
  color: white;
  font-weight: bolder;
  margin: auto;
  font-size: 38px;
  text-align: center;
  background: #000;
  font-family: "JetBrains Mono", monospace;
  padding: 0.4rem;
}

@keyframes gradientBG {
  0%, 100% {
    background-position: 0% 50%;
    opacity: 25%;
  }
  65% {
    background-position: 40% 80%;
    opacity: 70%;
  }
}

.notice:hover {
  scale: 102%;
}

.notice > p:hover {
  text-transform: uppercase;
  margin-left: 1em;
  scale: 102%;
}

.notice {
  a {
    color: #df5f5f !important;
  }
}

.title {
  text-transform: uppercase;
  color: yellow;
  font-style: italic;
  font-weight: bold;
}

@keyframes White {
  0%, 45% {
    background-color: #0a0a0aaa;
  }
  50% {
    background-color: #0f0f0faa;
  }
  60% {
    background-color: #bababaf0;
  }
  80% {
    background-color: #eeee;
  }
  100% {
    background-color: #fff;
  }
}

.backdrop {
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: visibleFill;
  background-color: #0a0a0aaa;
  backdrop-filter: blur(2px);
  position: absolute;
  z-index: 9999;
  animation: White 25s ease paused;
}
</style>
