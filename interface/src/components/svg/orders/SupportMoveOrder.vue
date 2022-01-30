<template>
  <!-- <g>
    <Line :coords="[unitCoords, midCoords, toCoords]" dashed />
    <Line :coords="[fromCoords, midCoords]" dotted />
    <ArrowHead :tip="toCoords" :direction="arrowDirection" />
  </g> -->
  <g>
    <Arrow
      :from="unitCoordsOffset"
      :to="centerCoords"
      :headSize="headSize"
      :strokeWidth="strokeWidth"
      :strokeDasharray="strokeDasharray"
      :color="color.toString()"
    />
    <Arrow
      :from="centerCoords"
      :to="receiverCoordsOffset"
      head="bar"
      :headSize="headSize"
      :strokeWidth="strokeWidth"
      :strokeDasharray="strokeDasharray"
      :color="color.toString()"
    />
    <Arrow
      :from="centerCoords"
      :to="targetCoordsOffset"
      head="arrow"
      :headSize="headSize"
      :strokeWidth="strokeWidth"
      :strokeDasharray="strokeDasharray"
      :color="color.toString()"
    />
  </g>
</template>

<script lang="ts">
import { PropType } from "vue";
import { SupportMoveOrder, OrderResults } from "../../../types";
import { getUnitCoords } from "../../../map";
import { triangleCenter, offset } from "../../../math";
import Arrow from "../Arrow.vue";
import { failedOrderColor, successfulOrderColor } from "../../../colors";

export default {
  name: "SupportMoveOrder",
  props: {
    order: {
      type: Object as PropType<SupportMoveOrder>,
      required: true,
    },
    orderResults: {
      type: Object as PropType<OrderResults>,
      required: true,
    },
    scale: {
      type: Number,
      default: 1.0,
    },
  },

  components: {
    Arrow,
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
    centerCoords() {
      return triangleCenter(
        this.unitCoords,
        this.receiverCoords,
        this.targetCoords
      );
    },

    unitCoordsOffset() {
      return offset(this.unitCoords, this.centerCoords, 0.65 * this.scale, 0.4);
    },
    receiverCoordsOffset() {
      return offset(
        this.receiverCoords,
        this.centerCoords,
        0.65 * this.scale,
        0.4
      );
    },
    targetCoordsOffset() {
      return offset(
        this.targetCoords,
        this.centerCoords,
        0.65 * this.scale,
        0.4
      );
    },

    headSize() {
      return 0.7 * this.scale;
    },
    strokeWidth() {
      return 0.1 * this.scale;
    },
    strokeDasharray() {
      return [this.strokeWidth * 4];
    },
    color() {
      if (this.orderResults.cut) {
        return failedOrderColor;
      }
      if (this.orderResults.void) {
        return failedOrderColor;
      }
      return successfulOrderColor;
    },
  },
};
</script>
