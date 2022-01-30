<template>
  <circle
    :cx="coords[0]"
    :cy="coords[1]"
    :r="radius"
    :stroke-width="strokeWidth"
    :stroke="stroke.toString()"
    fill="none"
  />
</template>

<script lang="ts">
import { PropType } from "vue";
import { getUnitCoords } from "../../../map";
import { HoldOrder } from "../../../types";
import { successfulOrderColor } from "../../../colors";

export default {
  name: "HoldOrder",
  props: {
    order: {
      type: Object as PropType<HoldOrder>,
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
    radius() {
      return 0.65 * this.scale;
    },
    strokeWidth() {
      return 0.1 * this.scale;
    },
    stroke() {
      return successfulOrderColor;
    },
  },
};
</script>
