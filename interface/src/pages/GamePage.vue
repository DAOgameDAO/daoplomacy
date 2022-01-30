<template>
  <div>
    <div class="flex justify-center">
      <GameView />
    </div>
  </div>
</template>

<script>
import GameView from "../components/GameView.vue";

export default {
  name: "GamePage",
  components: {
    GameView,
  },
};
</script>
