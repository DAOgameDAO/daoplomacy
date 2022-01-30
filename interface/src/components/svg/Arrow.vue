<template>
  <g>
    <Line
      v-if="showLine"
      :coords="linePoints"
      :strokeWidth="strokeWidth"
      :strokeDasharray="strokeDasharray"
      :color="color"
    />
    <ArrowHead
      v-if="showHead"
      :base="headBase"
      :tip="to"
      :width="headWidth"
      :color="color"
    />
    <line
      v-if="showBar"
      :x1="barPoints[0][0]"
      :y1="barPoints[0][1]"
      :x2="barPoints[1][0]"
      :y2="barPoints[1][1]"
      :stroke-width="strokeWidth"
      :stroke="color"
    />
  </g>
</template>

<script lang="ts">
import { PropType } from "vue";
import { Coords } from "../../types";
import {
  length,
  addCoords,
  subCoords,
  mulCoords,
  normCoords,
  rotateCoords,
} from "../../math";
import Line from "./Line.vue";
import ArrowHead from "./ArrowHead.vue";

export default {
  name: "Arrow",
  components: {
    Line,
    ArrowHead,
  },
  props: {
    from: {
      type: Object as PropType<Coords>,
      required: true,
    },
    to: {
      type: Object as PropType<Coords>,
      required: true,
    },

    color: {
      type: String,
      default: "black",
    },

    headSize: {
      type: Number,
      required: true,
    },
    strokeWidth: {
      type: Number,
      required: true,
    },
    strokeDasharray: {
      type: Array as PropType<string[] | null>,
      default: null,
    },

    head: {
      type: String,
    },
  },

  computed: {
    length() {
      return length(subCoords(this.to, this.from));
    },
    direction() {
      return normCoords(subCoords(this.to, this.from));
    },

    showHead() {
      return this.head === "arrow";
    },
    headWidth() {
      return this.headSize;
    },
    headLength() {
      return this.headSize * 1.3;
    },
    effectiveHeadLength() {
      return Math.min(this.length, this.headLength);
    },
    headBase() {
      return subCoords(
        this.to,
        mulCoords(this.direction, this.effectiveHeadLength)
      );
    },

    showBar() {
      return this.head === "bar";
    },
    barPoints() {
      const perpendicular = rotateCoords(this.direction, Math.PI / 2);
      const d = mulCoords(perpendicular, this.headSize * 0.5);
      return [addCoords(this.to, d), subCoords(this.to, d)];
    },

    showLine() {
      if (this.head !== "arrow") {
        return true;
      }
      return this.length > this.headLength;
    },
    linePoints() {
      const points = [this.from];
      if (this.showHead) {
        points.push(this.headBase);
      } else {
        points.push(this.to);
      }
      return points;
    },
  },
};
</script>
