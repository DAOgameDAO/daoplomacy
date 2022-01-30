<template>
  <component
    :is="orderComponent"
    :order="order"
    :orderResults="orderResults"
    :scale="scale"
  />
</template>

<script lang="ts">
import { PropType } from "vue";
import { Order, OrderType, OrderResults } from "../../types";
import HoldOrder from "./orders/HoldOrder.vue";
import MoveOrder from "./orders/MoveOrder.vue";
import SupportHoldOrder from "./orders/SupportHoldOrder.vue";
import SupportMoveOrder from "./orders/SupportMoveOrder.vue";
import BuildOrder from "./orders/BuildOrder.vue";
import DisbandOrder from "./orders/DisbandOrder.vue";
import ConvoyOrder from "./orders/ConvoyOrder.vue";

export default {
  name: "Order",
  props: {
    order: {
      type: Object as PropType<Order>,
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
    HoldOrder,
    MoveOrder,
    SupportHoldOrder,
    SupportMoveOrder,
    BuildOrder,
    DisbandOrder,
    ConvoyOrder,
  },

  computed: {
    orderComponent() {
      switch (this.order.type) {
        case OrderType.Hold:
          return HoldOrder;
        case OrderType.Move:
          return MoveOrder;
        case OrderType.SupportHold:
          return SupportHoldOrder;
        case OrderType.SupportMove:
          return SupportMoveOrder;
        case OrderType.Build:
          return BuildOrder;
        case OrderType.Disband:
          return DisbandOrder;
        case OrderType.Convoy:
          return ConvoyOrder;
        case OrderType.Retreat:
          return MoveOrder;
      }
    },
  },
};
</script>

<style scoped>
.hold {
  fill: none;
  stroke: black;
  stroke-width: 4px;
}
.support {
  stroke: black;
  stroke-width: 6px;
  stroke-dasharray: 10;
}
.convoy {
  stroke: blue;
  stroke-width: 6px;
  stroke-dasharray: 10;
}
</style>
