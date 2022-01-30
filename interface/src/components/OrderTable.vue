<template>
  <div class="mt-8 mb-4 flex flex-wrap justify-around gap-x-4">
    <div
      v-for="(ordersForPower, power) in orders"
      :key="power"
      class="w-full sm:w-2/6 lg:w-3/12"
    >
      <h1 class="text-xl font-bold text-center mt-4">{{ power }}</h1>
      <table class="table-fixed mx-auto w-full">
        <thead>
          <tr>
            <th class="font-bold text-gray-400 text-left w-3/4">Order</th>
            <th class="font-bold text-gray-400 text-right w-1/4">Effect</th>
          </tr>
        </thead>

        <tbody>
          <tr v-for="(order, i) in ordersForPower" :key="i" class="">
            <td class="font-mono">{{ order.rawOrder }}</td>
            <td class="text-right">{{ getEffect(order) }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <div v-if="empty">
      <p class="mb-4 text-center">
        No orders have been submitted for this phase.
      </p>
    </div>
  </div>
</template>

<script>
export default {
  name: "OrderTable",
  props: {
    orders: {
      default: {},
    },
  },

  computed: {
    empty() {
      for (const orders of Object.values(this.orders)) {
        if (orders.length > 0) {
          return false;
        }
      }
      return true;
    },
  },

  methods: {
    getEffect(o) {
      if (!o.accepted) {
        return "Rejected";
      }
      if (o.results.bounce) {
        return "Bounce";
      }
      if (o.results.cut) {
        return "Cut";
      }
      if (o.results.void) {
        return "Void";
      }
      return "Success";
    },
  },
};
</script>
