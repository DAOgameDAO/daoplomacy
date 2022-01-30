<template>
  <circle
    v-if="isArmy"
    :cx="coords[0]"
    :cy="coords[1]"
    :r="size / 2"
    :stroke="stroke.toString()"
    :stroke-width="strokeWidth"
    fill="none"
  />
  <Triangle
    v-else
    :coords="coords"
    :radius="(1.1 * size) / 2"
    :stroke="stroke.toString()"
    :strokeWidth="strokeWidth"
    fill="none"
  />
</template>

<script lang="ts">
import { PropType } from "vue";
import { BuildOrder, UnitType } from "../../../types";
import { getUnitCoords } from "../../../map";
import { successfulOrderColor } from "../../../colors";
import Triangle from "../Triangle.vue";

export default {
  name: "BuildOrder",
  components: {
    Triangle,
  },
  props: {
    order: {
      type: Object as PropType<BuildOrder>,
      required: true,
    },
    scale: {
      type: Number,
      required: true,
    },
  },

  computed: {
    coords() {
      return getUnitCoords(this.order.unit.location);
    },
    isArmy() {
      return this.order.unit.type === UnitType.Army;
    },
    size() {
      return this.scale * 1.3;
    },
    strokeWidth() {
      return 0.15 * this.scale;
    },
    stroke() {
      return successfulOrderColor;
    },

    fleetPoints() {
      const pointsRel = [
        [-0.5, -0.866 / 3],
        [0, 0.866 / 2],
        [+0.5, -0.866 / 3],
      ];

      const [c0, c1] = this.coords;
      const s = (this.size / 0.433 / 2) * (3.14 / 4);

      let points = "";
      for (const [d0, d1] of pointsRel) {
        points +=
          (c0 + d0 * s).toString() + "," + (c1 + d1 * s).toString() + " ";
      }
      return points;
    },
  },
};
</script>
