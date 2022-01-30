<template>
  <polyline
    :points="pointsStr"
    :stroke="color"
    :stroke-width="strokeWidth"
    :stroke-dasharray="strokeDasharrayString"
  />
</template>

<script lang="ts">
import { PropType } from "vue";
import { Coords } from "../../types";
import { subCoords, length } from "../../math";

export default {
  name: "Line",
  props: {
    coords: {
      type: Array as PropType<Coords[]>,
      default: [],
    },

    color: {
      type: String,
      default: "black",
    },

    strokeWidth: {
      type: Number,
      default: 1.0,
    },
    strokeDasharray: {
      type: Array as PropType<string[] | null>,
      default: null,
    },
  },

  computed: {
    pointsStr() {
      return this.coords.map((c) => c.join(",")).join(" ");
    },
    strokeDasharrayString() {
      if (!this.strokeDasharray) {
        return null;
      }
      return this.strokeDasharray.join(" ");
    },
  },
};
</script>
