<template>
  <polyline :points="pointsString" :fill="color" />
</template>

<script lang="ts">
import { PropType } from "vue";
import { Coords } from "../../types";
import {
  normCoords,
  rotateCoords,
  mulCoords,
  addCoords,
  subCoords,
} from "../../math";

export default {
  name: "ArrowHead",
  props: {
    base: {
      type: Object as PropType<Coords>,
      required: true,
    },
    tip: {
      type: Object as PropType<Coords>,
      required: true,
    },
    width: {
      type: Number,
      default: 25,
    },
    color: {
      type: String,
      default: "black",
    },
  },

  computed: {
    direction() {
      return normCoords(subCoords(this.tip, this.base));
    },
    perpendicular() {
      return rotateCoords(this.direction, Math.PI / 2);
    },
    halfBase() {
      return mulCoords(this.perpendicular, this.width / 2);
    },
    points() {
      const base1 = addCoords(this.base, this.halfBase);
      const base2 = subCoords(this.base, this.halfBase);
      return [this.tip, base1, base2];
    },
    pointsString() {
      let l = "";
      for (const c of this.points) {
        l += c[0] + "," + c[1] + " ";
      }
      return l;
    },
  },
};
</script>
