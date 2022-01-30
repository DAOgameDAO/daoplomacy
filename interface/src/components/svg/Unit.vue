<template>
  <circle
    v-if="isArmy"
    :cx="coords[0]"
    :cy="coords[1]"
    :r="size / 2"
    :stroke-width="strokeWidth"
    :fill="fill"
    :stroke="stroke"
  />
  <Triangle
    v-else
    :coords="coords"
    :radius="(1.1 * size) / 2"
    :fill="fill"
    :strokeWidth="strokeWidth"
    :stroke="stroke"
  />
</template>

<script lang="ts">
import { PropType } from "vue";
import * as types from "../../types";
import { getUnitCoords } from "../../map";
import { powerBaseColors } from "../../colors";
import Triangle from "./Triangle.vue";

export default {
  name: "Unit",
  components: {
    Triangle,
  },
  props: {
    unit: {
      type: Object as PropType<types.Unit & types.Owned>,
      required: true,
    },
    scale: {
      type: Number,
      required: true,
    },
  },

  computed: {
    size() {
      return this.scale;
    },
    coords() {
      return getUnitCoords(this.unit.location);
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
    strokeWidth() {
      return 0.1 * this.scale;
    },
    isArmy() {
      return this.unit.type == types.UnitType.Army;
    },
    isFleet() {
      return this.unit.type == types.UnitType.Fleet;
    },

    fill() {
      return powerBaseColors[this.unit.power.toUpperCase()].toString();
    },
    stroke() {
      return powerBaseColors[this.unit.power.toUpperCase()].darken().toString();
    },
  },
};
</script>
