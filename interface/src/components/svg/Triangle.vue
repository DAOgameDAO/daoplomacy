<template>
  <polygon
    :points="points"
    :stroke-width="strokeWidth"
    :fill="fill"
    :stroke="stroke"
  />
</template>

<script lang="ts">
import { PropType } from "vue";
import { Coords } from "../../types";

export default {
  name: "Triangle",
  props: {
    coords: {
      type: Object as PropType<Coords>,
      required: true,
    },
    radius: {
      type: Number,
      required: true,
    },
    strokeWidth: {
      type: Number,
      default: 1,
    },
    fill: {
      type: String,
      default: "black",
    },
    stroke: {
      type: String,
      default: "black",
    },
  },

  computed: {
    points() {
      const pointsRel = [
        [-0.866, -0.5],
        [0.866, -0.5],
        [0, 1.0],
      ];

      const [c0, c1] = this.coords;
      const r = this.radius;

      let points = "";
      for (const [d0, d1] of pointsRel) {
        points +=
          (c0 + d0 * r).toString() + "," + (c1 + d1 * r).toString() + " ";
      }
      return points;
    },
  },
};
</script>
