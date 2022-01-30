<template>
  <g>
    <Arrow
      :from="unitReceiverCoords"
      :to="receiverUnitCoords"
      head="bar"
      :headSize="headSize"
      :color="color.toString()"
      :strokeWidth="strokeWidth"
      :strokeDasharray="strokeDasharray"
    />
    <Arrow
      :from="unitTargetCoords"
      :to="targetUnitCoords"
      head="arrow"
      :headSize="headSize"
      :color="color.toString()"
      :strokeWidth="strokeWidth"
      :strokeDasharray="strokeDasharray"
    />
  </g>
</template>

<script lang="ts">
import { PropType } from "vue";
import { ConvoyOrder } from "../../../types";
import { getUnitCoords } from "../../../map";
import { offset, triangleCenter } from "../../../math";
import { convoyOrderColor } from "../../../colors";
import Arrow from "../Arrow.vue";

export default {
  name: "ConvoyOrder",
  components: {
    Arrow,
  },
  props: {
    order: {
      type: Object as PropType<ConvoyOrder>,
      required: true,
    },
    scale: {
      type: Number,
      default: 1.0,
    },
  },

  computed: {
    unitCoords() {
      return getUnitCoords(this.order.unit.location);
    },
    receiverCoords() {
      return getUnitCoords(this.order.receiver.location);
    },
    targetCoords() {
      return getUnitCoords(this.order.target);
    },
    center() {
      return triangleCenter(
        this.unitCoords,
        this.receiverCoords,
        this.targetCoords
      );
    },

    unitReceiverCoords() {
      return offset(
        this.unitCoords,
        this.receiverCoords,
        0.65 * this.scale,
        0.4
      );
    },
    receiverUnitCoords() {
      return offset(
        this.receiverCoords,
        this.unitCoords,
        0.65 * this.scale,
        0.4
      );
    },
    unitTargetCoords() {
      return offset(this.unitCoords, this.targetCoords, 0.65 * this.scale, 0.4);
    },
    targetUnitCoords() {
      return offset(this.targetCoords, this.unitCoords, 0.65 * this.scale, 0.4);
    },

    color() {
      return convoyOrderColor;
    },
    strokeDasharray() {
      return [0.8 * this.scale];
    },
    strokeWidth() {
      return 0.1 * this.scale;
    },
    headSize() {
      return 0.7 * this.scale;
    },
  },
};
</script>
