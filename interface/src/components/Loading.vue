<template>
  <div class="mx-auto my-4 flex flex-col justify-center">
    <SquareLoader :color="color" />
    <p class="mx-auto">
      <slot></slot>
    </p>
  </div>
</template>

<script lang="ts">
import SquareLoader from "vue-spinner/src/SquareLoader.vue";
import { landColor } from "../colors";

export default {
  name: "Loading",
  components: {
    SquareLoader,
  },
  computed: {
    color() {
      return landColor.saturate().toString();
    },
  },
};
</script>
