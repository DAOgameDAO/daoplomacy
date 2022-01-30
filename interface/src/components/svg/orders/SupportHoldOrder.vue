<template>
  <Arrow
    :from="arrowFrom"
    :to="arrowTo"
    :headSize="arrowHeadSize"
    :strokeWidth="strokeWidth"
    head="bar"
    :color="color.toString()"
    :strokeDasharray="strokeDasharray"
  />
</template>

<script lang="ts">
import { PropType } from "vue";
import { SupportHoldOrder, OrderResults } from "../../../types";
import { getUnitCoords } from "../../../map";
import { offset } from "../../../math";
import Arrow from "../Arrow.vue";
import { failedOrderColor, successfulOrderColor } from "../../../colors";

export default {
  name: "SupportHoldOrder",
  props: {
    order: {
      type: Object as PropType<SupportHoldOrder>,
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
    from() {
      return getUnitCoords(this.order.unit.location);
    },
    to() {
      return getUnitCoords(this.order.receiver.location);
    },

    arrowFrom() {
      return offset(this.from, this.to, this.scale * 0.65, 0.4);
    },
    arrowTo() {
      return offset(this.to, this.from, this.scale * 0.65, 0.4);
    },

    arrowHeadSize() {
      return 0.7 * this.scale;
    },
    strokeWidth() {
      return 0.1 * this.scale;
    },

    color() {
      if (this.orderResults.cut || this.orderResults.void) {
        return failedOrderColor;
      }
      return successfulOrderColor;
    },
    strokeDasharray() {
      return [this.strokeWidth * 4];
    },
  },
};
</script>
