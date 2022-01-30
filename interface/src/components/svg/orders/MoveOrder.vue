<template>
  <Arrow
    :from="arrowFrom"
    :to="arrowTo"
    head="arrow"
    :headSize="headSize"
    :strokeWidth="strokeWidth"
    :color="color.toString()"
  />
</template>

<script lang="ts">
import { PropType } from "vue";
import { MoveOrder, OrderResults } from "../../../types";
import { getUnitCoords } from "../../../map";
import { offset } from "../../../math";
import Arrow from "../Arrow.vue";
import { failedOrderColor, successfulOrderColor } from "../../../colors";

export default {
  name: "MoveOrder",
  props: {
    order: {
      type: Object as PropType<MoveOrder>,
      required: true,
    },
    orderResults: {
      type: Object as PropType<OrderResults>,
      required: true,
    },
    scale: {
      type: Number,
      required: true,
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
      return getUnitCoords(this.order.target);
    },

    arrowFrom() {
      return offset(this.from, this.to, this.scale * 0.65, 0.3);
    },
    arrowTo() {
      return offset(this.to, this.from, this.scale * 0.65, 0.3);
    },

    headSize() {
      return 0.7 * this.scale;
    },
    strokeWidth() {
      return 0.1 * this.scale;
    },

    color() {
      if (this.orderResults.bounce) {
        return failedOrderColor;
      }
      return successfulOrderColor;
    },
  },
};
</script>
