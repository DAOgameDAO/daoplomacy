<template>
  <div>
    <select
      v-model="selector.unit"
      @change="resetSelectorFrom('unit')"
      :disabled="!unitEnabled"
      class="select"
    >
      <option :value="null" disabled hidden>...</option>
      <option v-for="unit in unitOptions" :key="unit" :value="unit">
        {{ formatUnit(unit) }}
      </option>
    </select>
    <select
      v-model="selector.orderType"
      @change="resetSelectorFrom('orderType')"
      :disabled="!orderTypeEnabled"
      class="select"
    >
      <option :value="null" disabled hidden>...</option>
      <option v-for="type in orderTypeOptions" :key="type" :value="type">
        {{ formatOrderType(type) }}
      </option>
    </select>
    <select
      v-if="showReceiver"
      v-model="selector.receiver"
      @change="resetSelectorFrom('receiver')"
      :disabled="!receiverEnabled"
      class="select"
    >
      <option :value="null" disabled hidden>...</option>
      <option
        v-for="receiver in receiverOptions"
        :key="receiver"
        :value="receiver"
      >
        {{ formatUnit(receiver) }}
      </option>
    </select>
    <select
      v-if="showSupportedOrderType"
      v-model="selector.supportedOrderType"
      @change="resetSelectorFrom('supportedOrderType')"
      :disabled="!supportedOrderTypeEnabled"
      class="select"
    >
      <option :value="null" disabled hidden>...</option>
      <option
        v-for="supportedOrderType in supportedOrderTypeOptions"
        :key="supportedOrderType"
        :value="supportedOrderType"
      >
        {{ formatOrderType(supportedOrderType) }}
      </option>
    </select>
    <select
      v-if="showTarget"
      v-model="selector.target"
      @change="resetSelectorFrom('target')"
      :disabled="!targetEnabled"
      class="select"
    >
      <option :value="null" disabled hidden>...</option>
      <option v-for="target in targetOptions" :key="target" :value="target">
        {{ formatLocation(target) }}
      </option>
    </select>
    <select
      v-if="showConvoyed"
      v-model="selector.convoyed"
      @change="resetSelectorFrom('convoyed')"
      class="select"
    >
      <option :value="null" disabled hidden>...</option>
      <option
        v-for="convoyed in convoyedOptions"
        :key="convoyed"
        :value="convoyed"
      >
        {{ convoyed ? "VIA CONVOY" : "VIA LAND" }}
      </option>
    </select>
  </div>
</template>

<script lang="ts">
import _ from "lodash";
import { defineComponent, PropType } from "vue";
import {
  Order,
  Unit,
  OrderType,
  UnitLocation,
  isSupportOrderType,
  OrderWithReceiver,
  SupportOrder,
  OrderWithTarget,
  MoveOrder,
  isOrderTypeWithReceiver,
  isOrderTypeWithTarget,
} from "../types";
import { formatUnit, formatOrderType, formatLocation } from "../formatters";

interface OrderSelector {
  unit?: Unit;
  orderType?: OrderType;
  receiver?: Unit;
  supportedOrderType?: OrderType;
  target?: UnitLocation;
  convoyed?: boolean;
}

const emptySelector: OrderSelector = {
  unit: null,
  orderType: null,
  receiver: null,
  supportedOrderType: null,
  target: null,
  convoyed: null,
};

function selectorFromOrder(order: Order): OrderSelector {
  let t = order.type;
  let supportedOrderType = null;
  if (isSupportOrderType(t)) {
    if (t === OrderType.SupportHold) {
      supportedOrderType = OrderType.Hold;
    } else {
      supportedOrderType = OrderType.Move;
    }
    t = OrderType.SupportHold;
  }

  return {
    unit: order.unit,
    orderType: t,
    receiver: order["receiver"] || null,
    supportedOrderType: supportedOrderType,
    target: order["target"] || null,
    convoyed: "convoyed" in order ? order["convoyed"] : null,
  };
}

function orderFromSelector(s: OrderSelector): Order {
  let type: OrderType;
  if (!isSupportOrderType(s.orderType)) {
    type = s.orderType;
  } else {
    if (s.supportedOrderType === OrderType.Hold) {
      type = OrderType.SupportHold;
    } else {
      type = OrderType.SupportMove;
    }
  }

  return <Order>(
    Object.assign(
      { type, unit: s.unit },
      s.receiver && { receiver: s.receiver },
      s.target && { target: s.target },
      s.convoyed !== null && { convoyed: s.convoyed }
    )
  );
}

function selectorUntil(selector: OrderSelector, prop: string): OrderSelector {
  const allProps = [
    "unit",
    "orderType",
    "receiver",
    "supportedOrderType",
    "target",
    "convoyed",
  ];
  const propIndex = allProps.indexOf(prop);
  if (propIndex < 0) {
    throw Error("unknown selector prop " + prop);
  }
  const props = allProps.slice(propIndex + 1);
  let overwrites = {};
  for (const prop of props) {
    overwrites[prop] = null;
  }
  return _.assign(selector, overwrites);
}

function filterOrders(orders: Order[], selector: OrderSelector): Order[] {
  let filteredOrders = orders;

  if (selector.unit) {
    filteredOrders = filteredOrders.filter((o) =>
      _.isEqual(o.unit, selector.unit)
    );
  }

  if (selector.orderType || selector.orderType === 0) {
    if (isSupportOrderType(selector.orderType)) {
      filteredOrders = filteredOrders.filter((o) => isSupportOrderType(o.type));
    } else {
      filteredOrders = filteredOrders.filter(
        (o) => o.type === selector.orderType
      );
    }
  }

  if (selector.receiver) {
    filteredOrders = filteredOrders.filter(
      (o) => "receiver" in o && _.isEqual(o.receiver, selector.receiver)
    );
  }

  if (selector.supportedOrderType || selector.supportedOrderType === 0) {
    let type: OrderType;
    switch (selector.supportedOrderType) {
      case OrderType.Hold:
        type = OrderType.SupportHold;
        break;
      case OrderType.Move:
        type = OrderType.SupportMove;
        break;
      default:
        console.error(
          "supported order type must be move or hold, but it's",
          OrderType[type]
        );
    }
    if (selector.supportedOrderType === OrderType.Move) {
      filteredOrders = filteredOrders.filter((o) => o.type === type);
    }
  }

  if (selector.target) {
    filteredOrders = filteredOrders.filter(
      (o) => "target" in o && _.isEqual(o.target, selector.target)
    );
  }

  if (selector.convoyed !== null && selector.convoyed !== undefined) {
    filteredOrders = filteredOrders.filter(
      (o) => "convoyed" in o && o.convoyed === selector.convoyed
    );
  }

  return filteredOrders;
}

export default defineComponent({
  name: "OrderSelector",
  props: {
    modelValue: Object as PropType<Order>,
    orders: Object as PropType<Order[]>,
  },
  emits: ["update:modelValue"],

  data() {
    return {
      selector: _.clone(emptySelector),
      lastEmittedModelValue: this.modelValue,
    };
  },

  computed: {
    unitEnabled() {
      return this.orders.length > 0;
    },
    orderTypeEnabled() {
      return !!this.selector.unit;
    },
    receiverEnabled() {
      return this.showReceiver;
    },
    supportedOrderTypeEnabled() {
      if (!this.showSupportedOrderType) {
        return false;
      }
      return !!this.selector.receiver;
    },
    targetEnabled() {
      if (!this.showTarget) {
        return false;
      }
      if (this.showReceiver && !this.selector.receiver) {
        return false;
      }
      if (this.showSupportedOrderType && !this.selector.supportedOrderType) {
        return false;
      }
      return true;
    },

    showReceiver() {
      if (!this.selector.orderType && this.selector.orderType !== 0) {
        return false;
      }
      return isOrderTypeWithReceiver(this.selector.orderType);
    },
    showSupportedOrderType() {
      if (!this.selector.orderType && this.selector.orderType !== 0) {
        return false;
      }
      return isSupportOrderType(this.selector.orderType);
    },
    showTarget() {
      if (!this.selector.orderType && this.selector.orderType !== 0) {
        return false;
      }
      if (isSupportOrderType(this.selector.orderType)) {
        if (
          !this.selector.supportedOrderType ||
          this.selector.supportedOrderType === 0
        ) {
          return false;
        }
        return this.selector.supportedOrderType === OrderType.Move;
      }
      return isOrderTypeWithTarget(this.selector.orderType);
    },
    showConvoyed() {
      if (!this.selector.unit) {
        return false;
      }
      if (this.selector.orderType !== OrderType.Move) {
        return false;
      }
      if (!this.selector.target) {
        return false;
      }
      const options = this.convoyedOptions;
      if (options.length === 1 && options[0] === false) {
        return false;
      }
      return true;
    },

    isComplete() {
      if (!this.selector.unit) {
        return false;
      }
      if (!this.selector.orderType && this.selector.orderType !== 0) {
        return false;
      }

      if (this.showReceiver && !this.selector.receiver) {
        return false;
      }
      if (
        this.showSupportedOrderType &&
        !this.selector.supportedOrderType &&
        this.selector.supportedOrderType !== 0
      ) {
        return false;
      }
      if (this.showTarget && !this.selector.target) {
        return false;
      }

      if (
        this.showConvoyed &&
        (this.selector.convoyed === null ||
          this.selector.convoyed === undefined)
      ) {
        return false;
      }

      return true;
    },
    selectedOrder() {
      if (!this.isComplete) {
        return null;
      }
      return orderFromSelector(this.selector);
    },

    unitOptions() {
      const units = this.orders.map((o) => o.unit);
      return _.uniqWith(units, _.isEqual);
    },
    orderTypeOptions() {
      const selector = _.pick(this.selector, ["unit"]);
      const orders = filterOrders(this.orders, selector);
      const types = orders.map((o) =>
        isSupportOrderType(o.type) ? OrderType.SupportHold : o.type
      );
      return _.uniq(types);
    },
    receiverOptions() {
      const selector = _.pick(this.selector, ["unit", "orderType"]);
      const orders = filterOrders(this.orders, selector);
      const ordersWithReceiver = orders.filter(
        (o) => "receiver" in o
      ) as OrderWithReceiver[];
      const receivers = ordersWithReceiver.map((o) => o.receiver);
      return _.uniqWith(receivers, _.isEqual);
    },
    supportedOrderTypeOptions() {
      const selector = _.pick(this.selector, ["unit", "orderType", "receiver"]);
      const orders = filterOrders(this.orders, selector);
      const supportOrders = orders.filter((o) =>
        isSupportOrderType(o.type)
      ) as SupportOrder[];
      const supportedOrderTypes = supportOrders.map((o) =>
        o.type === OrderType.SupportHold ? OrderType.Hold : OrderType.Move
      );
      return _.uniq(supportedOrderTypes);
    },
    targetOptions() {
      const selector = _.pick(this.selector, [
        "unit",
        "orderType",
        "receiver",
        "supportedOrderType",
      ]);
      const orders = filterOrders(this.orders, selector);
      const ordersWithTarget = orders.filter(
        (o) => "target" in o
      ) as OrderWithTarget[];
      const targets = ordersWithTarget.map((o) => o.target);
      return _.uniqWith(targets, _.isEqual);
    },
    convoyedOptions() {
      const selector = _.pick(this.selector, [
        "unit",
        "orderType",
        "receiver",
        "supportedOrderType",
        "target",
      ]);
      const orders = filterOrders(this.orders, selector);
      const moveOrders = orders.filter(
        (o) => o.type === OrderType.Move
      ) as MoveOrder[];
      const options = moveOrders.map((o) => o.convoyed);
      return _.uniq(options);
    },
  },

  watch: {
    selector: {
      handler() {
        let modelValue = this.selectedOrder;
        if (_.isEqual(modelValue, this.lastEmittedModelValue)) {
          return;
        }
        this.lastEmittedModelValue = modelValue;
        this.$emit("update:modelValue", modelValue);
      },
      deep: true,
      immediate: true,
    },
  },

  created() {
    this.$watch(
      () => [this.orders, this.modelValue],
      ([newOrders, newModelValue], [oldOrders]) => {
        if (!_.isEqual(newOrders, oldOrders)) {
          this.selector = _.clone(emptySelector);
        }
        if (newModelValue) {
          const selector = selectorFromOrder(this.modelValue);
          if (filterOrders(this.orders, selector).length > 0) {
            this.selector = selector;
          }
        }
      }
    );
  },

  methods: {
    formatUnit,
    formatOrderType,
    formatLocation,

    resetSelectorFrom(property) {
      this.selector = selectorUntil(this.selector, property);
      this.setSingleOptions();
    },
    setSingleOptions() {
      if (this.unitOptions.length === 1) {
        this.selector.unit = this.unitOptions[0];
      }
      if (this.orderTypeOptions.length === 1) {
        this.selector.orderType = this.orderTypeOptions[0];
      }
      if (this.receiverOptions.length === 1) {
        this.selector.receiver = this.receiverOptions[0];
      }
      if (this.supportedOrderTypeOptions.length === 1) {
        this.selector.supportedOrderType = this.supportedOrderTypeOptions[0];
      }
      if (this.targetOptions.length === 1) {
        this.selector.target = this.targetOptions[0];
      }
      if (this.convoyedOptions.length === 1) {
        this.selector.convoyed = this.convoyedOptions[0];
      }
    },
  },
});
</script>
